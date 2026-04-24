# Runbook — model catalog refresh

## When to run

After changing `providers.json` pins, weekly scheduled job, or when investigating provider catalog drift.

## Command

```powershell
# CI or air-gapped
$env:FREEAI_REFRESH_SKIP_NETWORK="1"; node scripts/refresh_model_catalog.js

# Normal (attempts Ollama tag API when configured)
node scripts/refresh_model_catalog.js
```

## Outputs

- `data/model_control_plane/catalog_snapshot.json` (gitignored)
- `evidence/catalog_refresh/diff-*.json`

## Governance

Refresh **does not** change production pins. Review `/admin/model-catalog-summary` and promotion history before changing `FREEAI_MODEL_SELECTION_MODE` or pins.
