import { poolPromise } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { addToBlacklist, isBlacklisted } from '../utils/tokenBlacklist.js';

export const register = async (req, res) => {
  console.log('Register request body:', req.body);
  const { email, password, fullName, role = 'donor' } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  try {
    const pool = await poolPromise;

    // Verify if user exists
    const existingUser = await pool
      .request()
      .input('email', email)
      .query('SELECT id FROM users WHERE email = @email');

    if (existingUser.recordset.length > 0)
      return res.status(400).json({ message: 'User already exists' });

    const hashed = await hashPassword(password);
    const newId = uuidv4();

    await pool
      .request()
      .input('id', newId)
      .input('email', email)
      .input('password', hashed)
      .input('fullName', fullName)
      .input('role', role)
      .query(`
        INSERT INTO users (id, email, password_hash, full_name, role)
        VALUES (@id, @email, @password, @fullName, @role)
      `);

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * login - small update: tokens are returned
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('email', email)
      .query('SELECT id, password_hash, role FROM users WHERE email = @email');

    if (result.recordset.length === 0)
      return res.status(401).json({ message: 'Invalid credentials' });

    const user = result.recordset[0];
    const match = await comparePassword(password, user.password_hash);

    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' });

    // Generate tokens using the helpers
    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: { id: user.id, email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 * Validates refresh token, generates new access + refresh tokens.
 */
export const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Missing refreshToken' });
  }

  try {
    // 1) check blacklist (if invalidated)
    if (isBlacklisted(refreshToken)) {
      return res.status(401).json({ message: 'Refresh token invalidated' });
    }

    // 2) verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 3) find user in DB
    const pool = await poolPromise;
    const userReq = await pool
      .request()
      .input('user_id', decoded.id)
      .query('SELECT id, email, full_name, role FROM users WHERE id = @user_id');

    if (userReq.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userReq.recordset[0];

    // 4) generate new tokens
    const newAccessToken = generateAccessToken({ id: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    return res.status(200).json({
      message: 'Tokens refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('Error verifying refresh token:', err);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

/**
 * POST /api/auth/logout
 * Body optional: { refreshToken }
 * We invalidate the received refresh token and the current access token.
 * It requires that the client send Authorization Bearer or at least the refreshToken.
 */
export const logout = async (req, res) => {
  try {
    const providedRefreshToken = req.body?.refreshToken;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    // Blacklist the refresh token if provided
    if (providedRefreshToken) addToBlacklist(providedRefreshToken);

    // Blacklist the access token if provided
    if (accessToken) addToBlacklist(accessToken);

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
