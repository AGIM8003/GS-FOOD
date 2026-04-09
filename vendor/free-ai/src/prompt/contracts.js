import fs from 'fs';
import path from 'path';

const EVIDENCE_DIR = path.join(process.cwd(), 'evidence', 'validation');

function ensureDir() {
  if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

export const outputContracts = {
  plain_text: { id: 'plain_text', type: 'text' },
  markdown_answer: { id: 'markdown_answer', type: 'text' },
  json_object: {
    id: 'json_object',
    type: 'json',
    schema: { type: 'object', additionalProperties: true },
  },
  json_array: { id: 'json_array', type: 'json', schema: { type: 'array', items: {} } },
  report_block: {
    id: 'report_block',
    type: 'json',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        summary: { type: 'string' },
        findings: { type: 'array', items: { type: 'string' } },
      },
      required: ['summary', 'findings'],
    },
  },
  receipt_augmented_answer: {
    id: 'receipt_augmented_answer',
    type: 'json',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        answer: { type: 'string' },
        why: { type: 'object', additionalProperties: true },
      },
      required: ['answer', 'why'],
    },
  },
  explanation_panel: {
    id: 'explanation_panel',
    type: 'json',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        final_persona_id: { type: 'string' },
        skills_used: { type: 'array', items: { type: 'string' } },
        route_reason: { type: 'string' },
        confidence: { type: ['number', 'null'] },
        notes: { type: 'string' },
      },
      required: ['final_persona_id', 'skills_used', 'route_reason', 'confidence', 'notes'],
    },
  },
  plan_output: {
    id: 'plan_output',
    type: 'json',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        steps: { type: 'array', items: { type: 'string' } },
      },
      required: ['steps'],
    },
  },
};

export function selectOutputContract({ intent = {}, payload = {} } = {}) {
  const pref = intent?.output_preferences?.format || payload?.output_contract || payload?.response_mode || null;
  if (pref && outputContracts[pref]) return outputContracts[pref];
  if (intent?.task_type === 'plan') return outputContracts.plan_output;
  if (intent?.task_type === 'report') return outputContracts.report_block;
  if (intent?.intent_family === 'classification' || intent?.intent_family === 'extraction') return outputContracts.json_object;
  return outputContracts.receipt_augmented_answer;
}

export function validateAgainstSchema(value, schema, pathName = '$') {
  const errors = [];
  walkValidate(value, schema, pathName, errors);
  return { valid: errors.length === 0, errors };
}

function walkValidate(value, schema = {}, pathName, errors) {
  if (!schema || Object.keys(schema).length === 0) return;
  const type = schema.type;
  if (Array.isArray(type)) {
    const ok = type.some((t) => isType(value, t));
    if (!ok) errors.push({ path: pathName, message: `expected one of ${type.join(',')}` });
    return;
  }
  if (type && !isType(value, type)) {
    errors.push({ path: pathName, message: `expected ${type}` });
    return;
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({ path: pathName, message: `expected enum ${schema.enum.join(',')}` });
  }
  if (type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    const props = schema.properties || {};
    const required = schema.required || [];
    for (const key of required) {
      if (value[key] === undefined) errors.push({ path: `${pathName}.${key}`, message: 'missing required property' });
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!props[key]) errors.push({ path: `${pathName}.${key}`, message: 'additional property not allowed' });
      }
    }
    for (const [key, childSchema] of Object.entries(props)) {
      if (value[key] !== undefined) walkValidate(value[key], childSchema, `${pathName}.${key}`, errors);
    }
  }
  if (type === 'array' && Array.isArray(value) && schema.items) {
    value.forEach((item, index) => walkValidate(item, schema.items, `${pathName}[${index}]`, errors));
  }
}

function isType(value, type) {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  return typeof value === type;
}

export function parseAndValidateOutput(rawText, contract) {
  const result = { contract_id: contract.id, valid: false, repaired: false, raw_text: rawText, parsed: null, errors: [] };
  if (contract.type === 'text') {
    result.valid = typeof rawText === 'string' && rawText.length > 0;
    result.parsed = rawText;
    return result;
  }
  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = tryRepairJson(rawText);
    if (parsed !== null) result.repaired = true;
  }
  if (parsed === null) {
    result.errors.push({ message: 'invalid_json' });
    persistValidation(result);
    return result;
  }
  const validation = validateAgainstSchema(parsed, contract.schema);
  result.valid = validation.valid;
  result.errors = validation.errors;
  result.parsed = parsed;
  persistValidation(result);
  return result;
}

export function tryRepairJson(rawText) {
  if (typeof rawText !== 'string') return null;
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : rawText;
  const startObj = candidate.indexOf('{');
  const endObj = candidate.lastIndexOf('}');
  if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
    try { return JSON.parse(candidate.slice(startObj, endObj + 1)); } catch {}
  }
  const startArr = candidate.indexOf('[');
  const endArr = candidate.lastIndexOf(']');
  if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
    try { return JSON.parse(candidate.slice(startArr, endArr + 1)); } catch {}
  }
  return null;
}

function persistValidation(result) {
  try {
    ensureDir();
    const file = path.join(EVIDENCE_DIR, `validation-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.json`);
    fs.writeFileSync(file, JSON.stringify({ ...result, validated_at: new Date().toISOString() }, null, 2));
  } catch {}
}
