// shared-kernel/middleware/idempotency.js
import { checkAndSet } from '../config/redis.js';

export const idempotencyMiddleware = async (req, res, next) => {
  const key = req.headers['x-idempotency-key'];
  if (!key) return next();

  const isNewRequest = await checkAndSet(`idemp:${key}`, 86400);
  
  if (!isNewRequest) {
    return res.status(409).json({ 
      error: "Conflict", 
      message: "This request is already being processed or has finished." 
    });
  }
  next();
};