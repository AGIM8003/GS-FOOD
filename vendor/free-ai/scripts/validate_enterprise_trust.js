#!/usr/bin/env node
/**
 * Preflight: validates enterprise security config the same way the server does at startup.
 * Run from the vendored engine root after setting production env vars.
 *
 * Optional: FREEAI_VALIDATE_TRUST_STRICT=1 — fail if production_profile and CORS allowlist contains '*'.
 *
 * Usage: node scripts/validate_enterprise_trust.js
 */
import { loadConfig, validateEnterpriseSecurityConfig } from '../src/config.js';

const strict = process.env.FREEAI_VALIDATE_TRUST_STRICT === '1';

async function main() {
  const cfg = await loadConfig();
  const sec = cfg.security;
  const v = validateEnterpriseSecurityConfig(cfg);
  if (!v.ok) {
    console.error(v.message || 'validateEnterpriseSecurityConfig failed');
    process.exit(1);
  }

  const warnings = [];
  if (sec?.production_profile) {
    const origins = sec.cors_allow_origins || [];
    if (origins.includes('*')) {
      const msg = 'CORS allowlist includes wildcard * in production profile — avoid unless browsers are trusted.';
      if (strict) {
        console.error(msg);
        process.exit(1);
      }
      warnings.push(msg);
    }
    if (origins.length === 0) {
      warnings.push(
        'Production profile with empty FREEAI_CORS_ALLOW_ORIGINS: browser cross-origin calls will not get ACAO (OK for server-to-server only).',
      );
    }
    if (!sec.infer_api_key_required) {
      warnings.push(
        'Infer token not required (FREEAI_REQUIRE_INFER_TOKEN unset). Ensure the reverse proxy authenticates /v1/infer in production.',
      );
    }
  }

  if (warnings.length) {
    console.error('validate_enterprise_trust: warnings:\n- ' + warnings.join('\n- '));
    if (strict && warnings.some((w) => w.includes('wildcard'))) {
      process.exit(1);
    }
  }

  console.log('validate_enterprise_trust: OK');
  console.log(
    JSON.stringify(
      {
        production_profile: !!sec?.production_profile,
        require_admin_key: !!sec?.require_admin_key,
        infer_api_key_required: !!sec?.infer_api_key_required,
        cors_origin_count: (sec?.cors_allow_origins || []).length,
        model_selection_policy_mode: cfg.model_selection_policy_mode,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
