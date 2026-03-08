import { Router } from 'express';
import { middleware } from '@yourorg/shared-kernel';
import * as LedgerController from './controller.js';

const router = Router();

/**
 * 💸 Transfer Funds Route
 */
router.post('/transfer', 
  middleware.idempotencyMiddleware, // Now correctly exported from shared-kernel/index.js
  middleware.rateLimiter(5, 60), 
  LedgerController.handleTransfer 
);

export default router;