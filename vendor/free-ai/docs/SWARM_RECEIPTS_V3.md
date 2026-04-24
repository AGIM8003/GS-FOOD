# Swarm Receipts V3

## Receipt Types

| Type | When Emitted |
|------|-------------|
| `graph_receipt` | Graph admitted for execution |
| `node_receipt` | Prompt node completed or failed |
| `merge_receipt` | Merge node completed |
| `final_receipt` | Finalization completed |
| `policy_receipt` | Policy evaluation (any zone) |
| `review_receipt` | Human review requested |
| `resume_receipt` | Run resumed from checkpoint |
| `tool_receipt` | Tool node completed or failed |

## Receipt Fields

All receipt types share these fields:

| Field | Type | Description |
|-------|------|-------------|
| `receipt_id` | string | Unique receipt ID |
| `receipt_type` | string | One of the types above |
| `run_id` | string | Associated run |
| `graph_id` | string | Associated graph |
| `node_id` | string? | Associated node (null for graph-level) |
| `status` | string | `ok`, `failed`, `blocked`, `pending` |
| `timestamp` | string | ISO timestamp |
| `inputs_hash` | string | SHA256 hash of inputs |
| `outputs_hash` | string | SHA256 hash of outputs |
| `duration_ms` | number | Execution duration |
| `summary` | string | Human-readable summary |

## Receipt Mode Behavior

The `receipt_mode` field on graph submission controls receipt storage:

| Mode | Behavior |
|------|----------|
| `full` | All receipt fields stored (default) |
| `summary` | Only hash-level fields stored (no raw inputs/outputs) |
| `none` | No receipts stored |

Receipt validation (`isValidSwarmReceiptV1`) is enforced at append time regardless of mode.

## Lineage

All receipts for a run are attached to the run record and exposed via `GET /admin/swarm-runs/:runId`. The receipt array preserves insertion order for chronological lineage.
