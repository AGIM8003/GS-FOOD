# Swarm Replay and Resume

## Overview

When a swarm run fails with a valid checkpoint, it can be resumed from that checkpoint instead of restarting from scratch. Resume continues execution from the last successfully completed node.

## Prerequisites

A run is resume-eligible when:
- `resume_eligible === true` on the run record
- `execution_checkpoint` is set (a node completed before failure)
- `failed_at_node_id` is set
- `graph_snapshot` is stored (full graph body including `node.config`)

## Resume Flow

1. Caller POSTs to `/admin/swarm-runs/:runId/resume`
2. Resume policy is evaluated (`resume_execution` zone)
3. Run transitions: `failed` → `resumable` → `resumed` → `running`
4. Failed/pending nodes after the checkpoint are re-executed
5. Already-completed nodes are skipped
6. A `resume_receipt` is appended to the run record
7. `durable_revision` is incremented

## Resume Record Fields

On resume, the run record gains:
- `resumed_from_checkpoint` — the checkpoint node_id
- `resumed_at` — ISO timestamp
- `resumed_by` — optional reviewer/admin ID
- `resume_reason` — optional reason string

## Policy Checks

Resume is denied if:
- Run is not resume-eligible
- Checkpoint is missing
- Graph hash mismatch (if provided)
- Graph snapshot is missing

## Fail-Closed Behavior

If resume itself fails, the run returns to `failed` state with the new error appended.
