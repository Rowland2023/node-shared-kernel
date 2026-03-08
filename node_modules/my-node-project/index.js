import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

// 1. MODULE ROUTER IMPORTS
import ledgerRouter from './src/modules/ledger/router.js';
import orderRouter from './src/modules/orders/router.js';

// --- REMOVED THE DUPLICATE STATIC IMPORT OF processOutbox FROM HERE ---

// 2. RESOLVE DOTENV PATH
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

/**
 * 3. PRE-FLIGHT CHECK
 */
console.log('--- Environment Check ---');
if (!process.env.DB_PASSWORD) {
  console.error('❌ ERROR: DB_PASSWORD missing in .env!');
} else {
  console.log('✅ DB_PASSWORD detected.');
}
console.log('-------------------------');

/**
 * 4. DYNAMIC SHARED-KERNEL IMPORT
 * We pull everything (Middleware, Infra, and the Outbox Service) from the kernel.
 */
const { 
  middleware, 
  infrastructure, 
  processOutbox // <--- This is now the single source of truth for this identifier
} = await import('@yourorg/shared-kernel');

const { primaryPool } = infrastructure;
const { rateLimiter, authMiddleware } = middleware;

const app = express();
app.use(express.json());

/**
 * 5. PUBLIC ROUTES
 */
app.get('/ping', (req, res) => res.send('pong'));


/**
 * 6. THE BOUNCER (Global Authentication)
 */
app.use(authMiddleware);

/**
 * 7. PROTECTED MODULE ROUTES
 */
app.use('/api/ledger', ledgerRouter);
app.use('/api/orders', orderRouter);

app.get('/me', (req, res) => {
  res.json({ message: 'You are authenticated!', user: req.user });
});

/**
 * 8. INFRASTRUCTURE & BACKGROUND WORKERS
 */
(async () => {
  try {
    // Verify DB Connection before starting server
    await primaryPool.query('SELECT 1');
    console.log('✅ Postgres connected to:', process.env.DB_NAME);

    /**
     * START THE OUTBOX PROCESSOR (Background Loop)
     * Reliability: This ensures eventual consistency for distributed events.
     */
    setInterval(async () => {
      try {
        await processOutbox();
      } catch (err) {
        console.error('❌ Outbox Processor Error:', err.message);
      }
    }, 5000);
    
    console.log('🔄 Outbox Processor started (5s interval)');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🚀 Using workspace: my-node-project`);
    });
  } catch (err) {
    console.error('❌ Infrastructure initialization failed:', err.message);
    process.exit(1);
  }
})();