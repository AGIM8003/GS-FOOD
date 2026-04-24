import crypto from 'crypto';

function hashObj(obj) {
  const s = JSON.stringify(obj === undefined ? null : obj);
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
}

/**
 * @param {object} params
 * @returns {object}
 */
export function buildSwarmReceiptV1(params) {
  const {
    receipt_type,
    run_id,
    graph_id,
    node_id = null,
    status,
    summary,
    inputs = null,
    outputs = null,
    duration_ms = 0,
    parent_receipt_id = null,
  } = params;
  const receipt_id = `sr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    receipt_id,
    receipt_type,
    run_id,
    graph_id,
    node_id,
    status,
    timestamp: new Date().toISOString(),
    inputs_hash: hashObj(inputs),
    outputs_hash: hashObj(outputs),
    duration_ms,
    summary: String(summary || '').slice(0, 2000),
    parent_receipt_id,
  };
}
