// /shared-kernel/index.js

// Config
import * as config from './config/index.js';
export { config };

// Middleware
import * as middleware from './middleware/index.js';
export { middleware };

// Security Core
export * as security from './security-core/index.js';

// Infrastructure
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

// Reliability patterns
// /shared-kernel/index.js

// Reliability patterns
import * as idempotencyStore from './idempotency/idempotency.store.js';
import * as outboxRepository from './outbox/outbox.repository.js';
import * as outboxWorker from './outbox/outbox.worker.js';
import * as sagaCoordinator from './saga/saga.coordinator.js';
import * as sagaDefinitions from './saga/saga.definitions.js';

export const services = {
  ...idempotencyStore,
  ...outboxRepository,
  ...outboxWorker,
  ...sagaCoordinator,
  ...sagaDefinitions,
};

// Observability
// /shared-kernel/index.js

import * as logger from './observability/logger.js';
import * as metricsCollector from './observability/metricsCollector.js';

export const observability = {
  ...logger,
  ...metricsCollector,
};
