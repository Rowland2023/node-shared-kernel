import { ledgerModel } from './models.js'; // Fixed import syntax
import { services, observability } from '@yourorg/shared-kernel';

export const handleTransfer = async (req, res) => {
  console.log('🎯 STEP 1: Controller Reached'); 
  
  // Aligning keys with the model's expected parameters
  const { account_id, amount, type, reference, currency } = req.body;
  const authUser = req.user?.id; 

  try {
    console.log('⏳ STEP 1.5: Attempting Atomic Database Write...');
    
    // Call the model function directly from the named export
    const transactionData = await ledgerModel.createTransfer({ 
      account_id: account_id || authUser, // Fallback to auth user if account_id missing
      amount, 
      type: type || 'DEBIT',
      reference: reference || 'API_TRANSFER',
      currency: currency || 'NGN'
    });

    // Logging for Lagos Observability stack
    observability.logger.info('✅ Transfer successful', { 
      ledgerId: transactionData.ledger_id,
      user: authUser 
    });

    console.log('🎯 STEP 3: Logic Completed. Sending response.');
    return res.status(201).json({
      success: true,
      message: "Transaction completed and scheduled for relay.",
      data: transactionData
    });

  } catch (err) {
    console.error('🎯 ERROR CAUGHT:', err.message);
    
    observability.logger.error('❌ Critical Ledger Error', { error: err.message });
    
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message 
    });
  }
};