// /shared/security-core/authMiddleware.js
import { verifyJWT } from './jwtVerifier.js';

export function authMiddleware(secret) {
  return (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      req.user = verifyJWT(token, secret);
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
