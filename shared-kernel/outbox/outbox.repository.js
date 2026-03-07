// /shared/services/outboxService.js
import { primaryPool } from '../infrastructure/database/primary.pool.js';

export async function saveOutboxEvent(event) {
  const query = 'INSERT INTO outbox (event_type, payload, created_at) VALUES ($1, $2, NOW())';
  await primaryPool.query(query, [event.type, JSON.stringify(event.payload)]);
}

export async function fetchPendingEvents(limit = 50) {
  const query = 'SELECT * FROM outbox WHERE processed = false ORDER BY created_at ASC LIMIT $1';
  const result = await primaryPool.query(query, [limit]);
  return result.rows;
}

export async function markEventProcessed(id) {
  await primaryPool.query('UPDATE outbox SET processed = true WHERE id = $1', [id]);
}
