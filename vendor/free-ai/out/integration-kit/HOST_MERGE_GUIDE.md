# FREE AI Host Merge Guide

This folder was generated from the local FREE AI engine to help another AI or engineer merge it into a host project safely.

Owner-enforced rule: FREE AI must be copied fully into the host project. Using this source repository as a wrapper, shared runtime, or live reference is forbidden.

## Required Copy Set

- src/
- skills/
- personas/
- data/
- memory/
- evidence/
- acquisition/
- tests/
- scripts/
- web/
- AGENTS.md
- README.md
- FREEAI.md
- .env.example
- providers.json
- src/server.js
- src/server/router.js
- src/retrieval/evalMetrics.js
- src/retrieval/qualityGate.js
- src/prompt/runtime.js
- src/prompt/contracts.js
- skills/active_catalog.json
- src/training/engine.js
- src/training/runtime.js
- src/training/store.js

## Host Merge Steps

1. Copy the full FREE AI engine into a dedicated local folder inside the host project such as `vendor/free-ai/`.
2. Do not omit any required directories or authoritative files from the copied engine.
3. Preserve relative paths and all writable state directories: `data/`, `memory/`, `evidence/`, and `acquisition/`.
4. Do not point back to this repository with symlinks, wrappers, package aliases, or shared-source imports.
5. Configure the required environment variables in the host project.
6. Wire the host to either call `POST /v1/infer` over HTTP or instantiate the engine router in-process, but only from the copied local engine.
7. Run the verification commands after integration.
8. Verify prompt preview, validation, trace, training, route evidence, and receipt-chain integrity still work.

## Run Commands

```powershell
node src/server.js
node scripts/quality_gate.js --fast
node scripts/run_all_tests.js
node scripts/run_provider_probes.js
node scripts/evaluate_project.js
node scripts/run_training_cycle.js
node scripts/training_status_report.js
node scripts/training_review_report.js
```

## Fast Merge Pattern

Use `vendor/free-ai/` in the host project, copy the full engine intact, keep folder-relative paths unchanged, and expose host scripts that call the vendored engine directly.

## Environment Keys

- OPENROUTER_API_KEY
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- GEMINI_API_KEY
- GROQ_API_KEY
- HF_TOKEN
- FIREWORKS_API_KEY
- OLLAMA_ENDPOINT
- PORT
- FREEAI_MODE

## Authoritative Inputs

- AGENTS.md
- freeai.engine.manifest.json
- integration-manifest.json
- integration-file-index.json
- HOST_MERGE_PLAYBOOK.json
- AGENT_TRANSFER_PROMPT.md
- host-env.example
- host-package-snippet.json