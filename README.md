🚀 My Node Project (Security Core)A robust, enterprise-grade Node.js microservice built with Clean Architecture principles, featuring a Transactional Outbox Pattern for reliable event-driven communication.🛠️ Tech StackRuntime: Node.js (ESM)Database: PostgreSQL (Primary & Replica pools)Cache: Redis (Standalone & Cluster support)Messaging: Kafka (High-throughput event streaming)Architecture: Hexagonal / Clean Architecture🏗️ Key Architecture PatternsTransactional OutboxTo ensure data consistency between the database and our message broker (Kafka/Redis), we implement the Outbox Pattern. This prevents "Dual Writes" issues by saving events to a local outbox table within the same transaction as the business logic.Idempotency SupportThe API includes an idempotencyMiddleware that uses Redis to track x-idempotency-key headers, ensuring that duplicate requests (e.g., due to network retries) do not result in duplicate orders.🚀 Getting Started1. Environment ConfigurationCreate a .env file in the root directory:Code snippetDB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=security_db

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_MODE=standalone
2. Database SetupEnsure the outbox table is initialized in your PostgreSQL instance:SQLCREATE TABLE outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
3. Installation & ExecutionThis project uses npm workspaces.Bash# Install dependencies
npm install

# Start the specific workspace
npm run start --workspace=my-node-project
🚦 API Endpoints (Orders)MethodEndpointDescriptionHeadersPOST/ordersPlace a new orderx-idempotency-keyGET/healthService health checkN/A🔄 Background ProcessesOutbox ProcessorInterval: 5 secondsFunction: Polls the outbox table for PENDING events, publishes them to the message broker, and updates status to COMPLETED.Reliability: Uses FOR UPDATE SKIP LOCKED to support multiple concurrent worker instances without event duplication.🧪 Testing the FlowTo verify the system end-to-end, use the following curl command:Bashcurl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: $(date +%s)" \
  -d '{"customerId": "user_1", "items": [{"productId": "p1", "quantity": 1}], "total" : 10.00}'