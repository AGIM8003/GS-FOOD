import { appendPromotionEvent } from '../models/catalogStore.js';

/**
 * Record rollback and return suggested pin restore (host updates pins / providers.json).
 */
export function rollbackModelPromotion(payload, rootOverride) {
  if (!payload?.provider_id || !payload?.lane || !payload?.previous_model_id) {
    return { ok: false, reason: 'missing_fields' };
  }
  appendPromotionEvent(
    {
      type: 'rollback',
      provider_id: payload.provider_id,
      model_id: payload.model_id || null,
      lane: payload.lane,
      restore_model_id: payload.previous_model_id,
    },
    rootOverride,
  );
  return {
    ok: true,
    restore: {
      lane: payload.lane,
      provider_id: payload.provider_id,
      model_id: payload.previous_model_id,
    },
  };
}
