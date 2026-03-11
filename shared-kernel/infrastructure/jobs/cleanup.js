import { primaryPool } from '@yourorg/shared-kernel';

/**
 * Prunes the outbox table of old COMPLETED events.
 */
export async function cleanupOutbox() {
  console.log('🧹 Starting Outbox Pruning...');
  try {
    const result = await primaryPool.query(
      "DELETE FROM outbox WHERE status = 'COMPLETED' AND updated_at < NOW() - INTERVAL '7 days'"
    );
    console.log(`✅ Cleanup finished. Removed ${result.rowCount} rows.`);
  } catch (err) {
    console.error('❌ Cleanup Job Failed:', err.message);
  }
}

// Example usage with a basic setInterval (or use node-cron)
setInterval(cleanupOutbox, 24 * 60 * 60 * 1000); // Once every 24 hours