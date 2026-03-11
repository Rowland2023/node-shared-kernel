import * as ledgerModel from './models.js'; 
import { services, observability } from '@yourorg/shared-kernel';

/**
 * RELIABILITY: Atomic Ledger Transfer
 */
export const handleTransfer = async (req, res) => {
  console.log('🎯 STEP 1: Controller Reached'); 
  
  const { toUserId, amount } = req.body;
  const fromUserId = req.user?.id; 

  try {
    // 1. PERSISTENCE: Execute the ACID transfer (Balance check + Update)
    console.log('⏳ STEP 1.5: Attempting Database Write via transferFunds...');
    
    // Using the function name defined in your models.js/service
    const transactionData = await ledgerModel.transferFunds(fromUserId, toUserId, amount);
    
    // 2. RELIABILITY: Atomic Outbox Entry is already handled inside transferFunds!
    // But if you want a separate event for the 'TransferCreated' specifically:
    console.log('⏳ STEP 2: Logging successful transfer to observability...');

    // 3. OBSERVABILITY: Structured Logging
    observability.logger.info('✅ Transfer successful', { 
      fromUserId,
      toUserId,
      amount
    });

    console.log('🎯 STEP 3: Logic Completed. Sending response.');
    return res.status(200).json({
      success: true,
      message: "Transaction completed successfully.",
      data: transactionData
    });

  } catch (err) {
    console.log('🎯 ERROR CAUGHT:', err.message);
    
    if (err.message === 'Insufficient funds') {
      return res.status(400).json({ error: "Transaction Failed", message: err.message });
    }

    observability.logger.error('❌ Critical Ledger Error', { error: err.message });
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: "Internal Server Error", 
        message: err.message || "An unexpected error occurred." 
      });
    }
  }
};