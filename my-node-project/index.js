import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

// 1. RESOLVE DOTENV PATH
// We manually point to the root folder since we are running in a workspace
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

/**
 * 2. PRE-FLIGHT CHECK
 */
console.log('--- Environment Check ---');
console.log('Looking for .env at:', path.resolve(__dirname, '../.env'));

if (!process.env.DB_PASSWORD) {
  console.error('❌ ERROR: DB_PASSWORD is still missing from process.env!');
  console.log('Current WorkDir:', process.cwd());
} else {
  console.log('✅ DB_PASSWORD detected.');
}
console.log('-------------------------');

/**
 * 3. DYNAMIC IMPORT
 */
const { middleware, infrastructure } = await import('@yourorg/shared-kernel');

const app = express();

// Middleware
app.use(middleware.authMiddleware);

// Routes
app.get('/ping', (req, res) => res.send('pong'));

/**
 * 4. INFRASTRUCTURE INITIALIZATION
 */
(async () => {
  const { primaryPool } = infrastructure;
  
  try {
    const result = await primaryPool.query('SELECT 1');
    console.log('🚀 DB test success:', result.rows);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    
    if (err.message.includes('password must be a string')) {
      console.log('💡 TIP: The Pool was initialized before the .env was loaded.');
    }
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});