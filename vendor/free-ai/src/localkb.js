import fs from 'fs';
import { join } from 'path';
import { summarizeEvaluation } from './retrieval/evalMetrics.js';
import { applyCorrectiveGate } from './retrieval/qualityGate.js';

const KB_PATH = join(process.cwd(), 'data', 'kb.json');

function loadKb() {
  try {
    return JSON.parse(fs.readFileSync(KB_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function overlapScore(prompt, key, value) {
  const query = String(prompt || '').toLowerCase();
  const keyText = String(key || '').toLowerCase();
  const valueText = String(value || '').toLowerCase();
  if (query.includes(keyText)) return 1;
  const queryTerms = query.match(/[a-z0-9][a-z0-9_-]{2,}/g) || [];
  if (!queryTerms.length) return 0;
  const matches = queryTerms.filter((term) => keyText.includes(term) || valueText.includes(term)).length;
  return matches / queryTerms.length;
}

export function retrieveLocalContext(prompt, { limit = 3 } = {}) {
  const kb = loadKb();
  const hits = Object.entries(kb)
    .map(([key, value]) => ({
      key,
      value,
      text: value,
      source: 'local_kb',
      score: Number(overlapScore(prompt, key, value).toFixed(3)),
    }))
    .filter((hit) => hit.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  const gate = applyCorrectiveGate(prompt, hits);
  const correctedHits = gate.corrected_hits || [];
  const best = correctedHits[0] || hits[0] || null;
  const answer = best
    ? best.value
    : `I'm unable to reach external providers right now. This is a local fallback response (fallback_used=true).`;

  return {
    answer,
    hits,
    diagnostics: {
      retrieval: gate,
      evaluation: summarizeEvaluation(prompt, answer, correctedHits.map((hit) => hit.value)),
      matched_keys: correctedHits.map((hit) => hit.key),
      used_local_kb: !!best,
    },
  };
}

export function answerFallback(prompt, options = {}) {
  const result = retrieveLocalContext(prompt, options);
  return options.includeDiagnostics ? result : result.answer;
}
