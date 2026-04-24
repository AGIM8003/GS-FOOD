/**
 * Prompt Injection & Jailbreak Detection Gate.
 *
 * Ingress filter that blocks injection attempts before prompts reach the LLM.
 * Checks for: role hijacking, instruction override, encoded payloads,
 * delimiter attacks, and known jailbreak patterns.
 */

const INJECTION_PATTERNS = [
  { id: 'role_hijack', pattern: /\b(you are now|ignore previous|forget all|disregard|new role|act as|pretend to be)\b/i, severity: 'high' },
  { id: 'instruction_override', pattern: /\b(ignore (the )?above|override instructions|system prompt|do not follow)\b/i, severity: 'critical' },
  { id: 'delimiter_escape', pattern: /(\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>|<<SYS>>|<\/SYS>)/i, severity: 'critical' },
  { id: 'encoded_payload', pattern: /(base64|atob|eval\(|javascript:|data:text)/i, severity: 'high' },
  { id: 'prompt_leak', pattern: /\b(show me your (system )?prompt|reveal your instructions|what are your rules|repeat the above)\b/i, severity: 'medium' },
  { id: 'role_play_attack', pattern: /\b(DAN|do anything now|jailbreak|bypass filter|unrestricted mode)\b/i, severity: 'critical' },
  { id: 'indirect_injection', pattern: /\b(when the (user|agent) asks|if prompted|upon receiving)\b.*\b(respond with|output|say)\b/i, severity: 'high' },
  { id: 'markdown_injection', pattern: /!\[.*\]\(https?:\/\/[^)]*\.(php|asp|cgi)\b/i, severity: 'medium' },
];

const BLOCKED_UNICODE = [
  '\u200B', '\u200C', '\u200D', '\uFEFF',
  '\u2028', '\u2029', '\u00AD',
];

function scanForInjection(text) {
  if (typeof text !== 'string') return { safe: true, findings: [] };
  const findings = [];

  for (const { id, pattern, severity } of INJECTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      findings.push({ id, severity, matched: match[0].slice(0, 80), position: match.index });
    }
  }

  for (const ch of BLOCKED_UNICODE) {
    if (text.includes(ch)) {
      findings.push({ id: 'hidden_unicode', severity: 'medium', matched: `U+${ch.charCodeAt(0).toString(16).toUpperCase()}`, position: text.indexOf(ch) });
    }
  }

  const nested = (text.match(/\{/g) || []).length;
  if (nested > 10) {
    findings.push({ id: 'deep_nesting', severity: 'medium', matched: `${nested} levels`, position: 0 });
  }

  return {
    safe: findings.length === 0,
    findings,
    highest_severity: findings.reduce((max, f) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return (order[f.severity] || 0) > (order[max] || 0) ? f.severity : max;
    }, 'none'),
  };
}

function enforceInjectionGate(text, opts = {}) {
  const result = scanForInjection(text);
  if (result.safe) return { allowed: true, result };
  const blockOn = opts.block_on || ['critical', 'high'];
  const blocked = result.findings.some((f) => blockOn.includes(f.severity));
  return { allowed: !blocked, result };
}

export { scanForInjection, enforceInjectionGate, INJECTION_PATTERNS };
