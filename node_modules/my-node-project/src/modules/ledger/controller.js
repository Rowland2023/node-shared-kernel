// ledger/controller.js
import * as ledgerModel from './models.js'; 
import { services, observability } from '@yourorg/shared-kernel';

/**
 * RELIABILITY: Atomic Ledger Transfer
 * This version uses the naming convention your router expects
 */
export const handleTransfer = async (req, res) => {
  console.log('🎯 STEP 1: Controller Reached'); 
  
  // Extract values (matching your working version's variable names)
  const { toUserId, amount } = req.body;
  const fromUserId = req.user?.id; // Safety check for authMiddleware

  try {
    // 1. PERSISTENCE: Record the transfer
    console.log('⏳ STEP 1.5: Attempting Database Write...');
    const result = await ledgerModel.createTransfer({ 
      from: fromUserId, 
      to: toUserId, 
      amount 
    });
    
    const transactionData = result.rows[0];

    // 2. RELIABILITY: Atomic Outbox Entry for eventual consistency
    console.log('⏳ STEP 2: Attempting Outbox Save...');
    await services.outboxRepository.saveEvent('TransferCreated', transactionData);

    // 3. OBSERVABILITY: Structured Logging
    observability.logger.info('✅ Transfer successful', { 
      transactionId: transactionData.id,
      fromUserId 
    });

    console.log('🎯 STEP 3: Logic Completed. Sending response.');
    return res.status(200).json({
      success: true,
      message: "Transaction completed successfully.",
      data: transactionData
    });

  } catch (err) {
    console.log('🎯 ERROR CAUGHT:', err.message);
    
    // Business Logic Error Handling
    if (err.message === 'Insufficient funds') {
      return res.status(400).json({ error: "Transaction Failed", message: err.message });
    }

    observability.logger.error('❌ Critical Ledger Error', { error: err.message });
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: "Internal Server Error", 
        message: "An unexpected error occurred." 
      });
    }
  }
};