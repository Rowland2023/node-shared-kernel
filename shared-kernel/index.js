// shared-kernel/index.js
import { primaryPool, connectPostgres } from './infrastructure/database/primary.pool.js';
import { kafka, connectKafka } from './infrastructure/messaging/kafka.client.js';

// If you have redis, import it here. If not, we'll use a placeholder.
const connectRedis = async () => {
    console.log('📡 Connecting to Redis...');
    // Add your redis logic here
    console.log('✅ Redis Connected');
};

export const infrastructure = {
    connectRedis,
    connectKafka,
    connectPostgres,
    primaryPool,
    kafka
};

export const startOutboxWorker = (interval) => {
    console.log(`📦 Outbox Worker started with interval: ${interval}ms`);
};

export const startCleanupJob = () => {
    console.log('🧹 Cleanup Job started');
};

// Also export as default to handle both import styles
export default {
    infrastructure,
    startOutboxWorker,
    startCleanupJob
};