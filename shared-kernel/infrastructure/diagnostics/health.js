import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Point directly to the actual files
// Replace 'postgres.js' with whatever is inside your infrastructure/database/ folder
import pool from '../database/primary.pool.js'; 
import { kafka } from '../messageBroker.js'; 
// import redis from '../cache/redis.js'; // Uncomment if you have this file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../../.env');

config({ path: envPath });

async function runHealthCheck() {
  console.log('🩺 [Lagos Infrastructure] Starting System Health Check...');
  const results = [];

  // 2. Use 'pool' directly instead of 'infrastructure.primaryPool'
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    results.push({ resource: 'Postgres', status: '✅ UP' });
  } catch (err) {
    results.push({ resource: 'Postgres', status: '❌ DOWN', info: err.message });
  }

  // ... (Same logic for Kafka using the 'kafka' import)

  console.table(results);
  process.exit(0);
}

runHealthCheck();