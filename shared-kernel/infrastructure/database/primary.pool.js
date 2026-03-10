import pg from 'pg';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 1. 🔍 Smart Path Resolution for .env
const localEnv = path.join(process.cwd(), '.env');
const parentEnv = path.join(process.cwd(), '..', '.env');

// Use the local one if it exists, otherwise fall back to the parent directory
const envPath = fs.existsSync(localEnv) ? localEnv : parentEnv;

const result = dotenv.config({ path: envPath });

if (result.error || !process.env.DB_NAME) {
  console.warn(`⚠️ [Config] Could not find valid variables at: ${envPath}. Check your .env location.`);
} else {
  console.log(`📡 [Config] Successfully loaded from: ${envPath}`);
}

// 2. Destructure and Clean Environment Variables
const {
  DB_HOST = '127.0.0.1',
  DB_PORT = 5432,
  DB_USER = 'postgres',
  DB_PASSWORD,
  DB_NAME,
  REDIS_HOST = '127.0.0.1',
  REDIS_PORT = 6380, // Matches your actual environment
  REDIS_PASSWORD
} = process.env;

/**
 * 3. 🐘 POSTGRES POOL 
 */
export const primaryPool = new pg.Pool({
  host: String(DB_HOST).trim(),
  port: parseInt(DB_PORT) || 5432,
  user: String(DB_USER).trim(),
  password: String(DB_PASSWORD), 
  database: String(DB_NAME).trim(),
  connectionTimeoutMillis: 5000, 
});

// Immediate DB Connection Test
primaryPool.connect()
  .then(client => {
    console.log(`✅ Postgres connected to: ${DB_NAME}`);
    client.release();
  })
  .catch(err => {
    console.error('❌ Postgres connection failed:', err.message);
    console.log(`👉 Auth Check: User="${DB_USER}", Host="${DB_HOST}", DB="${DB_NAME}"`);
  });

/**
 * 4. 🚩 REDIS (Standalone Mode)
 */
export const redis = new Redis({
  host: String(REDIS_HOST).trim(),
  port: parseInt(REDIS_PORT), 
  password: REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 2000, 30000),
  connectTimeout: 5000 
});

redis.on('connect', () => {
  console.log(`✅ Redis connected (standalone mode) on port: ${REDIS_PORT}`);
});

redis.on('error', (err) => {
  console.warn(`[Redis] Status: ${err.message}`);
});