/**
 * Node-level input/output guardrails.
 *
 * Guardrails are optional validators attached to node configs:
 *   config.input_guardrail: { max_length?, required_fields?, blocked_patterns? }
 *   config.output_guardrail: { max_length?, required_fields?, blocked_patterns?, min_length? }
 */

export function validateInputGuardrail(input, guardrail) {
  if (!guardrail || typeof guardrail !== 'object') return { ok: true };
  const errors = [];

  if (typeof guardrail.max_length === 'number') {
    const serialized = typeof input === 'string' ? input : JSON.stringify(input);
    if (serialized.length > guardrail.max_length) {
      errors.push(`input exceeds max_length ${guardrail.max_length} (got ${serialized.length})`);
    }
  }

  if (Array.isArray(guardrail.required_fields) && input && typeof input === 'object') {
    for (const field of guardrail.required_fields) {
      if (input[field] === undefined || input[field] === null) {
        errors.push(`input missing required field: ${field}`);
      }
    }
  }

  if (Array.isArray(guardrail.blocked_patterns)) {
    const serialized = typeof input === 'string' ? input : JSON.stringify(input);
    for (const pattern of guardrail.blocked_patterns) {
      try {
        if (new RegExp(pattern, 'i').test(serialized)) {
          errors.push(`input matches blocked pattern: ${pattern}`);
        }
      } catch { /* skip invalid regex */ }
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

export function validateOutputGuardrail(output, guardrail) {
  if (!guardrail || typeof guardrail !== 'object') return { ok: true };
  const errors = [];
  const serialized = typeof output === 'string' ? output : JSON.stringify(output);

  if (typeof guardrail.max_length === 'number' && serialized.length > guardrail.max_length) {
    errors.push(`output exceeds max_length ${guardrail.max_length} (got ${serialized.length})`);
  }

  if (typeof guardrail.min_length === 'number' && serialized.length < guardrail.min_length) {
    errors.push(`output below min_length ${guardrail.min_length} (got ${serialized.length})`);
  }

  if (Array.isArray(guardrail.required_fields) && output && typeof output === 'object') {
    for (const field of guardrail.required_fields) {
      if (output[field] === undefined || output[field] === null) {
        errors.push(`output missing required field: ${field}`);
      }
    }
  }

  if (Array.isArray(guardrail.blocked_patterns)) {
    for (const pattern of guardrail.blocked_patterns) {
      try {
        if (new RegExp(pattern, 'i').test(serialized)) {
          errors.push(`output matches blocked pattern: ${pattern}`);
        }
      } catch { /* skip invalid regex */ }
    }
  }

  if (typeof guardrail.must_contain === 'string' && !serialized.includes(guardrail.must_contain)) {
    errors.push(`output must contain: ${guardrail.must_contain}`);
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}
