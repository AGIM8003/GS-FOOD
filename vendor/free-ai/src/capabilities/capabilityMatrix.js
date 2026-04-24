/**
 * Declarative capability lanes × coarse requirements (provider/model resolution is downstream).
 */
export const CAPABILITY_MATRIX = [
  { id: 'plain_text_chat', modalities: ['text'], requires_tools: false, requires_json_schema: false },
  { id: 'high_speed_chat', modalities: ['text'], requires_tools: false, requires_json_schema: false, latency: 'low' },
  { id: 'reasoning', modalities: ['text'], reasoning: 'high' },
  { id: 'coding', modalities: ['text'], requires_tools: true },
  { id: 'json_extraction', modalities: ['text'], requires_json_schema: true },
  { id: 'function_tool_calling', modalities: ['text'], requires_tools: true },
  { id: 'web_grounded', modalities: ['text'], external: 'web' },
  { id: 'multimodal_vision', modalities: ['text', 'vision'] },
  { id: 'audio_transcription', modalities: ['audio_in'] },
  { id: 'speech_output', modalities: ['audio_out'] },
  { id: 'image_generation', modalities: ['image_out'] },
  { id: 'video_generation', modalities: ['video_out'] },
  { id: 'embeddings_retrieval', modalities: ['embeddings'] },
];

export function listCapabilityIds() {
  return CAPABILITY_MATRIX.map((r) => r.id);
}
