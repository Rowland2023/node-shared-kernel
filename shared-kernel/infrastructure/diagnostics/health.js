import { infrastructure } from '../../index.js'; 

/**
 * 🛡️ SILENCE KAFKAJS GHOST WARNINGS
 * Prevents TimeoutNegativeWarning from cluttering the diagnostic table.
 */
const originalEmit = process.emit;
process.emit = function (name, data) {
  if (name === 'warning' && data && data.name === 'TimeoutNegativeWarning') {
    return false;
  }
  return originalEmit.apply(process, arguments);
};

const { primaryPool, redis, kafka } = infrastructure;

export async function runFullDiagnostic() {
  console.log('🔍 [Lagos Infrastructure] Starting System Health Check...\n');

  const results = {
    database: { status: '🔴 DOWN', latency: null, info: '' },
    redis: { status: '🔴 DOWN', latency: null, info: '' },
    kafka: { status: '🔴 DOWN', latency: null, info: '' },
    producer: { status: '🔴 DOWN', latency: null, info: '' }
  };

  // 1. Check Postgres (Persistence)
  try {
    const startDb = Date.now();
    await primaryPool.query('SELECT 1');
    results.database.status = '🟢 UP';
    results.database.latency = `${Date.now() - startDb}ms`;
    results.database.info = 'Connected to security_db';
  } catch (err) { 
    results.database.info = `DB Error: ${err.message}`; 
  }

  // 2. Check Redis (Idempotency/Locking)
  try {
    const startRedis = Date.now();
    await redis.ping();
    results.redis.status = '🟢 UP';
    results.redis.latency = `${Date.now() - startRedis}ms`;
    results.redis.info = 'Standalone/6380 Ready';
  } catch (err) { 
    results.redis.info = `Redis Error: ${err.message}`; 
  }

  // 3. Check Kafka & Producer (Messaging Pipeline)
  try {
    const startKafka = Date.now();
    
    // Await the actual producer connection handshake
    await infrastructure.connectKafka(); 
    
    const admin = kafka.admin();
    await admin.connect();
    
    // Verify our specific topic exists in the cluster
    const metadata = await admin.fetchTopicMetadata({ topics: ['FUNDS_TRANSFERRED'] });
    await admin.disconnect();

    const latency = `${Date.now() - startKafka}ms`;

    // Broker/Topic Check
    results.kafka.status = '🟢 UP';
    results.kafka.latency = latency;
    results.kafka.info = metadata.topics.length > 0 ? 'Topic Verified' : 'Topic Missing (Run rpk topic create)';

    // Producer Check (Since connectKafka succeeded, we are UP)
    results.producer.status = '🟢 UP';
    results.producer.latency = latency;
    results.producer.info = 'Producer Handshake Verified';

  } catch (err) { 
    results.kafka.info = `Kafka Error: ${err.message}`; 
    results.producer.info = 'Producer connection failed or timed out';
  }

  // Render the results in a clean table for the Lagos terminal
  console.table(results);
  
  const allClear = results.database.status === '🟢 UP' && 
                   results.redis.status === '🟢 UP' && 
                   results.kafka.status === '🟢 UP' &&
                   results.producer.status === '🟢 UP';

  if (allClear) {
    console.log('\n🚀 ALL SYSTEMS NOMINAL: The ledger is ready for high-traffic.');
  } else {
    console.error('\n⚠️ ATTENTION: Check the "info" column for connectivity issues.');
    process.exit(1);
  }
}

// Execute
runFullDiagnostic().catch(err => {
  console.error('❌ Critical failure during diagnostic execution:', err);
  process.exit(1);
});