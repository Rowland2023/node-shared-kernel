// order/router.js
import { Router } from 'express';
import { middleware } from '@yourorg/shared-kernel';
import * as OrderController from './controller.js';
import { orderSchema, createOrder } from './models.js'; // Define your rules here

const { rateLimiter, idempotencyMiddleware, validate } = middleware;
const router = Router();

/**
 * 🛒 Create Order Route
 * Logic: Validate data -> Check Idempotency -> Rate Limit -> Execute
 */
// Add this right BEFORE the router.post('/') call
console.log('--- Orders Router Debug ---');
console.log('1. validate(orderSchema):', typeof validate?.(orderSchema)); 
console.log('2. idempotencyMiddleware:', typeof idempotencyMiddleware);
console.log('3. rateLimiter(10, 60):', typeof rateLimiter?.(10, 60));
console.log('4. OrderController.createOrder:', typeof OrderController.createOrder);

router.post('/', 
  validate(orderSchema),      // Ensure data is clean FIRST
  idempotencyMiddleware,     // Prevent duplicate orders
  rateLimiter(10, 60),       // Prevent bot spam
  OrderController.placeOrder
);

export default router;