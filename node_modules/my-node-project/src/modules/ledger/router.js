import { Router } from 'express';
import { middleware } from '@yourorg/shared-kernel';
import * as LedgerController from './controller.js';

const router = Router();

router.post('/transfer', 
  middleware.idempotencyMiddleware, 
  middleware.rateLimiter(5, 60), 
  LedgerController.handleTransfer 
);

export default router;