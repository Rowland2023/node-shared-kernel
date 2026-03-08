import { services } from '../index.js';

console.log('🔄 Outbox Processor started (5s interval)');

setInterval(async () => {
  try {
    // Ensure we are calling the function correctly from the services object
    await services.processOutbox(); 
  } catch (err) {
    console.error('❌ Outbox Processor Error:', err.message);
  }
}, 5000);