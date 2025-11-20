import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXP || '15m'
  });
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXP || '7d'
  });
}

export function verifyToken(token, type = 'access') {
  const secret = type === 'access'
    ? process.env.JWT_ACCESS_SECRET
    : process.env.JWT_REFRESH_SECRET;
  return jwt.verify(token, secret);
}
