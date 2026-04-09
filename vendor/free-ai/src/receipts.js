import { validate } from './schemaValidator.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const GENESIS_HASH = '0'.repeat(64);

function buildLedgerRecord(base, previousRecord) {
  const ledger_seq = previousRecord ? previousRecord.ledger_seq + 1 : 0;
  const prev_hash = previousRecord ? previousRecord.this_hash : GENESIS_HASH;
  const payload = {
    receipt_id: base.receipt_id,
    trace_id: base.trace_id,
    provider_id: base.provider_id,
    model_id: base.model_id,
    http_status: base.http_status,
    timestamp: base.timestamp,
    intent_family: base.intent_family,
    persona: base.persona,
    skills_loaded: base.skills_loaded,
    latency_ms: base.latency_ms,
    ledger_seq,
    prev_hash,
  };
  const canonical = JSON.stringify(payload);
  const this_hash = crypto.createHash('sha256').update(prev_hash + canonical).digest('hex');
  return { ...payload, this_hash };
}

function readLastLedgerRecord(ledgerPath) {
  try {
    if (!fs.existsSync(ledgerPath)) return null;
    const lines = fs.readFileSync(ledgerPath, 'utf8').trim().split('\n').filter(Boolean);
    if (!lines.length) return null;
    return JSON.parse(lines[lines.length - 1]);
  } catch {
    return null;
  }
}

function computeLedgerHash(record) {
  const payload = {
    receipt_id: record.receipt_id,
    trace_id: record.trace_id,
    provider_id: record.provider_id,
    model_id: record.model_id,
    http_status: record.http_status,
    timestamp: record.timestamp,
    intent_family: record.intent_family,
    persona: record.persona,
    skills_loaded: record.skills_loaded,
    latency_ms: record.latency_ms,
    ledger_seq: record.ledger_seq,
    prev_hash: record.prev_hash,
  };
  return crypto.createHash('sha256').update(record.prev_hash + JSON.stringify(payload)).digest('hex');
}

export function verifyReceiptLedger() {
  const evidenceDir = path.join(process.cwd(), 'evidence', 'receipts');
  const ledgerPath = path.join(evidenceDir, 'ledger.jsonl');
  if (!fs.existsSync(ledgerPath)) {
    return { valid: true, entries: 0, reason: 'ledger_missing' };
  }

  const lines = fs.readFileSync(ledgerPath, 'utf8').split('\n').filter(Boolean);
  let previousHash = GENESIS_HASH;
  for (let index = 0; index < lines.length; index += 1) {
    const record = JSON.parse(lines[index]);
    if (record.ledger_seq !== index) {
      return { valid: false, entries: lines.length, broken_at: index, reason: 'sequence_mismatch' };
    }
    if (record.prev_hash !== previousHash) {
      return { valid: false, entries: lines.length, broken_at: index, reason: 'prev_hash_mismatch' };
    }
    const expectedHash = computeLedgerHash(record);
    if (record.this_hash !== expectedHash) {
      return { valid: false, entries: lines.length, broken_at: index, reason: 'hash_mismatch' };
    }
    previousHash = record.this_hash;
  }

  return { valid: true, entries: lines.length, head_hash: previousHash };
}

export function makeReceipt({provider_id, model_id, http_status, fallback_used=false, kb_short_circuit=false, persona, intent, skills, trace_id, latency_ms, span_id=null, ...extra}){
  const base = {
    receipt_id: `r-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    trace_id: trace_id || null,
    span_id: span_id || null,
    provider_id: provider_id || null,
    model_id: model_id || null,
    http_status: http_status || null,
    fallback_used: !!fallback_used,
    kb_short_circuit: !!kb_short_circuit,
    persona: { id: persona?.id || persona?.name || null, version: persona?.version || null },
    intent_family: intent?.intent_family || null,
    skills_loaded: (skills||[]).map(s=>({ id: s.id, version: s.version || 'v1' })),
    latency_ms: latency_ms || 0,
    timestamp: new Date().toISOString(),
    schema_version: 'requestReceipt.v1',
    ...extra,
  };
  // write evidence receipt to disk (best-effort)
  try{
    const evidenceDir = path.join(process.cwd(),'evidence','receipts');
    if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });
    const ledgerPath = path.join(evidenceDir, 'ledger.jsonl');
    // validate against frozen schema
    try{
      const res = validate('requestReceipt', base);
      if (!res.valid){
        base.validation_failed = true;
        base.validation_errors = res.errors;
      }
    }catch(e){
      base.validation_failed = true;
      base.validation_errors = [{message:'validation-exception', detail: String(e)}];
    }

    const outPath = path.join(evidenceDir, `${base.receipt_id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(base,null,2),'utf8');
    const ledgerRecord = buildLedgerRecord(base, readLastLedgerRecord(ledgerPath));
    base.receipt_chain = {
      ledger_seq: ledgerRecord.ledger_seq,
      prev_hash: ledgerRecord.prev_hash,
      this_hash: ledgerRecord.this_hash,
    };
    fs.writeFileSync(outPath, JSON.stringify(base,null,2),'utf8');
    fs.appendFileSync(ledgerPath, JSON.stringify(ledgerRecord) + '\n', 'utf8');
  }catch(e){}
  return base;
}
