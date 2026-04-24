/*
 * Prompt Elasticity Engine (TokenElasticMiddleware)
 * Dynamically enforces token limits for free-tier inference without silent failures. 
 */

/**
 * Calculates a very rough token estimate for a sequence of messages.
 * @param {Array} messages 
 * @returns {number}
 */
export function estimateTokenSize(messages) {
  let chars = 0;
  for (const m of messages) {
    if (m.content) chars += m.content.length;
    if (m.role) chars += m.role.length;
  }
  return Math.ceil(chars / 3.5); // Very rough proxy
}

/**
 * Compresses the payload if it exceeds the maximum allotted capacity.
 * Retains the system message (first) and prioritizes the most recent turns.
 * Middle conversation turns are summarized or dropped depending on strict mode.
 * 
 * @param {Array} messages - ChatML formatted messages [{role, content}]
 * @param {number} maxTokens - Max token limit to enforce
 * @returns {Array} Composed messages safely under the token limit
 */
export function elasticizeContext(messages, maxTokens = 8192) {
  const currentTokens = estimateTokenSize(messages);
  
  if (currentTokens < maxTokens * 0.9) {
    return messages; // We are within a safe 90% boundary
  }

  const out = [];
  let budget = maxTokens * 0.9;
  
  // 1. Always retain System message if present
  let startIndex = 0;
  if (messages[0]?.role === 'system') {
    out.push(messages[0]);
    budget -= estimateTokenSize([messages[0]]);
    startIndex = 1;
  }

  // 2. Retain from the end (most recent messages) until budget is exhausted
  const tail = [];
  for (let i = messages.length - 1; i >= startIndex; i--) {
    const msgCost = estimateTokenSize([messages[i]]);
    if (budget - msgCost > 0) {
      tail.unshift(messages[i]);
      budget -= msgCost;
    } else {
      // If we can't even fit the most recent, truncate the content itself
      if (tail.length === 0) {
        const truncatedMsg = { ...messages[i] };
        const allowedChars = Math.floor(budget * 3.5);
        truncatedMsg.content = "(...truncated due to strict limits...) " + truncatedMsg.content.slice(-allowedChars + 50);
        tail.unshift(truncatedMsg);
      } else {
        // We throw in a "soft break" message indicating omitted context
        tail.unshift({ role: 'system', content: '[... Elasticity Engine: older context omitted to fit within free-tier limits ...]' });
      }
      break;
    }
  }

  return [...out, ...tail];
}
