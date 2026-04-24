/**
 * Deterministic diff between two catalog snapshots (model_id + provider_id keys).
 * @param {object|null} previous
 * @param {object|null} next
 */
export function computeCatalogDiff(previous, next) {
  const prevModels = previous?.models || [];
  const nextModels = next?.models || [];
  const key = (m) => `${m.provider_id}::${m.model_id}`;
  const prevMap = new Map(prevModels.map((m) => [key(m), m]));
  const nextMap = new Map(nextModels.map((m) => [key(m), m]));
  const added = [];
  const removed = [];
  const changed = [];
  for (const [k, nm] of nextMap) {
    const om = prevMap.get(k);
    if (!om) {
      added.push({ provider_id: nm.provider_id, model_id: nm.model_id, release_channel: nm.release_channel });
      continue;
    }
    const fields = [];
    for (const f of ['status', 'promotion_status', 'release_channel', 'deprecation_status']) {
      if (om[f] !== nm[f]) fields.push({ field: f, from: om[f], to: nm[f] });
    }
    if (fields.length) changed.push({ provider_id: nm.provider_id, model_id: nm.model_id, fields });
  }
  for (const [k, om] of prevMap) {
    if (!nextMap.has(k)) removed.push({ provider_id: om.provider_id, model_id: om.model_id });
  }
  return {
    schema_version: 'freeaiModelCatalogDiff.v1',
    generated_at: new Date().toISOString(),
    previous_generated_at: previous?.generated_at || null,
    next_generated_at: next?.generated_at || null,
    counts: { added: added.length, removed: removed.length, changed: changed.length },
    added,
    removed,
    changed,
  };
}
