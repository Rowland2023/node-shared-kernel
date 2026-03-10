🚀 My Node Project (Order & Ledger System)
A high-concurrency, cloud-native backend designed for financial integrity. This project utilizes a decoupled microservices architecture where specific domains (Orders, Ledger) consume a central Shared Kernel for infrastructure and common utilities.

🏗️ Architecture Overview
The system follows the Transactional Outbox Pattern to ensure data consistency between the relational database (PostgreSQL) and the message broker (Kafka).

Shared Kernel: Contains primary database pools, Redis configuration, and global middleware.

Order Module: Handles high-concurrency order placement using PostgreSQL transactions.

Ledger Module: Consumes order events to maintain an immutable financial journal.

Infrastructure: Runs on Docker with standalone Redis (Port 6380) and PostgreSQL.

🛠️ Getting Started
1. Environment Configuration
The project uses a root-level .env file. The Shared Kernel is designed to automatically resolve this path even when running within a specific workspace.

2. Authentication
Before making requests, you must generate a valid JWT.

Bash
node gen-token.js
3. Running the Server
This project is part of a monorepo. Start the specific workspace using:

Bash
npm run start --workspace=my-node-project
🧪 API Usage
Place a Transfer Order
Endpoint: POST /api/orders/transfer

Auth: Required (Bearer Token)

Example Request:

Bash
curl -i -X POST http://localhost:3000/api/orders/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "X-Idempotency-Key: ledger-unique-id-001" \
  -d '{
    "customer_id": "user_123",
    "total": 100.00,
    "items": [{"id": "transfer_item_A", "qty": 1}]
  }'
🛰️ Infrastructure Logs (The "Happy Path")
When the system is healthy, you will see the following sequence in your terminal:

📡 Config: Successfully loaded from root .env.

🔄 Outbox: Processor started (5s interval).

✅ Infrastructure: Redis (6380) and Postgres (security_db) connected.

🛡️ Auth: Context established via JWT.

🚀 Controller: Transaction started -> Order Created -> Success.

🗄️ Database Schema
The system requires the following relational structure:

orders: Stores the parent transaction status.

order_items: Linked via order_id (Many-to-One).

outbox: Stores events to be published to Kafka.