// shared-kernel/outbox/outbox.worker.js

export function startOutboxWorker(intervalMs = 5000) {
  const run = async () => {
    const startTime = Date.now();
    
    // logic to process events...
    // await processEvents();

    const duration = Date.now() - startTime;
    const nextDelay = Math.max(100, intervalMs - duration);
    
    // ✅ This prevents the Negative Timeout Warning
    setTimeout(run, nextDelay);
  };

  console.log(`🔄 Outbox Processor Active (${intervalMs}ms interval)`);
  run();
}