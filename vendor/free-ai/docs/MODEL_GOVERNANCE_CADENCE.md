# FREE AI — model catalog and pin governance cadence

**Status:** Human-facing. Not engine-loaded.

## Default posture

- Keep **`PINNED_ONLY`** until you have governed promotion evidence ([AGENTS.md](../AGENTS.md), [MODEL_SELECTION_POLICY.md](MODEL_SELECTION_POLICY.md)).
- Set explicitly: `FREEAI_MODEL_SELECTION_MODE=PINNED_ONLY` or `settings.json` → `model_selection_policy_mode`.

## Recommended cadence

| Activity | Frequency | Owner | Artifact |
|----------|-----------|-------|----------|
| Catalog refresh (networked) | Weekly or on provider change | Platform | `data/model_control_plane/catalog_snapshot.json`, diff under `evidence/catalog_refresh/` |
| Catalog refresh (CI / air-gap) | Every build | CI | `FREEAI_REFRESH_SKIP_NETWORK=1` |
| Review admin summaries | Weekly | On-call | `GET /admin/model-catalog-summary`, `/admin/model-refresh-status` |
| Pin change approval | Ad hoc | Architecture + security | PR + promotion evidence |

## Commands (inside vendored copy)

```bash
# Live discovery (requires network to Ollama / OpenRouter / Groq as configured)
node scripts/refresh_model_catalog.js

# CI-safe
FREEAI_REFRESH_SKIP_NETWORK=1 node scripts/refresh_model_catalog.js
```

## Approval flow (suggested)

1. Run refresh; inspect diff JSON.
2. If new models appear, they remain **discovered** until acceptance gates pass ([MODEL_ACCEPTANCE_GATES.md](MODEL_ACCEPTANCE_GATES.md)).
3. Update `providers.json` pins only via reviewed change; never auto-edit pins from refresh.

## Host automation examples

**cron (Linux)** — Sunday 03:00 local:

```cron
0 3 * * 0 cd /opt/free-ai-engine && /usr/bin/node scripts/refresh_model_catalog.js >> /var/log/freeai-catalog.log 2>&1
```

**Windows Task Scheduler** — run `node scripts\refresh_model_catalog.js` with working directory set to the engine root.
