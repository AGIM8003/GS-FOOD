# Runbook — incident response (FREE AI engine)

## Scope

Vendored FREE AI copy in a host project. Assume reverse proxy and secrets are host-owned.

## Severity triage

1. **Availability** — engine down, 5xx from adapters, provider-wide outage.
2. **Integrity** — unexpected model output, receipt chain failures, training mutations.
3. **Confidentiality** — suspected key leak, unauthorized `/admin` access.

## Immediate steps

1. **Isolate** — remove public routes at proxy; keep loopback-only if needed for forensics.
2. **Rotate** — `ADMIN_API_KEY`, `FREEAI_INFER_API_KEY`, provider API keys (see `key_rotation.md`).
3. **Preserve** — copy `evidence/`, relevant `data/metrics.jsonl` tails, and server logs before destructive fixes.

## Recovery

1. Restore last known `providers.json` pins from version control.
2. `node scripts/quality_gate.js --fast` and `node scripts/run_all_tests.js` on the restored tree.
3. Re-enable traffic only after `/health/ready` passes behind auth.
