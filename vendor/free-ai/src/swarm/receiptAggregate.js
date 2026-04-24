import fs from 'fs/promises';
import { join } from 'path';

/**
 * Optional swarm fan-in rollup receipt (FREEAI.md §19.4).
 * Called when request payload includes swarm.fan_in or swarm.rollup.
 *
 * @param {object} data
 * @param {{ evidenceRoot?: string }} [options]
 */
export async function writeSwarmRollupReceipt(data, options = {}) {
  const base = options.evidenceRoot || join(process.cwd(), 'evidence', 'receipts');
  await fs.mkdir(base, { recursive: true });
  const record = {
    schema_version: 'swarmReceiptAggregate.v1',
    timestamp: new Date().toISOString(),
    ...data,
  };
  const name = `swarm-rollup-${record.timestamp.replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}.json`;
  await fs.writeFile(join(base, name), JSON.stringify(record, null, 2), 'utf8');
  return record;
}
