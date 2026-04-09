import assert from 'assert';
import { evaluateAll, summarizeEvaluation } from '../src/retrieval/evalMetrics.js';
import { applyCorrectiveGate } from '../src/retrieval/qualityGate.js';
import { retrieveLocalContext } from '../src/localkb.js';

const metrics = evaluateAll(
  'pricing details',
  'Pricing varies per provider according to the local KB placeholder.',
  ['Local KB: Pricing varies per provider; this is a local fallback placeholder.'],
);
assert.equal(metrics.length, 4);
assert(metrics.every((metric) => metric.score >= 0 && metric.score <= 1), 'metrics must stay normalized');

const summary = summarizeEvaluation(
  'covid guidance',
  'For COVID-related info, consult authoritative sources.',
  ['Local KB: For COVID-related info, consult authoritative sources. This is a fallback answer.'],
);
assert(summary.overall_score >= 0 && summary.overall_score <= 1, 'overall evaluation score must stay normalized');

const gate = applyCorrectiveGate('pricing details', [
  { text: 'Pricing varies per provider and depends on the active route.' },
  { text: 'Completely unrelated gardening answer.' },
]);
assert(['correct', 'ambiguous', 'incorrect'].includes(gate.action), 'gate action should be present');
assert.equal(gate.original_count, 2);

const kb = retrieveLocalContext('pricing details');
assert.equal(kb.diagnostics.used_local_kb, true);
assert(kb.diagnostics.retrieval.confidence > 0, 'local retrieval should have positive confidence for matching query');
console.log('retrieval evaluation test OK');