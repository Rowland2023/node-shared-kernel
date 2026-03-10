import Joi from 'joi';
import { infrastructure } from '@yourorg/shared-kernel';

/**
 * 1. Validation Schema
 * Ensures incoming request data meets financial precision requirements.
 */
export const orderSchema = Joi.object({
  customer_id: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      qty: Joi.number().integer().min(1).required()
    })
  ).required(),
  total: Joi.number().positive().required()
});

/**
 * 2. Get Database Client
 * Explicitly named export to resolve ESM resolution issues.
 */
export async function getClient() {
  // Gracefully handles different infrastructure wrapping patterns
  const pool = infrastructure.primaryPool?.primaryPool || infrastructure.primaryPool;
  
  if (!pool || typeof pool.connect !== 'function') {
    throw new Error('Database primaryPool not found in infrastructure. Check Shared Kernel initialization.');
  }

  return await pool.connect();
}

/**
 * 3. Create Order, Items, and Outbox Event
 * OPERATES WITHIN A SINGLE ATOMIC TRANSACTION.
 */
export async function createOrder(data, client) {
  // --- STEP 1: Insert Parent Order ---
  const orderQuery = `
    INSERT INTO orders (customer_id, total, status) 
    VALUES ($1, $2, 'pending') 
    RETURNING id, customer_id, total, status, created_at;
  `;
  
  const orderRes = await client.query(orderQuery, [data.customer_id, data.total]);
  
  if (!orderRes.rows || orderRes.rows.length === 0) {
    throw new Error('Critical: Failed to create order record. Transaction rolling back.');
  }

  const order = orderRes.rows[0];

  // --- STEP 2: Bulk Insert Order Items ---
  if (data.items && data.items.length > 0) {
    const itemValues = [];
    const placeholders = data.items.map((item, index) => {
      const offset = index * 3;
      itemValues.push(order.id, item.id, item.qty);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
    }).join(',');

    const itemsQuery = `
      INSERT INTO order_items (order_id, item_id, quantity) 
      VALUES ${placeholders}
      RETURNING *;
    `;
    
    const itemsRes = await client.query(itemsQuery, itemValues);
    order.items = itemsRes.rows;
  }

  // --- STEP 3: Insert Transactional Outbox Event ---
  // Staging the payload so the 5s Outbox Processor can publish to Kafka.
  const outboxQuery = `
    INSERT INTO outbox (aggregate_type, aggregate_id, event_type, payload)
    VALUES ($1, $2, $3, $4)
    RETURNING id;
  `;

  const outboxPayload = {
    order_id: order.id,
    customer_id: order.customer_id,
    total: order.total,
    items: order.items || [],
    occurred_at: new Date().toISOString()
  };

  // Note: Using JSON.stringify ensures compatibility with both JSON and JSONB columns.
  await client.query(outboxQuery, [
    'ORDER',                   // aggregate_type
    order.id.toString(),       // aggregate_id (Cast to string for schema flexibility)
    'ORDER_CREATED',           // event_type
    JSON.stringify(outboxPayload) 
  ]);

  return order;
}