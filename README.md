📄 High-Integrity Financial Ledger & Outbox System A robust backend architecture designed for financial precision and distributed reliability. Implements a high-performance double-entry ledger using Node.js (ES6), Postgres, Redis, and Redpanda.

🏗️ Core PrinciplesTransactional Outbox Pattern: Atomic consistency between DB changes and event broadcasts.
Financial Precision: NUMERIC(19,4) for currency accuracy.
Reliability: DLQ, idempotency, and retries with exponential backoff.
Performance: Concurrent transactions with ~6ms latency per operation.

🛠️ Tech StackComponentTechnologyPurposeRuntimeNode.js v24+ (ESM)Async event execution via ES ModulesDatabasePostgreSQL 15Source of truth & outbox storageMessagingRedpandaKafka-compatible event streamingCache/LockRedis 7Idempotency & distributed locksConfigDotenvxSecure environment management

🚀 Getting Started1. Infrastructure (Docker)
Bash docker-compose up -d
Postgres: 5432 | Redis: 6380 | Redpanda: 190922. 
Schema SetupRun in security_db:SQLCREATE TABLE ledger (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL,
    amount NUMERIC(19, 4) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('CREDIT', 'DEBIT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE outbox (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);
3. Verification Commands Diagnostics: node shared-kernel/infrastructure/diagnostics/health.js
Stress Test: node scripts/stress-test.js
Outbox Worker: node shared-kernel/outbox/outboxProcessor.js

🔍 Observability & ReliabilityMonitoring: Real-time DB latency, Redis health, and Redpanda metadata checks.DLQ: Failed events > 3 retries are moved to LEDGER_DLQ.Topic Inspection:Bashdocker exec -it redpanda-cl rpk topic consume FUNDS_TRANSFERRED

🤝 Contribution StandardsIdempotency First: Consumers must check eventId to prevent duplicate processing.
ES6 Only: Use import/export. No require() allowed.
Zero Downtime: Worker loops must use Safe Polling (Math.max(0)) to prevent event loop blocking.

🧹 MaintenancePurge Events: DELETE FROM outbox WHERE status = 'COMPLETED' AND processed_at < NOW() - INTERVAL '7 days';
Monitor Errors: Group outbox by error_message to identify system bottlenecks.
Developed with precision in Lagos, Nigeria.