import { infrastructure } from '@yourorg/shared-kernel';

// Use primaryPool for writes, replicaPool for reads
export async function createLedgerEntry(entry) {
  return infrastructure.primaryPool.query(
    'INSERT INTO ledger (amount, type) VALUES ($1, $2) RETURNING *',
    [entry.amount, entry.type]
  );
}

export async function getLedgerEntries() {
  return infrastructure.replicaPool.query('SELECT * FROM ledger');
}
