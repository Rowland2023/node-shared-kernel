import Redis from 'ioredis';

/**
 * This script intelligently switches between Cluster and Standalone modes.
 * It prevents the "Failed to refresh slots cache" error by checking 
 * the REDIS_MODE environment variable.
 */

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined, // Use undefined if no password
  retryStrategy: (times) => Math.min(times * 2000, 30000),
};

const isCluster = process.env.REDIS_MODE === 'cluster';

export const redis = isCluster
  ? new Redis.Cluster([{ host: redisConfig.host, port: redisConfig.port }], {
      redisOptions: { password: redisConfig.password }
    })
  : new Redis(redisConfig);

// Success Logging
redis.on('connect', () => {
  const mode = isCluster ? 'CLUSTER' : 'STANDALONE';
  console.log(`✅ Redis connected (${mode} mode)`);
});

// Error Handling
redis.on('error', (err) => {
  // If we are in standalone mode, we want to see errors, but not the "slots" spam
  if (!isCluster && err.message.includes('slots')) return;
  
  console.warn(`⚠️ [Redis] Status: ${err.message}`);
});