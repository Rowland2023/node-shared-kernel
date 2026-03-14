import pg from 'pg';
const { Pool } = pg;

// Define the pool but DON'T log or connect yet
export const primaryPool = new Pool({ /* your config */ });

export const connectPostgres = async () => {
  const client = await primaryPool.connect();
  console.log(`✅ Postgres connected to: ${process.env.DB_NAME}`);
  client.release();
};