/**
 * Static catalog from pinned + candidate models in providers.json (no network).
 * @param {object} providerRow providers.json entry
 */
export function staticModelsFromProviderRow(providerRow) {
  const pid = providerRow.id;
  const ids = [providerRow.pinnedModel, ...(providerRow.candidates || [])].filter(Boolean);
  const seen = new Set();
  const models = [];
  for (const model_id of ids) {
    if (seen.has(model_id)) continue;
    seen.add(model_id);
    models.push({
      model_id,
      canonical_name: model_id,
      release_channel: model_id.includes('latest') ? 'latest' : 'pinned',
      status: model_id.includes('latest') ? 'latest' : 'stable',
      free_tier_eligible: !!providerRow.free_tier_eligible,
    });
  }
  return { provider_id: pid, status: 'OK', models };
}
