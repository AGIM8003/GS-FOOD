function splitSentences(text) {
  return String(text || '')
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 5);
}

function tokens(text) {
  return String(text || '')
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9_-]{2,}/g) || [];
}

function significantTokens(text) {
  return tokens(text).filter((token) => token.length > 3);
}

export function faithfulness(answer, contexts) {
  const contextText = (contexts || []).join(' ').toLowerCase();
  const sentences = splitSentences(answer);
  const faithful = sentences.filter((sentence) => {
    const words = significantTokens(sentence);
    if (!words.length) return false;
    const overlap = words.filter((word) => contextText.includes(word)).length;
    return overlap >= Math.ceil(words.length * 0.3);
  });
  const score = sentences.length ? faithful.length / sentences.length : 0;
  return {
    metric: 'faithfulness',
    score,
    details: `${faithful.length}/${sentences.length} sentences grounded`,
  };
}

export function answerRelevancy(query, answer) {
  const queryTerms = new Set(significantTokens(query));
  const answerTerms = significantTokens(answer);
  const overlap = answerTerms.filter((term) => queryTerms.has(term)).length;
  const score = Math.min(1, overlap / Math.max(1, queryTerms.size));
  return {
    metric: 'answer_relevancy',
    score,
    details: `${overlap}/${queryTerms.size} query terms covered`,
  };
}

export function contextPrecision(answer, contexts) {
  const answerTerms = significantTokens(answer);
  const relevant = (contexts || []).filter((context) => {
    const overlap = answerTerms.filter((term) => String(context || '').toLowerCase().includes(term)).length;
    return overlap >= 2;
  });
  const score = contexts && contexts.length ? relevant.length / contexts.length : 0;
  return {
    metric: 'context_precision',
    score,
    details: `${relevant.length}/${(contexts || []).length} contexts relevant`,
  };
}

export function contextRecall(answer, contexts) {
  const sentences = splitSentences(answer);
  const recalled = sentences.filter((sentence) => {
    const sentenceTerms = significantTokens(sentence);
    return (contexts || []).some((context) => {
      const overlap = sentenceTerms.filter((term) => String(context || '').toLowerCase().includes(term)).length;
      return overlap >= 2;
    });
  });
  const score = sentences.length ? recalled.length / sentences.length : 0;
  return {
    metric: 'context_recall',
    score,
    details: `${recalled.length}/${sentences.length} sentences have context support`,
  };
}

export function evaluateAll(query, answer, contexts) {
  return [
    faithfulness(answer, contexts),
    answerRelevancy(query, answer),
    contextPrecision(answer, contexts),
    contextRecall(answer, contexts),
  ];
}

export function summarizeEvaluation(query, answer, contexts) {
  const metrics = evaluateAll(query, answer, contexts);
  const overall = metrics.length
    ? metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length
    : 0;
  return {
    metrics,
    overall_score: Number(overall.toFixed(3)),
    evaluated_at: new Date().toISOString(),
  };
}