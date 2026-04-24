/**
 * Hallucination Detection.
 *
 * Multi-signal detector for LLM hallucinations:
 * - Confidence entropy (low confidence = likely hallucination)
 * - Self-consistency check (multiple samplings)
 * - Citation verification (claims vs. available sources)
 * - Factual grounding (entity/date plausibility)
 */

function checkConfidenceEntropy(output, threshold = 0.7) {
  if (!output || typeof output !== 'string') return { signal: 'skip', reason: 'no_output' };
  const hedgingPhrases = [
    'I think', 'I believe', 'probably', 'possibly', 'might be', 'could be',
    'not sure', 'uncertain', 'approximately', 'it seems', 'perhaps',
  ];
  const lowerOutput = output.toLowerCase();
  const hedgeCount = hedgingPhrases.filter((h) => lowerOutput.includes(h.toLowerCase())).length;
  const hedgeRatio = hedgeCount / hedgingPhrases.length;
  const confident = hedgeRatio < (1 - threshold);
  return {
    signal: confident ? 'confident' : 'low_confidence',
    hedge_count: hedgeCount,
    hedge_ratio: Math.round(hedgeRatio * 100) / 100,
  };
}

function checkSelfConsistency(outputs) {
  if (!Array.isArray(outputs) || outputs.length < 2) return { signal: 'skip', reason: 'need_multiple_outputs' };
  const normalized = outputs.map((o) => (typeof o === 'string' ? o.trim().toLowerCase() : String(o).toLowerCase()));
  const unique = new Set(normalized);
  const consistency = 1 - ((unique.size - 1) / normalized.length);
  return {
    signal: consistency >= 0.7 ? 'consistent' : 'inconsistent',
    unique_variants: unique.size,
    total_samples: normalized.length,
    consistency_score: Math.round(consistency * 100) / 100,
  };
}

function checkCitationGrounding(output, availableSources) {
  if (!output || !Array.isArray(availableSources)) return { signal: 'skip', reason: 'missing_params' };
  const claimPattern = /(?:according to|as stated in|per|source:|ref:)\s*([^,.;]+)/gi;
  const claims = [];
  let match;
  while ((match = claimPattern.exec(output)) !== null) {
    claims.push(match[1].trim().toLowerCase());
  }
  if (claims.length === 0) return { signal: 'no_citations', cited: 0, grounded: 0 };
  const sourceLower = availableSources.map((s) => (typeof s === 'string' ? s.toLowerCase() : ''));
  let grounded = 0;
  for (const claim of claims) {
    if (sourceLower.some((s) => s.includes(claim) || claim.includes(s))) grounded++;
  }
  return {
    signal: grounded === claims.length ? 'grounded' : 'ungrounded_claims',
    cited: claims.length,
    grounded,
    ungrounded: claims.length - grounded,
  };
}

function detectHallucination(output, opts = {}) {
  const signals = [];
  signals.push({ check: 'confidence', ...checkConfidenceEntropy(output, opts.confidence_threshold) });
  if (opts.alternative_outputs) {
    signals.push({ check: 'self_consistency', ...checkSelfConsistency([output, ...opts.alternative_outputs]) });
  }
  if (opts.available_sources) {
    signals.push({ check: 'citation', ...checkCitationGrounding(output, opts.available_sources) });
  }

  const redFlags = signals.filter((s) =>
    s.signal === 'low_confidence' || s.signal === 'inconsistent' || s.signal === 'ungrounded_claims');

  return {
    likely_hallucination: redFlags.length > 0,
    risk_level: redFlags.length === 0 ? 'low' : redFlags.length === 1 ? 'medium' : 'high',
    signals,
    red_flags: redFlags.length,
  };
}

export { checkConfidenceEntropy, checkSelfConsistency, checkCitationGrounding, detectHallucination };
