# FREE AI Agent Transfer Prompt

Use the following prompt with another AI agent when you want it to extract FREE AI into a host project quickly and correctly.

```text
You are integrating the FREE AI engine into a host project. Treat FREE AI as a coherent local runtime module that must be copied in full, not as a few files to cherry-pick.

Read first, in this order:
1. AGENTS.md
2. freeai.engine.manifest.json
3. out/integration-kit/integration-manifest.json
4. out/integration-kit/HOST_MERGE_GUIDE.md
5. README.md
6. FREEAI.md only if deeper architecture detail is needed
7. .env.example to map required environment keys

Your objective:
- copy the full FREE AI engine into the host project under a dedicated folder such as vendor/free-ai/
- preserve the runtime boundary, pipeline order, receipts, evidence, acquisition queue, and training state
- make the copied engine fully local to the host project with no dependency back to the source repository
- do not use the source repository as a wrapper, shared service, package reference, or live dependency

Required copy set:
- directories: src, skills, personas, data, memory, evidence, acquisition, tests, scripts, web
- authoritative files: AGENTS.md, README.md, FREEAI.md, .env.example, providers.json, src/server.js, src/server/router.js, src/retrieval/evalMetrics.js, src/retrieval/qualityGate.js, src/prompt/runtime.js, src/prompt/contracts.js, skills/active_catalog.json, src/training/engine.js, src/training/runtime.js, src/training/store.js

Non-negotiable rules:
- do not rewrite the architecture into host-native fragments during the first merge
- do not perform a partial copy; copy the full engine set required by the manifest
- do not drop writable runtime folders: data, memory, evidence, acquisition
- do not bypass translator, context, reasoning, persona, skills, prompt runtime, validation, or receipts
- preserve admin and inspection endpoints or provide equivalent host access

Required verification after copy:
- node scripts/quality_gate.js --fast
- node scripts/run_all_tests.js
- node scripts/run_provider_probes.js
- node scripts/run_training_cycle.js
- node scripts/training_status_report.js

Also verify these HTTP/admin surfaces exist in the copied engine:
- POST /v1/infer
- GET /v1/stream
- GET /health
- GET /health/live
- GET /health/ready
- GET /health/startup
- /admin/imports
- /admin/quarantine
- /admin/evidence
- /admin/prompts
- /admin/validation
- /admin/traces
- /admin/provider-ladder
- /admin/provider-health
- /admin/quota-snapshots
- /admin/cooldowns
- /admin/provider-governance
- /admin/decision-graphs
- /admin/prompt-promotions
- /admin/receipt-chain
- /admin/memory-graph
- /admin/acquisition
- /admin/training
- /admin/training/insights
- /admin/training/overlays
- /admin/training/review-queue
- /admin/training/run
- /admin/training/control
- /admin/training/profile
- /admin/training/review
- /admin/prompt-preview

Merge process you must follow:
1. copy the full engine into the host repo under a dedicated folder
2. keep all runtime state folders writable and local to the copied engine
3. configure environment keys from .env.example inside the host project
4. run quality gate first, then tests, then host-specific boot verification
5. report any host path/import rewrites explicitly before making them

Deliverables expected from you:
1. a short merge plan
2. the exact destination path inside the host project
3. the list of copied directories and files
4. any import/path changes required for the host
5. the host run/test commands
6. a verification summary proving the vendored copy starts and passes checks

Optimize for the fastest correct full-copy merge, not the smallest diff.
```