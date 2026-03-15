// index.js
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

// Resolve paths for ES Modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

// Import router and shared kernel
import ledgerRouter from './src/modules/ledger/router.js';
const { infrastructure, startOutboxWorker, startCleanupJob } = await import('@yourorg/shared-kernel');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mount routers
app.use('/api/v1/ledger', ledgerRouter);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Startup logic
app.listen(PORT, async () => {
  console.log(`🚀 API GATEWAY LIVE: http://localhost:${PORT}`);
  console.log('🏁 Starting Lagos Ledger Infrastructure Handshake...');

  try {
    // Connect Redis once
    await infrastructure.connectRedis();
    console.log('✅ Redis: Connected (Port 6380)');

    // Connect Postgres once
    await infrastructure.connectPostgres();
    console.log('✅ Postgres: Connected');

    // Connect Kafka once and initialize producer
    console.log('📡 Connecting to Kafka (Port 19092)...');
    await infrastructure.connectKafka();   // sets up producer internally
    console.log('✅ Kafka: Connected');

    // Start background workers
    startOutboxWorker(5000);
    startCleanupJob();
    console.log('⚙️ Workers: Outbox and Cleanup started.');
  } catch (err) {
    console.error('⚠️ Infrastructure Warning:', err.message);
    console.log('💡 Tip: Ensure Docker containers are healthy and ports match .env');
  }
});
