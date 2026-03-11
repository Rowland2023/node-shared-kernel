// shared-kernel/infrastructure/diagnostics/health.js
import { infrastructure } from '../../index.js'; // Ensure path points to your shared-kernel index

/**
 * 🛡️ SILENCE KAFKAJS GHOST WARNINGS
 * KafkaJS can trigger a TimeoutNegativeWarning during rapid connect/disconnect
 * cycles in health checks. This keeps your diagnostic output clean.
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
  console.log('🔍 Starting System Health Check...\n');

  const results = {
    database: { status: '🔴 DOWN', latency: null, info: '' },
    redis: { status: '🔴 DOWN', latency: null, info: '' },
    kafka: { status: '🔴 DOWN', latency: null, info: '' }
  };

  // 1. Check Postgres
  try {
    const startDb = Date.now();
    await primaryPool.query('SELECT 1');
    results.database.status = '🟢 UP';
    results.database.latency = `${Date.now() - startDb}ms`;
    results.database.info = 'Connected to security_db';
  } catch (err) { 
    results.database.info = err.message; 
  }

  // 2. Check Redis
  try {
    const startRedis = Date.now();
    await redis.ping();
    results.redis.status = '🟢 UP';
    results.redis.latency = `${Date.now() - startRedis}ms`;
    results.redis.info = 'Standalone/Cluster Ready';
  } catch (err) { 
    results.redis.info = err.message; 
  }

  // 3. Check Kafka Admin (Broker Connectivity)
  try {
    const startKafka = Date.now();
    const admin = kafka.admin();
    await admin.connect();
    
    // We fetch metadata for our core topic to verify the broker is actually routing
    const metadata = await admin.fetchTopicMetadata({ topics: ['FUNDS_TRANSFERRED'] });
    
    results.kafka.status = '🟢 UP';
    results.kafka.latency = `${Date.now() - startKafka}ms`;
    results.kafka.info = metadata.topics.length > 0 ? 'Topic Verified' : 'Topic Missing';
    
    await admin.disconnect();
  } catch (err) { 
    results.kafka.info = err.message; 
  }

  // Render the results in a clean table
  console.table(results);
  
  const allClear = results.database.status === '🟢 UP' && 
                   results.redis.status === '🟢 UP' && 
                   results.kafka.status === '🟢 UP';

  if (allClear) {
    console.log('\n🚀 ALL SYSTEMS NOMINAL: The ledger is ready for high-traffic.');
  } else {
    console.error('\n⚠️ ATTENTION: Some components are unreachable. Check the "info" column.');
  }
}

// Execute
runFullDiagnostic().catch(err => {
  console.error('❌ Critical failure during diagnostic execution:', err);
  process.exit(1);
});