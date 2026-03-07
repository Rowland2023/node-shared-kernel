// /shared/middleware/authMiddleware.js
import { verifyJWT } from '../security-core/jwtVerifier.js';
import { jwtSecret } from '../config/security-secrets.js';

// /shared-kernel/middleware/authMiddleware.js
export default function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  try {
    const decoded = verifyJWT(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
