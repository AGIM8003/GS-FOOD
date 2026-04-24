# Runbook — key rotation

## Admin API key (`ADMIN_API_KEY`)

1. Generate a new random secret (e.g. 32+ bytes base64).
2. Update secret store / deployment manifest; **dual-run** briefly if your platform supports two valid keys (FREE AI accepts one key at a time — plan a short maintenance window).
3. Restart the engine process.
4. Update any CI or monitoring checks that call `/admin/*`.

## Infer API key (`FREEAI_INFER_API_KEY`)

Same pattern when `FREEAI_REQUIRE_INFER_TOKEN=1`. Update gateway or clients sending `Authorization: Bearer` / `X-Infer-Key` before revoking the old value.

## Provider keys

Rotate `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, etc., in the host secret store and `.env`; run `node scripts/run_provider_probes.js` after rotation when applicable.
