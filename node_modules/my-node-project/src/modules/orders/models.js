// my-node-project/src/modules/orders/models.js
import { infrastructure } from '@yourorg/shared-kernel';

/**
 * SAFETY: Schema Definition
 * Used by the router/middleware to validate incoming requests 
 * before they hit the database.
 */
export const orderSchema = {
    product_id: "string",
    quantity: "number",
    user_id: "number"
};

/**
 * AVAILABILITY & PERSISTENCE: Create Order
 * Uses the Shared-Kernel Primary Pool for ACID-compliant writes.
 */
export async function createOrder(order) {
  const { product_id, quantity } = order;
  
  // Reliability: Using the centralized pool from shared-kernel
  return infrastructure.primaryPool.query(
    'INSERT INTO orders (product_id, quantity) VALUES ($1, $2) RETURNING *',
    [product_id, quantity]
  );
}