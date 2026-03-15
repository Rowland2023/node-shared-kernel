import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
// 1. ADD THIS IMPORT HERE
import ledgerRouter from './routes/ledger.routes.js'; 

// --- ENV CONFIG ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

// --- KERNEL IMPORT ---
const { 
  infrastructure, 
  startOutboxWorker,
  startCleanupJob
} = await import('@yourorg/shared-kernel');

const app = express();

// 2. ADD THESE MIDDLEWARE LINES HERE (Before the (async () => {}) block)
app.use(express.json()); 
app.use('/api/v1/ledger', ledgerRouter); 

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    console.log('🏁 Starting Bootstrap...');

    // 3. SEQUENTIAL BOOT
    await infrastructure.connectRedis();
    
    console.log('📡 Connecting to Kafka...');
    await infrastructure.connectKafka(); 
    console.log('✅ Kafka Producer Connected');

    // 4. START SERVER
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      
      // 5. START WORKERS
      startOutboxWorker(5000); 
      startCleanupJob();
    });

  } catch (err) {
    console.error('❌ Bootstrapping failed:', err.message);
    process.exit(1);
  }
})();