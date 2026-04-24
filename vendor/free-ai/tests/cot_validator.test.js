import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateCoTStructure, checkLogicalCoherence, validateCoT } from '../src/swarm/cotValidator.js';

describe('cotValidator', () => {
  it('validates well-structured trace', () => {
    const trace = `Step 1: Identify the problem
Step 2: Gather relevant data
Step 3: Analyze the patterns
Therefore, the conclusion is X.`;
    const r = validateCoTStructure(trace);
    assert.equal(r.valid, true);
    assert.ok(r.step_count >= 3);
  });

  it('rejects empty trace', () => {
    const r = validateCoTStructure('');
    assert.equal(r.valid, false);
  });

  it('rejects single-line trace', () => {
    const r = validateCoTStructure('Just one line');
    assert.equal(r.valid, false);
  });

  it('rejects unstructured text', () => {
    const trace = `The weather is nice today.
It rained yesterday.
My dog likes treats.
Cars have four wheels.`;
    const r = validateCoTStructure(trace);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some((e) => e.includes('missing_conclusion')));
  });

  it('detects contradictions', () => {
    const trace = 'The value must always increase. The value must never increase.';
    const r = checkLogicalCoherence(trace);
    assert.equal(r.coherent, false);
    assert.ok(r.issues.length > 0);
  });

  it('detects non-sequitur', () => {
    const trace = 'Step 1: analyze. By the way, unrelated topic. Therefore done.';
    const r = checkLogicalCoherence(trace);
    assert.ok(r.issues.some((i) => i.includes('non_sequitur')));
  });

  it('full validation returns quality score', () => {
    const trace = `1) First premise is true
2) Second follows from first
3) Third validates second
Therefore the answer is confirmed.`;
    const r = validateCoT(trace);
    assert.ok(r.quality_score >= 0);
    assert.ok(r.quality_score <= 100);
    assert.ok(['accept', 'review', 'reject'].includes(r.recommendation));
  });

  it('rejects poor quality trace', () => {
    const r = validateCoT('random words');
    assert.equal(r.valid, false);
    assert.equal(r.recommendation, 'reject');
  });
});
