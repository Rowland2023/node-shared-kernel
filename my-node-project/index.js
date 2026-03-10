import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

// 1. MODULE ROUTER IMPORTS
import ledgerRouter from './src/modules/ledger/router.js';
import orderRouter from './src/modules/orders/router.js';

// 2. RESOLVE DOTENV PATH
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

// 3. INITIALIZE APP & GLOBALS
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// 4. MIDDLEWARE
app.use(express.json());
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 5. PUBLIC ROUTES
app.get('/ping', (req, res) => res.status(200).send('pong'));

/**
 * 6. INFRASTRUCTURE & STARTUP
 */
(async () => {
  try {
    // A. DYNAMIC IMPORT FROM SHARED KERNEL
    const { 
      middleware, 
      infrastructure, 
      processOutbox 
    } = await import('@yourorg/shared-kernel');

    const { authMiddleware } = middleware;

    // B. APPLY AUTH BOUNCER & ROUTES
    app.use(authMiddleware(JWT_SECRET));
    app.use('/api/ledger', ledgerRouter);
    app.use('/api/orders', orderRouter);

    // C. VERIFY DB & KAFKA
    await infrastructure.primaryPool.query('SELECT 1');
    console.log('✅ Postgres connected to:', process.env.DB_NAME);

    if (infrastructure.producer) {
      console.log(`📡 Connecting Kafka Producer to ${process.env.KAFKA_BROKER}...`);
      await infrastructure.producer.connect();
      console.log('✅ Kafka Producer Connected');
    }

    // D. START WORKER & SERVER
    await processOutbox(); 
    console.log('🔄 Outbox Processor Active');

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('❌ Bootstrapping failed!');
    console.error(`- Error Message: ${err.message}`);
    process.exit(1);
  }
})();