/**
 * Chain-of-Thought Trace Validator.
 *
 * Validates that CoT reasoning traces are logically coherent, complete,
 * and properly structured before acting on their conclusions.
 */

function validateCoTStructure(trace) {
  if (!trace || typeof trace !== 'string') return { valid: false, errors: ['empty_trace'] };
  const errors = [];

  const lines = trace.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) errors.push('trace_too_short: need at least 2 reasoning steps');

  const stepPattern = /^\s*(?:step\s*\d|(\d+)[.):]|\*|-|therefore|thus|hence|so|because|since|given)/i;
  const structuredLines = lines.filter((l) => stepPattern.test(l));
  const structureRatio = structuredLines.length / lines.length;
  if (structureRatio < 0.3) errors.push('insufficient_structure: less than 30% of lines are structured steps');

  const hasConclusion = lines.some((l) =>
    /\b(therefore|thus|hence|conclusion|finally|in summary|the answer is|result:)\b/i.test(l));
  if (!hasConclusion) errors.push('missing_conclusion');

  return { valid: errors.length === 0, errors, step_count: structuredLines.length, total_lines: lines.length };
}

function checkLogicalCoherence(trace) {
  if (!trace || typeof trace !== 'string') return { coherent: false, issues: ['empty_trace'] };
  const issues = [];
  const lower = trace.toLowerCase();

  const contradictionPairs = [
    ['must', 'must not'], ['always', 'never'], ['true', 'false'],
    ['increase', 'decrease'], ['greater', 'less than'],
  ];
  for (const [a, b] of contradictionPairs) {
    if (lower.includes(a) && lower.includes(b)) {
      issues.push(`potential_contradiction: '${a}' and '${b}' both appear`);
    }
  }

  const nonSequiturPattern = /\b(suddenly|unrelated|by the way|on another note)\b/i;
  if (nonSequiturPattern.test(trace)) {
    issues.push('potential_non_sequitur');
  }

  const circularPattern = /\bbecause\b.*\bbecause\b.*\bbecause\b/i;
  if (circularPattern.test(trace)) {
    issues.push('potential_circular_reasoning');
  }

  return { coherent: issues.length === 0, issues };
}

function validateCoT(trace, opts = {}) {
  const structure = validateCoTStructure(trace);
  const coherence = checkLogicalCoherence(trace);

  const totalIssues = structure.errors.length + coherence.issues.length;
  return {
    valid: structure.valid && coherence.coherent,
    quality_score: Math.max(0, 100 - totalIssues * 20),
    structure,
    coherence,
    recommendation: totalIssues === 0 ? 'accept' : totalIssues <= 2 ? 'review' : 'reject',
  };
}

export { validateCoTStructure, checkLogicalCoherence, validateCoT };
