import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

// 1. LOAD ENV IMMEDIATELY (Before importing the kernel)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

// 2. NOW IMPORT THE KERNEL (Now that process.env is populated)
const { 
  infrastructure, 
  startOutboxWorker,
  startCleanupJob
} = await import('@yourorg/shared-kernel');

const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    console.log('🏁 Starting Bootstrap...');

    // 3. SEQUENTIAL BOOT (The Waterfall)
    // Connecting Redis first
    await infrastructure.connectRedis();
    
    // Connecting Kafka (This will now find your brokers in process.env)
    console.log('📡 Connecting to Kafka...');
    await infrastructure.connectKafka(); 
    console.log('✅ Kafka Producer Connected');

    // 4. START SERVER
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      
      // 5. START WORKERS (Wait for idle to prevent TimeoutNegativeWarning)
      startOutboxWorker(5000); 
      startCleanupJob();
    });

  } catch (err) {
    console.error('❌ Bootstrapping failed:', err.message);
    process.exit(1);
  }
})();