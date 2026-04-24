/**
 * Adaptive TTC (Test-Time Compute) Predictor
 * Heuristically evaluates whether a node operation warrants expensive Test-Time Compute (TTC) ensembles.
 * Helps prevent burning tokens on simple "hello world" or greeting tasks.
 */

// Basic heuristics mapping complexity by intent_family
const COMPLEXITY_WEIGHTS = {
  'coding': 0.9,
  'deep_reasoning': 0.95,
  'extraction': 0.6,
  'vision': 0.7,
  'math': 0.9,
  'creative_writing': 0.5,
  'summarization': 0.4,
  'classification': 0.3,
  'simple_chat': 0.1,
  'greet': 0.05,
  'default_chat': 0.4
};

/**
 * Predicts whether TTC is necessary.
 * @param {object} node - The graph node configuration.
 * @param {object} intent - The user intent or context metadata.
 * @returns {boolean} - True if TTC should be used, False otherwise.
 */
export function predictTTCRequirement(node, intent = {}) {
  // If explicitly disabled in config, respect it.
  if (node.config && node.config.use_ttc === false) {
    return false;
  }

  // If explicitly forced enabled by user or config, respect it.
  if (node.config && node.config.force_ttc === true) {
    return true;
  }

  const family = intent.intent_family || intent.task_type || 'default_chat';
  const baselineComplexity = COMPLEXITY_WEIGHTS[family] || 0.4;
  
  // Bump complexity based on context size (if provided)
  const contextLength = (intent.context && intent.context.length) || 0;
  let contextMultiplier = 1.0;
  if (contextLength > 4000) contextMultiplier = 1.2;
  if (contextLength > 16000) contextMultiplier = 1.5;

  const finalScore = baselineComplexity * contextMultiplier;

  // Threshold to trigger TTC (e.g. > 0.75)
  // If the node config requests TTC, we allow it unless finalScore is extremely low (< 0.2)
  if (node.config && node.config.use_ttc === true) {
    if (finalScore < 0.2) {
      console.log(`[TTC Predictor] Suppressing TTC for node ${node.node_id}. Score (${finalScore}) too low for task type: ${family}`);
      return false; // Suppress wasteful compute
    }
    return true;
  }

  // Auto-enable TTC for highly complex tasks even if not requested explicitly
  if (finalScore > 0.8) {
    console.log(`[TTC Predictor] Automatically enabling TTC for node ${node.node_id}. High complexity score (${finalScore}) for task type: ${family}`);
    return true;
  }

  return false;
}
