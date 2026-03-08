// 1. Point to the "Smart" redis file, NOT the cluster-only file
import { redis } from '../infrastructure/cache/redis.cluster.js'; 

/**
 * Reliability: Safety (Idempotency Check)
 * NX = Only set if the key does NOT exist
 * EX = Expire after TTL seconds
 */
export async function checkAndSet(key, ttl = 60) {
  try {
    // Safety check: if Redis is down, we fail-open or fail-closed?
    // For idempotency, we usually fail-closed (return false) to prevent double-processing.
    if (redis.status !== 'ready' && redis.status !== 'connecting') {
       console.warn('⚠️ Redis not ready, idling idempotency check');
       return true; 
    }

    const result = await redis.set(key, 'processed', 'NX', 'EX', ttl);
    return result === 'OK'; 
  } catch (err) {
    console.error('❌ Idempotency Store Error:', err.message);
    // If Redis fails, we throw so the Controller knows it's a 500
    throw err; 
  }
}