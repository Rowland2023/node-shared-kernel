import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'my-app',
  // Since you're using Docker Redpanda, ensure this matches 
  // your advertised listener (usually 127.0.0.1:19092 for host access)
  brokers: [process.env.KAFKA_BROKER || 'localhost:19092'], 
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'my-group' });

/**
 * Ensures the producer is ready before the 
 * Outbox Processor starts polling.
 */
export const connectKafka = async () => {
  try {
    console.log('📡 Connecting to Kafka/Redpanda...');
    await producer.connect();
    console.log('✅ Kafka Producer Connected');
  } catch (err) {
    console.error('❌ Kafka Connection Failed:', err);
    process.exit(1); // Exit if we can't connect to our message backbone
  }
};

export { kafka, producer, consumer };