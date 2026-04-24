# FREE AI — model catalog refresh

**Status:** Human-facing contract. Not loaded by the engine at runtime.

## Where it runs

Refresh **must run inside the vendored FREE AI copy** (for example `vendor/free-ai/`). It does not pull live code from the upstream FREE AI repository.

## Commands

```powershell
node scripts/refresh_model_catalog.js
```

Optional: `FREEAI_REFRESH_SKIP_NETWORK=1` skips **all** live provider HTTP discovery (Ollama tag API, OpenRouter `/v1/models`, Groq `/v1/models`) and uses static pins from `providers.json` (useful in CI or air-gapped hosts).

Live refresh details:

- **Ollama:** `OLLAMA_ENDPOINT` (default `http://127.0.0.1:11434`) — `/api/tags`.
- **OpenRouter:** `https://openrouter.ai/api/v1/models` — optional `OPENROUTER_API_KEY` for reliability.
- **Groq:** `https://api.groq.com/openai/v1/models` — requires `GROQ_API_KEY`.
- **OpenAI:** `https://api.openai.com/v1/models` — requires `OPENAI_API_KEY` (includes heuristic `modality_flags` on listed models).

## Outputs

- Snapshot: `data/model_control_plane/catalog_snapshot.json` (gitignored)
- Status: `data/model_control_plane/refresh_status.json` (gitignored)
- Diff artifacts: `evidence/catalog_refresh/diff-*.json`

## Fail-closed rules

- Unreachable catalog sources mark the provider **DEGRADED**; known pins from `providers.json` are still recorded when a live source fails (same pattern for Ollama, OpenRouter, and Groq).
- Refresh **never** edits `providers.json` or production pins.
- New rows default to `promotion_status: discovered` — no silent promotion.
