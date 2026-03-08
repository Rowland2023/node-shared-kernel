// ledger/controller.js
import * as LedgerService from './service.js';

export const handleTransfer = async (req, res) => {
  const { toUserId, amount } = req.body;
  const fromUserId = req.user.id; // Populated by authMiddleware

  try {
    const result = await LedgerService.transferFunds(fromUserId, toUserId, amount);
    
    res.status(200).json({
      success: true,
      message: "Transaction completed successfully.",
      data: result
    });

  } catch (err) {
    // 1. Handle Known Business Logic Errors
    if (err.message === 'Insufficient funds') {
      return res.status(400).json({ 
        error: "Transaction Failed", 
        message: err.message 
      });
    }

    // 2. Handle Unexpected Infrastructure Errors
    console.error('💥 Critical Ledger Error:', err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: "An unexpected error occurred during the transaction." 
    });
  }
};