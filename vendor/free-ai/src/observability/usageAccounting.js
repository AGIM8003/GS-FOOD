/**
 * Canonical token fields on request receipts for FinOps / chargeback-style exports.
 * Adapters may return OpenAI-shaped `usage` or sparse/null (e.g. local Ollama).
 * @param {object|null|undefined} usage
 * @returns {{ prompt_tokens: number, completion_tokens: number, total_tokens: number, provider_reported: boolean }}
 */
export function normalizeUsageForReceipt(usage) {
  if (usage == null || typeof usage !== 'object') {
    return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, provider_reported: false };
  }
  const pt = Number(usage.prompt_tokens ?? usage.input_tokens ?? 0) || 0;
  const ct = Number(usage.completion_tokens ?? usage.output_tokens ?? 0) || 0;
  let tt = Number(usage.total_tokens ?? 0) || 0;
  if (!tt && (pt || ct)) tt = pt + ct;
  return { prompt_tokens: pt, completion_tokens: ct, total_tokens: tt, provider_reported: true };
}
