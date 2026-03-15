// shared-kernel/infrastructure/messaging/subscriber.js

// 1. You must import it from your client first
import { kafka, getProducer } from './kafka.client.js'; 

// ... your subscriber logic (consumer, etc.) ...

// 2. Now you can export the producer if other files need it
const producer = getProducer();
export { producer };