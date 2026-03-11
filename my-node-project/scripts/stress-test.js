// scripts/stress-test.js
import { infrastructure } from '../../shared-kernel/index.js'; 

// Destructure from infrastructure instead of services
const { primaryPool } = infrastructure;

async function generateLoad(count = 100) {
  // Guard check to catch the error early
  if (!primaryPool) {
    console.error('❌ Error: primaryPool is undefined. Check your shared-kernel exports.');
    return;
  }

  console.log(`🚀 Injecting ${count} concurrent transfers into the Ledger...`);
  
  const tasks = [];
  const start = Date.now();

  for (let i = 0; i < count; i++) {
    const amount = (Math.random() * 1000).toFixed(2);
    
    // Multi-statement query to handle Ledger + Outbox atomically
    const query = `
      WITH ledger_entry AS (
        INSERT INTO ledger (account_id, amount, type) 
        VALUES ('acc_test_123', ${amount}, 'CREDIT') 
        RETURNING id
      )
      INSERT INTO outbox (event_type, payload)
      SELECT 'FUNDS_TRANSFERRED', jsonb_build_object(
        'ledgerId', id, 
        'amount', ${amount}, 
        'currency', 'NGN'
      ) FROM ledger_entry;
    `;
    
    tasks.push(primaryPool.query(query));
  }

  try {
    await Promise.all(tasks);
    const duration = Date.now() - start;
    console.log(`✅ Successfully injected ${count} events in ${duration}ms`);
  } catch (err) {
    console.error('❌ Stress Test Failed:', err.message);
  }
}

generateLoad(100);``