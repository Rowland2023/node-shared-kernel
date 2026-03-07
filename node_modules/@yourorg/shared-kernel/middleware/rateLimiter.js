// /shared/middleware/rateLimiter.js
// Change this:
// import { redis } from '../../infrastructure/cache/redis.cluster.js';

// To this (pointing to your standalone config):
import { redis } from '../infrastructure/cache/redis.js';

export function rateLimiter(limit = 100, windowSeconds = 60) {
  return async (req, res, next) => {
    const key = `rate:${req.ip}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    if (count > limit) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}
