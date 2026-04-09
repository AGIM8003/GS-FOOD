# FREE AI Reuse Contract

This repository is not the final product application.

It is a reusable AI engine that is intended to be copied in full into other projects.
Any AI agent or engineer using this repository must treat it as a portable runtime module that is locally copied into the host project, not as a shared wrapper, remote reference, or one-off app.

## Core Rule

If you integrate FREE AI into another project, carry over the engine as a coherent local module boundary.
Do not cherry-pick random files without preserving the pipeline, contracts, receipts, evidence layers, acquisition state, and training state.

FREE AI is authoritative for its own runtime behavior once copied into a host project.
After copying, the localized copy inside the host project becomes that host's source of truth.

## Owner-Enforced Copy Rule

By owner policy, FREE AI MUST be copied in full into the destination project and run from that copied local implementation.

The following are forbidden:

- using this source repository as a shared runtime for multiple external projects
- wrapping this repository remotely and serving it as a dependency to other projects without copying it locally
- integrating by reference, symlink, subtree pointer, package alias, or any other live coupling back to this repository

The only allowed integration pattern is a full local copy or vendorization into the destination project, after which the copied version inside that host becomes the operative implementation.

## What FREE AI Is

FREE AI is a local, self-contained engine that provides:

- translator -> context -> memory -> reasoning -> persona -> skills -> prompt runtime -> provider routing -> response -> receipts -> evidence
- multi-provider free-first routing and local fallback
- retrieval evaluation and corrective local fallback gating
- audited skill catalog and persona-aware orchestration
- prompt contracts, prompt variants, structured output validation, and bounded repair
- chained receipts, tracing, route evidence, admin inspection, acquisition, and governed training overlays

## Non-Negotiable Integration Rules

1. Preserve the engine boundary.
   Copy the full engine into the host project under a dedicated engine folder such as `vendor/free-ai/`, `engines/free-ai/`, or `src/freeai/`.

2. Preserve the pipeline order.
   Do not bypass translator, context, reasoning, persona, skill orchestration, prompt runtime, validation, receipts, acquisition, or training overlays if you want the engine behavior to remain correct.

3. Preserve evidence and receipts.
   The engine expects to write runtime artifacts under local folders such as `evidence/`, `data/`, `memory/`, and `acquisition/`.

4. Preserve provider governance.
   Keep `providers.json`, prompt contracts, validation, cooldowns, quota snapshots, health matrix behavior, and training controls intact.

5. Do not introduce hidden external coupling.
   No symlink, shared-source, wrapper reference, package alias, or live dependency back to this original repository should remain after integration.

6. If you adapt the engine, keep the adapted copy fully local to the host project.

7. Do not deploy this repository as a shared wrapper for other projects.
   If another project needs FREE AI, copy it into that project and run the copied local engine there.

## Mandatory Copy Set For A Host Project

Required directories:

- `src/`
- `skills/`
- `personas/`
- `tests/`
- `scripts/`
- `web/`
- `data/`
- `memory/`
- `evidence/`
- `acquisition/`

Required root files:

- `providers.json`
- `.env.example`
- `package.json`

Required docs and machine-readable contract:

- `AGENTS.md`
- `freeai.engine.manifest.json`
- `README.md`
- `FREEAI.md`
- `.env.example`

Anything less than that full local copy is non-compliant with the owner policy.

## Canonical Entry Points

- Main server entry: `src/server.js`
- Main request path: `POST /v1/infer`
- Streaming path: `GET /v1/stream`
- Health path: `GET /health`
- Health probes: `GET /health/live`, `GET /health/ready`, `GET /health/startup`

Admin and inspection endpoints:

- `/admin/imports`
- `/admin/quarantine`
- `/admin/evidence`
- `/admin/prompts`
- `/admin/validation`
- `/admin/traces`
- `/admin/provider-ladder`
- `/admin/provider-health`
- `/admin/quota-snapshots`
- `/admin/cooldowns`
- `/admin/provider-governance`
- `/admin/decision-graphs`
- `/admin/prompt-promotions`
- `/admin/receipt-chain`
- `/admin/memory-graph`
- `/admin/acquisition`
- `/admin/training`
- `/admin/training/insights`
- `/admin/training/overlays`
- `/admin/training/review-queue`
- `/admin/training/run`
- `/admin/training/control`
- `/admin/training/profile`
- `/admin/training/review`
- `/admin/prompt-preview`

## Local Copied Integration Modes

All modes below are allowed only after FREE AI has been copied fully into the host project.

### Mode A: Local Copied HTTP Engine

Use the copied FREE AI engine as a local HTTP service inside the host project.

Best when:

- the host app is in a different language
- you want clean process isolation
- you want to preserve inspection endpoints without host rewiring

Host responsibilities:

- start `src/server.js` from the copied engine folder
- pass requests to `/v1/infer`
- persist `.env` secrets and runtime folders locally inside the host project copy

### Mode B: Local Copied Embedded Node Module

Use the copied FREE AI internals directly from the host Node application.

Best when:

- the host is already Node-based
- you want direct access to `Router`
- you want the engine to run in-process

Host responsibilities:

- load config via `src/config.js` from the copied engine
- instantiate `Router` from the copied engine
- preserve file-backed state locations

### Mode C: Vendorized Engine Folder

Copy the repository into a host-owned engine folder and adapt boundaries there.

Best when:

- the host application wants a local vendored engine
- the host needs controlled customization

Host responsibilities:

- keep the vendored engine coherent
- update imports and relative paths safely inside the copied engine
- preserve manifest, contracts, tests, evidence behavior, acquisition state, and training state

## Required Runtime Assumptions

- Node.js 18+
- file write access for `data/`, `memory/`, `evidence/`, and `acquisition/`
- local JSON files remain part of runtime state
- environment variables are host-provided, never hardcoded

Environment keys currently recognized:

- `OPENROUTER_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `FIREWORKS_API_KEY`
- `OLLAMA_ENDPOINT`
- `PORT`
- `FREEAI_MODE`

## Host-Project Merge Checklist

1. Copy the full engine into a dedicated local folder in the host project.
2. Copy the full mandatory copy set, not a subset.
3. Preserve folder-relative file access semantics.
4. Keep `providers.json`, `skills/active_catalog.json`, and `personas/` local.
5. Provide writable `data/`, `memory/`, and `evidence/` folders.
6. Provide writable `acquisition/` folders for queued persona/model acquisition jobs.
7. Configure environment variables in the host.
8. Decide whether the host will call FREE AI over HTTP or in-process.
9. Run `node scripts/quality_gate.js --fast` after integration.
10. Run tests after integration.
11. Verify prompt preview, validation, traces, training controls, receipt chain integrity, and route receipts still work.

## What Not To Break

- prompt runtime metadata and output contracts
- receipt generation and evidence persistence
- provider cooldown and health matrix state
- active skill catalog authority
- acquisition queue and training overlays
- persona selection pipeline
- translator, context, reasoning, and metacognition chain

## What Another AI Should Read First

1. `AGENTS.md`
2. `freeai.engine.manifest.json`
3. `README.md`
4. `FREEAI.md` if deeper architecture context is needed
5. `out/integration-kit/AGENT_TRANSFER_PROMPT.md` after generating the integration kit

## Expected Outcome In A Host Project

After successful integration, the host project should have:

- a full copied FREE AI engine folder inside the host repository
- stable request entry points
- local evidence and state folders
- explicit environment configuration
- prompt/runtime validation intact
- provider routing and free-tier reliability preserved

If these are not preserved, the host app is not using FREE AI correctly.
