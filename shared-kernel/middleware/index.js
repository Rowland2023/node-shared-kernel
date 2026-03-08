// shared-kernel/middleware/index.js
export { default as authMiddleware } from './authMiddleware.js';
export { default as loggingMiddleware } from './loggingMiddleware.js';
export { default as rateLimiter } from './rateLimiter.js';
export { idempotencyMiddleware } from './idempotency.js';

// ✨ Add this line! (Assuming your file is named validation.js)
export { validate } from './validator.js';