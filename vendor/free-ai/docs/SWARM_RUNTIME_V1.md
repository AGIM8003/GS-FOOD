# Swarm graph runtime v1 (in-process)

This document describes the **minimal native swarm graph runtime** shipped in this repository copy. It is intentionally smaller than a full post-enterprise orchestration platform.

## What v1 includes

- `POST /v1/swarm/run` with **always-on strict validation** (no environment flag disables validation for this route).
- A fixed **v1 graph contract**: up to three `prompt_node` vertices, optional fan-out (at most two outgoing edges per node), exactly one `merge_node`, exactly one `finalization_node`, DAG only, all nodes reachable from `entry_node_id`.
- **Hot state** in `src/swarm/graphStateStore.js`. With **Swarm Runtime v2** (default), each run is also **persisted to disk** so admin history survives restarts; see `docs/SWARM_RUNTIME_V2.md`.
- Deterministic **merge strategies**: `deterministic_priority` and `first_valid` (`src/swarm/mergeExecutor.js`).
- **Receipts**: `graph_receipt`, `node_receipt`, `merge_receipt`, `final_receipt` (`src/swarm/writeSwarmReceipt.js`).
- Read-only **admin** JSON: `GET /admin/swarm-runs`, `GET /admin/swarm-runs/:runId`, `GET /admin/swarm-graph-summary` (same auth posture as other `/admin/*` routes in `src/server.js`).

## What v1 explicitly does not include

- **Replay / resume execution**, checkpoints as an executable feature, or distributed workers. (File-backed **storage** for runs is covered in v2; it is not a workflow replay engine.)
- `tool_node`, `escalation_node`, human review gates, full policy fabric, pack admission state machine, or SDK.
- Automatic “latest model” promotion into live inference.
- Multi-tenant durable workflow engines or external queues.

## Durability (v2 default)

When `FREEAI_SWARM_PERSIST` is not `0`, runs are written as JSON under `FREEAI_SWARM_RUNS_DIR` (default `data/swarm_runs/`) and reloaded at server startup. Set `FREEAI_SWARM_PERSIST=0` for a pure in-memory store (tests only). v2 is still **not** a distributed audit log of record; it is a single-host operational store.

## Supported node types

- `prompt_node` — requires `role_id`, `task_lane`, and `config.prompt`. Execution uses the existing router with `preview_only: true` and `intent_family: 'swarm_task'` so tests and hosts avoid paid provider calls when the preview path is taken.
- `merge_node` — `config.merge_strategy` is `deterministic_priority` (requires `config.priority` as ordered `node_id` list) or `first_valid`.
- `finalization_node` — requires `role_id` **or** `config.is_final` / `config.final_handler` marker.

## Strict validation

`validateSwarmRunRequest` (`src/server/validation/validateSwarmRunRequest.js`) runs on every `POST /v1/swarm/run` body before execution. Malformed graphs are rejected with HTTP `400` and an `errors` array.

## Admin endpoints

See `docs/SWARM_GRAPH_CONTRACT_V1.md` for response shapes. All routes sit behind the same `isProtectedAdminPath` + `adminAuthorized` checks as existing admin JSON.

## Normative code map

| Concern | Module |
|--------|--------|
| Graph validation | `src/swarm/graphSchema.js`, `src/swarm/nodeSchema.js`, `src/swarm/edgeSchema.js` |
| Graph hash | `src/swarm/graphHash.js` |
| Execution | `src/swarm/runSwarmGraph.js`, `src/swarm/nodeExecutor.js` |
| Merge | `src/swarm/mergeExecutor.js` |
| State / receipts | `src/swarm/graphStateStore.js`, `src/swarm/transitionReducer.js` |
| HTTP | `src/server.js` |
