# Swarm runtime v2 — durable process-local store

This extends **Swarm Runtime V1** with **file-backed persistence** for the same graph contract and execution semantics. There is still **no** distributed workflow engine, replay executor, or new node types in this layer.

## What v2 adds

- **Atomic JSON persistence**: each run is written to `{FREEAI_SWARM_RUNS_DIR}/{run_id}.json` (default `data/swarm_runs/` under `process.cwd()`).
- **Startup reload**: `initializeSwarmStoreFromDisk()` in `src/server.js` hydrates the in-memory map so admin history survives process restarts.
- **Replay-oriented metadata** on each run record (persisted with the run):
  - `execution_checkpoint` — last `node_id` that completed successfully in topo order.
  - `failed_at_node_id` — node where execution failed (when applicable).
  - `resume_eligible` — `true` when the run `failed` and both a checkpoint and `failed_at_node_id` are set (reserved for a future resume API; not executable in v2).
  - `schema_version: freeaiSwarmRunRecord.v2`
  - `durable_revision` — increments on each successful disk sync.

## Environment

| Variable | Default | Meaning |
|----------|---------|--------|
| `FREEAI_SWARM_PERSIST` | `1` | Set to `0` to disable all disk reads/writes (tests / embedded). |
| `FREEAI_SWARM_RUNS_DIR` | `data/swarm_runs` (resolved under cwd) | Absolute or relative directory for run JSON files. |

## Admin and aggregates

- `GET /admin/swarm-runs` and related routes read from the same store; after restart, listing reflects reloaded runs.
- `GET /admin/swarm-graph-summary` (`schema_version: freeaiSwarmGraphSummary.v2`) derives `runs_total`, completion counts, and receipt-derived execution counters from all runs currently in the map (including reloaded rows). It also reports `persistence_enabled` and `persistence_dir`.

## What v2 does not include

- Resume/replay execution (Epic 3).
- SQLite (only JSON files; swap later if needed).
- Encryption at rest, multi-writer HA, or tamper-evident ledgers.

## Normative modules

| Concern | Module |
|--------|--------|
| Disk I/O | `src/swarm/swarmRunPersistence.js` |
| Store + hydration | `src/swarm/graphStateStore.js` |

See also `docs/SWARM_RUNTIME_V1.md` and `docs/SWARM_GRAPH_CONTRACT_V1.md` for graph rules and HTTP shapes.
