import Redis from 'ioredis';

const isCluster = process.env.REDIS_MODE === 'cluster';

/**
 * ✅ SMART INITIALIZATION
 * If REDIS_MODE is 'cluster', it uses the Cluster constructor.
 * Otherwise, it uses Standalone, which works perfectly with your local Redis.
 */
export const redis = isCluster
  ? new Redis.Cluster([
      { 
        host: process.env.REDIS_HOST || '127.0.0.1', 
        port: process.env.REDIS_PORT || 6379 
      }
    ], {
      clusterRetryStrategy: (times) => Math.min(times * 2000, 30000),
      enableOfflineQueue: false 
    })
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => Math.min(times * 2000, 30000),
    });

// Standard event listeners
redis.on('connect', () => console.log(`✅ Redis connected (${isCluster ? 'Cluster' : 'Standalone'})`));
redis.on('error', (err) => console.warn(`⚠️ [Redis] ${err.message}`));

/**
 * Cache Helpers (Simplified)
 * These work for BOTH Cluster and Standalone because ioredis 
 * shares the same API for .get and .set!
 */
export async function setCache(key, value, ttlSeconds = 60) {
  try {
    // Note: status 'connect' or 'ready' is usually fine
    if (redis.status === 'end') return; 
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.error('Redis SetCache Error:', err.message);
  }
}

export async function getCache(key) {
  try {
    if (redis.status === 'end') return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}