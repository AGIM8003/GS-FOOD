# Host swarm orchestrator (example)

FREE AI handles **one** `POST /v1/infer` per call. A **host** service owns fan-out, deadlines, merge policy, and the fan-in rollup described in [FREEAI.md](../../FREEAI.md) §19.4.

## What this folder contains

- **`lib.mjs`** — `makeTraceparent`, `inferWithRetry` (timeout + bounded retries on 429/5xx), `runSwarmFanoutDemo(baseUrl, taskId?)` for scripts and tests.
- **`example_fanout.mjs`** — Thin CLI wrapper around `runSwarmFanoutDemo` against your running server (`BASE_URL`). **Merge logic is not implemented** in the engine; the third call only demonstrates payload shape and optional rollup receipt emission.

## Prerequisites

- Engine running locally (e.g. `PORT=3000 node src/server.js`).
- Optional: `FREEAI_INFER_API_KEY` / `Authorization` if your deployment requires infer auth.

## Headers

Forward **`traceparent`** / **`tracestate`** from your orchestrator on every worker call (FREEAI §22). The example script omits them for brevity; production hosts should set them.

## Further reading

- [docs/POST_ENTERPRISE_EXTENSIONS.md](../../docs/POST_ENTERPRISE_EXTENSIONS.md) — Swarm integration table and non-goals.  
- [docs/QUALITY_GATE_CI.md](../../docs/QUALITY_GATE_CI.md) — CI and smoke expectations.  
- [SWARM_DEMO.md](../../SWARM_DEMO.md) — `npm run swarm-demo` (self-contained server + three POSTs).
