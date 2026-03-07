// /shared-kernel/infrastructure/messaging/subscriber.js
import { kafka, producer, consumer } from './kafka.client.js';

export async function subscribe(topic, handler) {
  await consumer.subscribe({ topic, fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ message }) => {
      handler(JSON.parse(message.value.toString()));
    },
  });
}

export { producer };
