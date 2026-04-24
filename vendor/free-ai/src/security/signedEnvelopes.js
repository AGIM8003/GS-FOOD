/**
 * Signed Decision Envelopes.
 *
 * Cryptographic signing of policy decisions and run artifacts using HMAC-SHA256.
 * Produces a canonical JSON envelope with signature for tamper detection.
 */
import crypto from 'crypto';

const ENVELOPE_SECRET = process.env.FREEAI_ENVELOPE_SECRET || 'freeai-default-envelope-key';

function canonicalize(obj) {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

function signEnvelope(payload) {
  const body = {
    schema_version: 'freeaiDecisionEnvelope.v1',
    envelope_id: `env-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    payload,
  };
  const canonical = canonicalize(body);
  const sig = crypto.createHmac('sha256', ENVELOPE_SECRET).update(canonical).digest('hex');
  return { ...body, signature: sig };
}

function verifyEnvelope(envelope) {
  if (!envelope || !envelope.signature || !envelope.payload) {
    return { valid: false, reason: 'missing_fields' };
  }
  const body = {
    schema_version: envelope.schema_version,
    envelope_id: envelope.envelope_id,
    created_at: envelope.created_at,
    payload: envelope.payload,
  };
  const canonical = canonicalize(body);
  const expected = crypto.createHmac('sha256', ENVELOPE_SECRET).update(canonical).digest('hex');
  try {
    const valid = crypto.timingSafeEqual(Buffer.from(envelope.signature, 'hex'), Buffer.from(expected, 'hex'));
    return { valid, reason: valid ? 'ok' : 'signature_mismatch' };
  } catch {
    return { valid: false, reason: 'signature_mismatch' };
  }
}

export { signEnvelope, verifyEnvelope, canonicalize };
