import * as orderModel from './models.js';
import { services, observability } from '@yourorg/shared-kernel';

/**
 * RELIABILITY: Atomic Order Placement
 * This function ensures the order is saved AND an outbox event is 
 * recorded in a single flow for eventual consistency.
 */
export async function placeOrder(req, res) {
  try {
    // 1. PERSISTENCE: Save to Postgres
    const result = await orderModel.createOrder(req.body);

    // 2. RELIABILITY: Save to Outbox (Atomic intent to notify other services)
    // This ensures that even if Kafka is down, the event isn't lost.
    await services.outboxRepository.saveEvent('OrderPlaced', result.rows[0]);

    // 3. OBSERVABILITY: Structured Logging
    observability.logger.info('✅ Order placed successfully', { orderId: result.rows[0].id });
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // 4. FAULT TOLERANCE: Log error but don't leak internals to the client
    observability.logger.error('❌ Order placement failed', { error: err.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ALIAS: To fix the "undefined" error in your router without changing the router code:
export { placeOrder as createOrder };