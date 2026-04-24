# Swarm Human Review Gate

## Overview

The `human_review_node` pauses a running graph and waits for explicit human approval or rejection before continuing.

## Node Type

```json
{
  "node_id": "review1",
  "node_type": "human_review_node",
  "role_id": "reviewer",
  "task_lane": "review",
  "config": {
    "requested_action": "approve_to_continue"
  }
}
```

## Behavior

1. When execution reaches a `human_review_node`:
   - A review record is created with status `pending`
   - Node transitions to `waiting_human_review`
   - Run transitions to `paused_for_review`
   - A `review_receipt` is appended
   - Execution pauses and returns the `review_id`

2. On approve (`POST /admin/swarm-reviews/:reviewId/approve`):
   - Review status → `approved`
   - Run can be resumed via `/admin/swarm-runs/:runId/resume`

3. On reject (`POST /admin/swarm-reviews/:reviewId/reject`):
   - Review status → `rejected`
   - Run transitions to `rejected` or follows configured rejection behavior

## Review Record Fields

| Field | Type | Description |
|-------|------|-------------|
| review_id | string | Unique review identifier |
| run_id | string | Associated run |
| node_id | string | The review node |
| requested_action | string | What action is requested |
| review_status | enum | `pending`, `approved`, `rejected` |
| reviewer_id | string? | Who approved/rejected |
| decision_notes | string? | Notes from reviewer |
| decided_at | string? | ISO timestamp of decision |

## Admin Endpoints

- `GET /admin/swarm-reviews` — list all reviews
- `GET /admin/swarm-reviews/:reviewId` — review detail
- `POST /admin/swarm-reviews/:reviewId/approve` — approve
- `POST /admin/swarm-reviews/:reviewId/reject` — reject
