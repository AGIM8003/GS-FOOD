function buildResult(decision, reason_code, summary, remediation = null) {
  return {
    policy_id: `pol-provider_model_eligibility-${Date.now()}`,
    policy_zone: 'provider_model_eligibility',
    decision,
    blocking: decision === 'deny',
    reason_code,
    summary,
    remediation,
    evaluated_at: new Date().toISOString(),
  };
}

function parseCsvSet(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  return new Set(
    s.split(',').map((x) => x.trim()).filter(Boolean),
  );
}

export function evaluateProviderEligibilityPolicy(ctx) {
  const node = ctx?.node || {};
  const cfg = node?.config || {};
  const providerId = cfg.provider_id || null;
  const modelId = cfg.model_id || null;

  const allowedProviders = parseCsvSet(process.env.FREEAI_ALLOWED_PROVIDERS);
  const deniedProviders = parseCsvSet(process.env.FREEAI_DENIED_PROVIDERS);
  const deniedModels = parseCsvSet(process.env.FREEAI_DENIED_MODELS);

  const strict = process.env.FREEAI_PROVIDER_POLICY_STRICT === '1';

  if (strict && (!providerId || !modelId)) {
    return buildResult(
      'deny',
      'provider_or_model_missing',
      'Strict provider eligibility requires provider_id and model_id',
      'Populate node.config.provider_id and node.config.model_id',
    );
  }

  if (providerId && deniedProviders?.has(providerId)) {
    return buildResult(
      'deny',
      'provider_denied',
      `Provider '${providerId}' denied by policy`,
      'Use an approved provider_id',
    );
  }
  if (providerId && allowedProviders && !allowedProviders.has(providerId)) {
    return buildResult(
      'deny',
      'provider_not_allowlisted',
      `Provider '${providerId}' not in allowlist`,
      'Set FREEAI_ALLOWED_PROVIDERS to include the provider',
    );
  }
  if (modelId && deniedModels?.has(modelId)) {
    return buildResult(
      'deny',
      'model_denied',
      `Model '${modelId}' denied by policy`,
      'Pick a different model_id',
    );
  }
  if (strict && allowedProviders && providerId && !allowedProviders.has(providerId)) {
    return buildResult(
      'deny',
      'provider_not_allowlisted',
      `Provider '${providerId}' not in strict allowlist`,
      'Set FREEAI_ALLOWED_PROVIDERS to include the provider',
    );
  }
  return buildResult('allow', 'provider_model_allowed', 'Provider/model eligibility passed');
}

