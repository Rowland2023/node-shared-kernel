/**
 * Shared Kernel - Main Entry Point
 * Flattened exports allow for: import { authMiddleware, validate } from '@yourorg/shared-kernel'
 */

// 1. Config
export * as config from './config/index.js';

// 2. Middleware (FLATTENED)
// This allows: import { authMiddleware, validate, rateLimiter } from '@yourorg/shared-kernel'
export * from './middleware/index.js'; 
// We still keep the object export for backward compatibility if needed
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
import { processOutbox } from './outbox/outboxProcessor.js';

export const services = {
  ...idempotencyStore,
  ...outboxRepository,
  ...outboxWorker,
  processOutbox,
  ...sagaCoordinator,
  ...sagaDefinitions,
};

export { processOutbox };

// 6. Observability
import * as logger from './observability/logger.js';
import * as metricsCollector from './observability/metricsCollector.js';

export const observability = {
  ...logger,
  ...metricsCollector,
};