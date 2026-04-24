export const SWARM_RECEIPT_TYPES = [
  'graph_receipt',
  'node_receipt',
  'merge_receipt',
  'final_receipt',
  'policy_receipt',
  'review_receipt',
  'resume_receipt',
  'tool_receipt',
];

/**
 * @param {object} r
 * @returns {boolean}
 */
export function isValidSwarmReceiptV1(r) {
  if (!r || typeof r !== 'object') return false;
  const required = [
    'receipt_id',
    'receipt_type',
    'run_id',
    'graph_id',
    'status',
    'timestamp',
    'inputs_hash',
    'outputs_hash',
    'duration_ms',
    'summary',
  ];
  for (const k of required) {
    if (r[k] === undefined || r[k] === null) return false;
  }
  if (!SWARM_RECEIPT_TYPES.includes(r.receipt_type)) return false;
  return true;
}
