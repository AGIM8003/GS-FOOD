import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkConfidenceEntropy, checkSelfConsistency, checkCitationGrounding, detectHallucination } from '../src/swarm/hallucinationDetector.js';

describe('hallucinationDetector', () => {
  it('flags low confidence output', () => {
    const r = checkConfidenceEntropy('I think probably it might be around 42, I believe, not sure though');
    assert.equal(r.signal, 'low_confidence');
    assert.ok(r.hedge_count > 2);
  });

  it('marks confident output', () => {
    const r = checkConfidenceEntropy('The capital of France is Paris. It has been since 1792.');
    assert.equal(r.signal, 'confident');
  });

  it('detects self-consistency', () => {
    const r = checkSelfConsistency(['The answer is 42', 'The answer is 42', 'The answer is 42']);
    assert.equal(r.signal, 'consistent');
  });

  it('detects inconsistency', () => {
    const r = checkSelfConsistency(['The answer is 42', 'The answer is 7', 'The answer is 100']);
    assert.equal(r.signal, 'inconsistent');
  });

  it('needs at least 2 outputs for consistency', () => {
    const r = checkSelfConsistency(['only one']);
    assert.equal(r.signal, 'skip');
  });

  it('checks citation grounding', () => {
    const r = checkCitationGrounding('According to Wikipedia, the sky is blue', ['wikipedia']);
    assert.equal(r.signal, 'grounded');
  });

  it('detects ungrounded citations', () => {
    const r = checkCitationGrounding('According to FakeSource, the sky is green', ['wikipedia']);
    assert.equal(r.signal, 'ungrounded_claims');
  });

  it('full detection returns risk level', () => {
    const r = detectHallucination('I think maybe probably the answer might be 42', {
      alternative_outputs: ['The answer is 7'],
    });
    assert.ok(['low', 'medium', 'high'].includes(r.risk_level));
  });

  it('returns low risk for confident grounded output', () => {
    const r = detectHallucination('The capital of France is Paris.');
    assert.equal(r.risk_level, 'low');
    assert.equal(r.likely_hallucination, false);
  });

  it('handles null output', () => {
    const r = detectHallucination(null);
    assert.equal(r.likely_hallucination, false);
  });
});
