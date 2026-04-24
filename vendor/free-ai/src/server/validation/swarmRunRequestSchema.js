export const SWARM_RECEIPT_MODES_V1 = ['full', 'summary', 'none'];

/**
 * @param {unknown} body
 * @returns {string[]}
 */
export function validateSwarmRunEnvelopeV1(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['body must be object'];
  const { receipt_mode } = body;
  if (typeof receipt_mode !== 'string' || !SWARM_RECEIPT_MODES_V1.includes(receipt_mode)) {
    errors.push(`receipt_mode must be one of:${SWARM_RECEIPT_MODES_V1.join(',')}`);
  }
  return errors;
}
