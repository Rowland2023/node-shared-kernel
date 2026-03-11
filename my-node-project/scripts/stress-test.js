// scripts/stress-test.js
import { infrastructure } from '../../shared-kernel/index.js'; 

const { primaryPool } = infrastructure;

async function generateLoad(count = 100) {
  if (!primaryPool) {
    console.error('❌ Error: primaryPool is undefined. Check your shared-kernel exports.');
    return;
  }

  console.log(`🚀 Injecting ${count} concurrent transfers into the Ledger...`);
  
  const tasks = [];
  const start = Date.now();

  for (let i = 0; i < count; i++) {
    const amount = (Math.random() * 1000).toFixed(2);
    
    /**
     * UPDATED QUERY:
     * We now include aggregate_type and aggregate_id to satisfy 
     * the NOT NULL constraints in your existing outbox schema.
     */
    const query = {
      text: `
        WITH ledger_entry AS (
          INSERT INTO ledger (account_id, amount, type) 
          VALUES ($1, $2, $3) 
          RETURNING id
        )
        INSERT INTO outbox (
          event_type, 
          aggregate_type, 
          aggregate_id, 
          payload, 
          status
        )
        SELECT 
          'FUNDS_TRANSFERRED', 
          'Ledger', 
          id::text, 
          jsonb_build_object(
            'ledgerId', id, 
            'amount', $2, 
            'currency', 'NGN'
          ),
          'PENDING'
        FROM ledger_entry;
      `,
      values: ['acc_test_123', amount, 'CREDIT']
    };
    
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

generateLoad(100);