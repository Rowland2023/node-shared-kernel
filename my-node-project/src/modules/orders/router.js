import { Router } from 'express';
import * as OrderController from './controller.js';

const router = Router();

/**
 * 💸 Minimal Ledger Transfer
 * We have stripped the Redis-dependent middlewares to isolate the hang.
 */
router.post('/transfer', 
  // ⏱️ 1. Safety Timeout (Keep this to catch DB hangs)
  (req, res, next) => {
    res.setTimeout(5000, () => {
      console.error('⚠️ [Minimal Router] Request TIMEOUT at 5000ms');
      if (!res.headersSent) {
        res.status(408).json({ 
          error: 'Request Timeout', 
          detail: 'Auth passed, but logic hung at the Controller/DB level' 
        });
      }
    });
    next();
  },

  // 🧪 2. Direct Entry Log
  (req, res, next) => {
    console.log('🚀 [Minimal Router] Auth context verified. Hitting Controller...');
    next();
  },

  // 🏗️ 3. Direct Execution
  OrderController.placeOrder 
);

export default router;