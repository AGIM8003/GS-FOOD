function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9_-]{2,}/g) || [];
}

function heuristicRelevance(query, text) {
  const queryTerms = new Set(tokenize(query).filter((token) => token.length > 2));
  const textTerms = new Set(tokenize(text).filter((token) => token.length > 2));
  if (!queryTerms.size) return 0.5;

  let overlap = 0;
  for (const term of queryTerms) {
    if (textTerms.has(term)) overlap += 1;
  }

  const rawScore = overlap / queryTerms.size;
  const phraseBoost = String(text || '').toLowerCase().includes(String(query || '').toLowerCase()) ? 0.25 : 0;
  return Math.min(1, rawScore + phraseBoost);
}

export function applyCorrectiveGate(query, hits, { relevanceThreshold = 0.35, correctThreshold = 0.6 } = {}) {
  const startedAt = Date.now();
  const scoredHits = (hits || []).map((hit) => {
    const text = String(hit.text || hit.value || hit.answer || '');
    const relevance = heuristicRelevance(query, text);
    return { ...hit, relevance: Number(relevance.toFixed(3)) };
  });

  const relevantHits = scoredHits.filter((hit) => hit.relevance >= relevanceThreshold);
  const relevantFraction = scoredHits.length ? relevantHits.length / scoredHits.length : 0;

  let action = 'incorrect';
  let correctedHits = scoredHits;
  if (relevantFraction >= correctThreshold) {
    action = 'correct';
    correctedHits = scoredHits.filter((hit) => hit.relevance >= relevanceThreshold * 0.5);
  } else if (relevantFraction >= 0.2) {
    action = 'ambiguous';
    correctedHits = relevantHits;
  }

  return {
    action,
    original_count: scoredHits.length,
    filtered_count: Math.max(0, scoredHits.length - correctedHits.length),
    confidence: Number(relevantFraction.toFixed(3)),
    relevance_scores: scoredHits.map((hit) => hit.relevance),
    corrected_hits: correctedHits,
    duration_ms: Date.now() - startedAt,
  };
}