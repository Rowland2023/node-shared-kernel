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

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

/**
 * 3. MIDDLEWARE STACK (Order Matters!)
 */
// A. Standard JSON Parsing
app.use(express.json());

// B. Global Logging (Crucial for debugging "hangs")
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * 4. PUBLIC ROUTES
 * These must be defined BEFORE the global auth bouncer.
 */
app.get('/ping', (req, res) => res.status(200).send('pong'));

/**
 * 5. DYNAMIC SHARED-KERNEL IMPORT & INITIALIZATION
 */
const { 
  middleware, 
  infrastructure, 
  processOutbox 
} = await import('@yourorg/shared-kernel');

const { primaryPool } = infrastructure;
const { authMiddleware } = middleware;

/**
 * 6. THE BOUNCER (Global Authentication)
 * We call authMiddleware(JWT_SECRET) so it returns the actual (req, res, next) function.
 */
app.use(authMiddleware(JWT_SECRET));

/**
 * 7. PROTECTED MODULE ROUTES
 */
app.use('/api/ledger', ledgerRouter);
app.use('/api/orders', orderRouter);

app.get('/me', (req, res) => {
  res.json({ message: 'Identity confirmed.', user: req.user });
});

/**
 * 8. GLOBAL ERROR HANDLER
 * Catches malformed JSON and unhandled middleware exceptions.
 */
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON Syntax Error:', err.message);
    return res.status(400).json({ error: "Malformed JSON payload" });
  }
  
  console.error('💥 Server Error:', err.stack);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * 9. INFRASTRUCTURE & STARTUP
 */
(async () => {
  try {
    // Verify DB
    await primaryPool.query('SELECT 1');
    console.log('✅ Postgres connected to:', process.env.DB_NAME);

    // Start Outbox Worker
    await processOutbox(); 
    console.log('🔄 Outbox Processor Active');

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Bootstrapping failed:', err.message);
    process.exit(1);
  }
})();