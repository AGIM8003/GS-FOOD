# Runbook — provider outage

## Symptoms

Elevated `fallback_used` in metrics, adapter errors in receipts, cooldowns in `/admin/cooldowns`.

## Steps

1. Confirm outage scope via provider status pages or probes (`node scripts/run_provider_probes.js`).
2. **Disable** flaky provider in `providers.json` (`"enabled": false`) or extend cooldown via operational policy (restart does not clear budget state files — follow host backup practices).
3. Verify remaining providers cover critical personas; adjust `pinnedModel` order if needed.
4. Document incident time window for postmortem.
