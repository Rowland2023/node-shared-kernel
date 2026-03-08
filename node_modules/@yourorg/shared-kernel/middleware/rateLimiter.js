// 1. Pointing to the actual filename found on disk
import { redis } from '../infrastructure/cache/redis.cluster.js';

/**
 * Higher-Order Function for Rate Limiting
 * @param {number} limit - Max requests allowed
 * @param {number} windowSeconds - Time window in seconds
 */
export default function rateLimiter(limit = 100, windowSeconds = 60) {
  return async (req, res, next) => {
    try {
      const key = `rate:${req.ip}`;
      
      // Atomic increment in Redis
      const count = await redis.incr(key);

      // Set expiration only on the first hit
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Check threshold
      if (count > limit) {
        return res.status(429).json({ 
          error: 'Too many requests',
          retryAfter: windowSeconds 
        });
      }

      next();
    } catch (err) {
      // If Redis is down, we "fail open" so users can still register
      console.error('[RateLimiter] Redis Error:', err.message);
      next();
    }
  };
}