import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { isBlacklisted } from '../utils/tokenBlacklist.js';

dotenv.config();

/**
 * requireAuth(requiredRoles = [])
 * Middleware que:
 *  - valida encabezado Authorization
 *  - extrae el raw token (req.token)
 *  - revisa blacklist
 *  - verifica JWT con JWT_ACCESS_SECRET
 *  - asigna req.user = { id, role }
 *  - valida roles: requireAuth(['admin'])
 */
export function requireAuth(requiredRoles = []) {
  return (req, res, next) => {
    try {
      // 1️⃣ Validar header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid authorization header' });
      }

      // 2️⃣ Extraer token
      const token = authHeader.split(' ')[1];
      req.token = token; // se usará en logout y blacklist

      // 3️⃣ Verificar blacklist
      if (isBlacklisted(token)) {
        return res.status(401).json({ message: 'Token invalidated. Please log in again.' });
      }

      // 4️⃣ Verificar token
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      // 5️⃣ Extraer id de usuario
      const userId =
        payload.sub ||
        payload.id ||
        payload.userID ||
        payload.userId ||
        payload.sub;

      const role =
        payload.role ||
        payload.rol ||
        payload.userRole;

      if (!userId) {
        return res.status(401).json({
          message: 'Invalid token payload: missing user ID'
        });
      }

      // 6️⃣ Verificación de roles si aplica
      if (
        Array.isArray(requiredRoles) &&
        requiredRoles.length > 0 &&
        !requiredRoles.includes(role)
      ) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      // 7️⃣ Construir objeto req.user para usar en controladores
      req.user = { id: userId, role };

      return next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}
