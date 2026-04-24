/**
 * Pluggable DLP / redaction hook (§33.10). Default: no-op pass-through.
 * Set `FREEAI_DLP_REDACT_PII=1` (surfaced as `cfg.security.dlp_redact_pii` in `loadConfig`) to enable the **reference** regex redactor.
 *
 * Optional:
 * - `FREEAI_DLP_ALLOW_SUBSTR` — comma-separated markers; if the **entire** payload string contains any marker, redaction is skipped (trusted internal traffic only; do not use with hostile input).
 * - `FREEAI_DLP_JSON_STRING_FIELDS` — comma-separated top-level keys on JSON `body` objects to redact (default includes common text keys).
 * - `FREEAI_DLP_REDACT_OPENAI_CHOICES=1` — when body is an object with `choices[].message.content` strings (OpenAI-style), redact those strings too (opt-in; shallow by default without this).
 *
 * @param {string} text
 * @param {{ enabled?: boolean, tenant_id?: string|null }} [policy]
 * @returns {string}
 */

/** @returns {string[]} */
function allowSubstringsFromEnv() {
  return String(process.env.FREEAI_DLP_ALLOW_SUBSTR || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** @returns {string[]} */
function jsonStringFieldsFromEnv() {
  return String(process.env.FREEAI_DLP_JSON_STRING_FIELDS || 'text,message,content,answer,body')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** @param {string} s */
function wholePayloadAllowlisted(s) {
  const markers = allowSubstringsFromEnv();
  if (!markers.length) return false;
  return markers.some((m) => s.includes(m));
}

/** @param {string} s */
function referenceRedactPii(s) {
  let t = s;
  t = t.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED_EMAIL]');
  t = t.replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]');
  t = t.replace(/\b(?:\d[ -]*?){13,19}\b/g, (m) => {
    const digits = m.replace(/\D/g, '');
    if (digits.length >= 13 && digits.length <= 19) return '[REDACTED_CARD]';
    return m;
  });
  return t;
}

export function redactPlaintextForTenant(text, policy) {
  if (text == null) return '';
  const str = String(text);
  if (!policy || policy.enabled !== true) return str;
  if (wholePayloadAllowlisted(str)) return str;
  return referenceRedactPii(str);
}

/**
 * @param {object} out
 * @param {{ enabled?: boolean }} policy
 */
function redactOpenAiStyleChoices(out, policy) {
  if (process.env.FREEAI_DLP_REDACT_OPENAI_CHOICES !== '1') return;
  const choices = out.choices;
  if (!Array.isArray(choices)) return;
  out.choices = choices.map((c) => {
    if (!c || typeof c !== 'object') return c;
    const msg = c.message;
    if (!msg || typeof msg !== 'object') return c;
    const content = msg.content;
    if (typeof content !== 'string') return c;
    return {
      ...c,
      message: { ...msg, content: redactPlaintextForTenant(content, policy) },
    };
  });
}

/**
 * Apply reference PII redaction to string `body` or to selected top-level string fields on a plain object (shallow).
 * Nested paths (e.g. `choices[].message.content`) are only handled when `FREEAI_DLP_REDACT_OPENAI_CHOICES=1`.
 * @param {unknown} body
 * @param {{ enabled?: boolean }} [policy]
 */
export function redactInferResponseBody(body, policy) {
  if (!policy || policy.enabled !== true) return body;
  if (body == null) return body;
  if (typeof body === 'string') {
    return redactPlaintextForTenant(body, policy);
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }
  try {
    const serialized = JSON.stringify(body);
    if (wholePayloadAllowlisted(serialized)) return body;
  } catch {
    return body;
  }
  const fields = jsonStringFieldsFromEnv();
  const out = { ...body };
  for (const key of fields) {
    if (Object.prototype.hasOwnProperty.call(out, key) && typeof out[key] === 'string') {
      out[key] = redactPlaintextForTenant(out[key], policy);
    }
  }
  redactOpenAiStyleChoices(out, policy);
  return out;
}
