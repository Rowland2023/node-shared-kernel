// /shared/services/outboxProcessor.js
import { fetchPendingEvents, markEventProcessed } from './outbox.repository.js';
import { publishEvent } from '../infrastructure/messaging/publisher.js';

export async function processOutbox() {
  const events = await fetchPendingEvents();
  for (const event of events) {
    await publishEvent(event.event_type, event.payload);
    await markEventProcessed(event.id);
  }
}
