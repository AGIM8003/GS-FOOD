import { resolveTaskLane } from '../routing/resolveTaskLane.js';

const LANE_TO_CAPABILITY = {
  default_chat: 'plain_text_chat',
  fast_chat: 'high_speed_chat',
  deep_reasoning: 'reasoning',
  coding: 'coding',
  extraction: 'json_extraction',
  structured_json: 'json_extraction',
  vision: 'multimodal_vision',
  embeddings: 'embeddings_retrieval',
  image_generation: 'image_generation',
  long_context: 'plain_text_chat',
  budget_free_tier: 'high_speed_chat',
};

/**
 * @param {object} ctx
 */
export function taskContextToCapabilityId(ctx) {
  const lane = resolveTaskLane(ctx || {});
  return LANE_TO_CAPABILITY[lane] || 'plain_text_chat';
}
