# Swarm graph contract v1

Normative request body for `POST /v1/swarm/run` (same object validated by `validateSwarmRunRequest`).

## Request schema (summary)

| Field | Type | Notes |
|-------|------|--------|
| `graph_id` | string | Required, non-empty. |
| `graph_name` | string | Required, non-empty. |
| `nodes` | array | Non-empty; see node object. |
| `edges` | array | Required; see edge object. |
| `entry_node_id` | string | Must reference a `prompt_node`. |
| `receipt_mode` | string | One of `full`, `summary`, `none` (envelope validation). |
| `input_payload` | object | Arbitrary JSON context (not secrets); surfaced to prompt executor context. |

### Node object

| Field | Type | Notes |
|-------|------|--------|
| `node_id` | string | Unique among `nodes`. |
| `node_type` | string | `prompt_node` \| `merge_node` \| `finalization_node`. |
| `role_id` | string | Required for `prompt_node`; for `finalization_node` either set `role_id` or `config.is_final` / `config.final_handler`. |
| `task_lane` | string | Required for `prompt_node`. |
| `config` | object | See node type rules in `docs/SWARM_RUNTIME_V1.md`. |

### Edge object

| Field | Type |
|-------|------|
| `from_node_id` | string |
| `to_node_id` | string |

## Example graph (linear)

```json
{
  "graph_id": "demo-linear",
  "graph_name": "Linear v1",
  "entry_node_id": "p1",
  "receipt_mode": "full",
  "input_payload": { "topic": "hello" },
  "nodes": [
    {
      "node_id": "p1",
      "node_type": "prompt_node",
      "role_id": "worker",
      "task_lane": "default",
      "config": { "prompt": "Say hello in one word." }
    },
    {
      "node_id": "m1",
      "node_type": "merge_node",
      "role_id": "merge",
      "task_lane": "default",
      "config": { "merge_strategy": "first_valid" }
    },
    {
      "node_id": "f1",
      "node_type": "finalization_node",
      "role_id": "final",
      "task_lane": "default",
      "config": {}
    }
  ],
  "edges": [
    { "from_node_id": "p1", "to_node_id": "m1" },
    { "from_node_id": "m1", "to_node_id": "f1" }
  ]
}
```

## State model

### Run states

`created` → `validating` → `admitted` → `running` → `completed` \| `failed`

Invalid transitions throw (`src/swarm/transitionReducer.js`).

### Node states

`pending` → `admitted` → `running` → `completed` \| `failed`; also `pending` → `skipped` (reserved for future branches).

## Receipts model

Each receipt includes at minimum: `receipt_id`, `receipt_type`, `run_id`, `graph_id`, `node_id` (nullable for graph-level), `status`, `timestamp`, `inputs_hash`, `outputs_hash`, `duration_ms`, `summary`.

Types: `graph_receipt`, `node_receipt`, `merge_receipt`, `final_receipt`.

## Persistence (runtime v2)

When disk persistence is enabled (default), each completed or failed run is stored as `{run_id}.json` under `FREEAI_SWARM_RUNS_DIR`. Admin `GET` routes return data from the hydrated in-memory map, which is filled from disk at process start. See `docs/SWARM_RUNTIME_V2.md`.

## Error conditions

- **HTTP 400** — `swarm_validation_failed` with `errors: string[]` when the graph or envelope fails validation.
- **HTTP 422** — execution finished in a failed business state (for example merge could not pick a branch); body includes `ok: false`, `run_id`, `error`.
- **HTTP 401** — `infer_unauthorized` when infer token is required by config (same gate as `/v1/infer`).
- **HTTP 401** — `admin_unauthorized` on admin routes when admin key is required and missing.

Admin detail **404** when `run_id` is unknown.
