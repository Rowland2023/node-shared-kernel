// shared-kernel/outbox/outboxProcessor.js
import { fetchPendingEvents, updateEventStatus } from './outbox.repository.js';
import { publishEvent } from '../infrastructure/messaging/publisher.js';

/**
 * BACKGROUND WORKER: processOutbox
 * -------------------------------
 * This function acts as the "Relay" in the Transactional Outbox pattern.
 * It pulls events from the DB and pushes them to the Message Broker.
 */
export async function processOutbox() {
  let events = [];

  try {
    // 1. Fetch pending events 
    // Uses 'FOR UPDATE SKIP LOCKED' inside the repository to handle concurrency.
    events = await fetchPendingEvents(10); 

    if (!events || events.length === 0) return;

  } catch (err) {
    console.error('❌ Outbox Retrieval Error:', err.message);
    return; // Stop if we can't even reach the database
  }

  // 2. Process each event sequentially
  for (const event of events) {
    try {
      console.log(`📡 Relaying Event: ${event.event_type} (${event.id})`);

      // 3. Attempt to publish to Kafka/RabbitMQ/EventBus
      await publishEvent(event.event_type, event.payload);

      // 4. SUCCESS: Move to COMPLETED status
      await updateEventStatus(event.id, 'COMPLETED');
      
    } catch (error) {
      /**
       * 🚀 FAULT TOLERANCE:
       * If publishEvent fails, we do NOT lose the message.
       * We mark it as FAILED. The repository logic for 'next_retry_at' 
       * ensures it will be picked up again after a backoff period.
       */
      console.error(`❌ Relay Failed for event ${event.id}:`, error.message);
      
      try {
        await updateEventStatus(event.id, 'FAILED', error.message);
      } catch (dbErr) {
        console.error('⚠️ Critical: Could not update failure status in DB', dbErr.message);
      }
    }
  }
}