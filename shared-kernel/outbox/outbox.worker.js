// shared-kernel/outbox/outbox.worker.js
// outbox.worker.js
import { primaryPool } from '../infrastructure/database/primary.pool.js';
import { kafka } from '../infrastructure/messaging/kafka.client.js';

const producer = kafka.producer();
let isProducerConnected = false;

export async function processOutbox() {
  if (!isProducerConnected) {
    await producer.connect();
    isProducerConnected = true;
  }

  const client = await primaryPool.connect();
  
  try {
    // 1. ATOMIC FETCH & LOCK (The "Banking Standard")
    // We grab 50 at a time to keep memory low but throughput high
    const result = await client.query(`
      UPDATE outbox 
      SET status = 'PROCESSING', updated_at = NOW()
      WHERE id IN (
        SELECT id FROM outbox 
        WHERE status = 'PENDING' 
        ORDER BY created_at ASC 
        LIMIT 50 
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *;
    `);

    if (result.rowCount === 0) return 0;

    // 2. BATCH PUBLISH TO KAFKA
    const messages = result.rows.map(row => ({
      key: String(row.aggregate_id),
      value: JSON.stringify(row.payload),
    }));

    await producer.send({
      topic: 'bank-transfers',
      messages,
    });

    // 3. FINAL COMMIT
    await client.query(
      "UPDATE outbox SET status = 'COMPLETED' WHERE id = ANY($1)",
      [result.rows.map(r => r.id)]
    );

    console.log(`🚀 Relayed ${result.rowCount} events to Kafka`);
    return result.rowCount;
  } catch (err) {
    console.error('❌ Relay Error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}