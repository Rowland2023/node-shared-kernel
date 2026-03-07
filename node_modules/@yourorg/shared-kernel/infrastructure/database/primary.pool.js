import pg from 'pg';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Setup Path Resolution for .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we point to the root .env (adjust '../' count if folder depth changes)
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

// 2. Destructure and Clean Environment Variables
const {
  DB_HOST = '127.0.0.1',
  DB_PORT = 5432,
  DB_USER = 'postgres',
  DB_PASSWORD,
  DB_NAME,
  REDIS_HOST = '127.0.0.1',
  REDIS_PORT = 6379,
  REDIS_PASSWORD
} = process.env;

/**
 * 3. POSTGRES POOL 
 * Named 'primaryPool' for repository compatibility.
 */
export const primaryPool = new pg.Pool({
  host: String(DB_HOST).trim(),
  port: parseInt(DB_PORT) || 5432,
  user: String(DB_USER).trim(),
  password: String(DB_PASSWORD), // String wrapper handles special chars like @
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
    // Safety check: log length only (don't log the actual password!)
    console.log(`Debug Info -> User: ${DB_USER}, Host: ${DB_HOST}, Pass Length: ${DB_PASSWORD?.length || 0}`);
  });

/**
 * 4. REDIS (Forcing Standalone Mode)
 */
export const redis = new Redis({
  host: String(REDIS_HOST).trim(),
  port: parseInt(REDIS_PORT) || 6379,
  password: REDIS_PASSWORD,
  // This explicitly prevents 'ioredis' from attempting cluster commands on a single node
  retryStrategy: (times) => Math.min(times * 2000, 30000),
});

redis.on('connect', () => {
  console.log('✅ Redis connected (standalone mode)');
});

redis.on('error', (err) => {
  // If "Cluster" errors persist, search your project for 'new Redis.Cluster'
  console.warn(`[Redis] Status: ${err.message}`);
});