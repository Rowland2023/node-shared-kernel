// src/modules/orders/controller.js
import { getClient, createOrder } from './models.js'; 

export async function placeOrder(req, res) {
  let client;
  try {
    console.log('🚀 [OrderController] Step 0: Requesting DB Client...');
    
    // Call the function directly instead of orderModel.getClient()
    client = await getClient();

    await client.query('BEGIN');
    console.log('🚀 [OrderController] Step 1: Transaction Started');

    const newOrder = await createOrder(req.body, client);
    console.log('🚀 [OrderController] Step 2: Order Created:', newOrder.id);

    await client.query('COMMIT');
    console.log('✅ Order placed successfully');

    return res.status(201).json(newOrder);

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('💥 Controller Error:', error.message);
    
    return res.status(500).json({ 
      error: 'Internal Server Error',
      detail: error.message 
    });
  } finally {
    if (client) {
      client.release();
      console.log('📡 DB Client released back to pool');
    }
  }
}