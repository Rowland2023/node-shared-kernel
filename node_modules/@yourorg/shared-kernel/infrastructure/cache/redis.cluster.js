import Redis from 'ioredis';

// 1. Strict Config Cleaning
const getRedisPassword = () => {
  const pwd = process.env.REDIS_PASSWORD;
  // Handle empty or undefined strings from .env
  if (!pwd || pwd.trim() === '' || pwd === 'undefined' || pwd === 'null') {
    return null;
  }
  return pwd.trim();
};

const config = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6380, // Default to 6380 based on your .env
  password: getRedisPassword(),
  mode: process.env.REDIS_MODE || 'standalone',
};

/**
 * ✅ CONNECTION FACTORY
 */
const createClient = () => {
  const commonOptions = {
    ...(config.password && { password: config.password }),
    retryStrategy: (times) => Math.min(times * 2000, 30000),
    
    // 🛡️ THE FIX: Disable offline queue to prevent the "Hanging Curl"
    // If Redis is down, we want an immediate error, not a pending promise.
    enableOfflineQueue: false, 
    connectTimeout: 5000,
  };

  if (config.mode === 'cluster') {
    return new Redis.Cluster([{ host: config.host, port: config.port }], {
      redisOptions: commonOptions,
      clusterRetryStrategy: (times) => Math.min(times * 2000, 30000),
    });
  }

  return new Redis({
    host: config.host,
    port: config.port,
    ...commonOptions,
  });
};

export const redis = createClient();

// 2. Lifecycle Logging
redis.on('connect', () => console.log(`📡 Redis: Connecting to ${config.mode} on port ${config.port}...`));
redis.on('ready', () => console.log(`🚀 Redis: Ready (${config.mode})`));

redis.on('error', (err) => {
  if (err.message.includes('NOAUTH')) {
    console.error('❌ Redis Auth Error: Check your REDIS_PASSWORD in .env');
  } else {
    // This will now log instantly if port 6380 is blocked/refused
    console.warn(`⚠️ Redis Error: ${err.message}`);
  }
});

/**
 * ✅ CACHE ABSTRACTION LAYER
 */
export const cache = {
  async set(key, value, ttl = 60) {
    try {
      if (redis.status !== 'ready') return;
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      await redis.set(key, data, 'EX', ttl);
    } catch (err) {
      console.error(`[Cache Set Error] ${key}:`, err.message);
    }
  },

  async get(key) {
    try {
      if (redis.status !== 'ready') return null;
      const data = await redis.get(key);
      if (!data) return null;
      try { return JSON.parse(data); } catch { return data; }
    } catch (err) {
      console.error(`[Cache Get Error] ${key}:`, err.message);
      return null;
    }
  }
};