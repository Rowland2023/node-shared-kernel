import { infrastructure } from '@yourorg/shared-kernel';
const { primaryPool, replicaPool } = infrastructure;

// 1. Simple Entry (Existing)
export async function createLedgerEntry(entry) {
  return primaryPool.query(
    'INSERT INTO ledger (amount, type) VALUES ($1, $2) RETURNING *',
    [entry.amount, entry.type]
  );
}

// 2. Atomic Transfer (The one the controller is looking for)
export const transferFunds = async (fromUserId, toUserId, amount) => {
  const client = await primaryPool.connect();

  try {
    await client.query('BEGIN');

    // CHECK BALANCE & LOCK ROW
    // Using FOR UPDATE ensures no other transaction can change this user's balance until we COMMIT
    const { rows } = await client.query(
      'SELECT balance FROM accounts WHERE user_id = $1 FOR UPDATE', 
      [fromUserId]
    );
    
    if (!rows[0] || parseFloat(rows[0].balance) < amount) {
        throw new Error('Insufficient funds');
    }

    // EXECUTE TRANSFER
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE user_id = $2', [amount, fromUserId]);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE user_id = $2', [amount, toUserId]);

    // 3. ATOMIC OUTBOX INSERT (Reliability)
    // We include aggregate_type and aggregate_id to satisfy DB constraints
    const outboxResult = await client.query(
      `INSERT INTO outbox (
        event_type, 
        aggregate_type, 
        aggregate_id, 
        payload
      ) VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        'FUNDS_TRANSFERRED', 
        'LEDGER',           // aggregate_type
        fromUserId,         // aggregate_id (the source of the event)
        JSON.stringify({ fromUserId, toUserId, amount })
      ]
    );

    await client.query('COMMIT');
    return outboxResult.rows[0]; 

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export async function getLedgerEntries() {
  return replicaPool.query('SELECT * FROM ledger');
}