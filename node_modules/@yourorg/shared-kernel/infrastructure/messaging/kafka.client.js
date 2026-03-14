import { Kafka } from 'kafkajs';

// 1. Initialize the instance 
// (Make sure to export this so your health check can use it!)
export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'my-app',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

let producer = null;

// 2. Define the connection logic
export const connectKafka = async () => {
  if (producer) return producer;
  producer = kafka.producer();
  await producer.connect();
  return producer;
};

// 3. Define the getter
export const getProducer = () => producer;