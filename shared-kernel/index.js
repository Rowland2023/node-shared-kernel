// /shared-kernel/index.js

// 1. Config
import * as config from './config/index.js';
export { config };

// 2. Middleware
import * as middleware from './middleware/index.js';
export { middleware };

// 3. Security Core
export * as security from './security-core/index.js';

// 4. Infrastructure
import * as primaryPool from './infrastructure/database/primary.pool.js';
import * as replicaPool from './infrastructure/database/replica.pool.js';
import * as kafkaClient from './infrastructure/messaging/kafka.client.js';
import * as publisher from './infrastructure/messaging/publisher.js';
import * as redisCluster from './infrastructure/cache/redis.cluster.js';
import * as eventPublisher from './infrastructure/eventPublisher.js';
import * as messageBroker from './infrastructure/messageBroker.js';

export const infrastructure = {
  ...primaryPool,
  ...replicaPool,
  ...kafkaClient,
  ...publisher,
  ...redisCluster,
  ...eventPublisher,
  ...messageBroker,
};

// 5. Reliability Patterns & Services
import * as idempotencyStore from './idempotency/idempotency.store.js';
import * as outboxRepository from './outbox/outbox.repository.js';
import * as outboxWorker from './outbox/outbox.worker.js';
import * as sagaCoordinator from './saga/saga.coordinator.js';
import * as sagaDefinitions from './saga/saga.definitions.js';

// Explicitly import so we can use it in 'services' AND export it at top-level
import { processOutbox } from './outbox/outboxProcessor.js';

export const services = {
  ...idempotencyStore,
  ...outboxRepository,
  ...outboxWorker,
  processOutbox, // Now this is defined
  ...sagaCoordinator,
  ...sagaDefinitions,
};

// Top-level export to fix the "processOutbox is not a function" error in index.js
export { processOutbox };

// 6. Observability
import * as logger from './observability/logger.js';
import * as metricsCollector from './observability/metricsCollector.js';

export const observability = {
  ...logger,
  ...metricsCollector,
};