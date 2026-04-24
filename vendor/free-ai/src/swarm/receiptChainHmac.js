import crypto from 'crypto';

const HMAC_SECRET = process.env.FREEAI_RECEIPT_HMAC_SECRET || 'freeai-default-receipt-hmac-key';

export function computeReceiptHmac(receipt, previousHmac) {
  const payload = JSON.stringify({
    receipt_id: receipt.receipt_id,
    receipt_type: receipt.receipt_type,
    run_id: receipt.run_id,
    timestamp: receipt.timestamp,
    inputs_hash: receipt.inputs_hash,
    outputs_hash: receipt.outputs_hash,
    previous_hmac: previousHmac || null,
  });
  return crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
}

export function verifyReceiptChain(receipts) {
  let previousHmac = null;
  for (let i = 0; i < receipts.length; i++) {
    const r = receipts[i];
    if (!r.chain_hmac) {
      return { valid: false, broken_at_index: i, reason: 'missing_chain_hmac' };
    }
    const expected = computeReceiptHmac(r, previousHmac);
    if (r.chain_hmac !== expected) {
      return { valid: false, broken_at_index: i, reason: 'hmac_mismatch' };
    }
    previousHmac = r.chain_hmac;
  }
  return { valid: true, chain_length: receipts.length };
}
