# Swarm Admin Operational Control

## Overview

V3 adds write-capable admin endpoints for live operational management of swarm runs, reviews, and checkpoints.

## Endpoints

### Read Endpoints (GET)

| Endpoint | Description |
|----------|-------------|
| `/admin/swarm-runs` | List all runs |
| `/admin/swarm-runs/:runId` | Run detail with receipts |
| `/admin/swarm-graph-summary` | Aggregate statistics |
| `/admin/swarm-reviews` | List all review records |
| `/admin/swarm-reviews/:reviewId` | Review detail |
| `/admin/swarm-policy-summary` | Policy zones and status |
| `/admin/swarm-checkpoints` | Runs with checkpoints |

### Write Endpoints (POST)

| Endpoint | Description |
|----------|-------------|
| `/admin/swarm-runs/:runId/resume` | Resume a failed run from checkpoint |
| `/admin/swarm-reviews/:reviewId/approve` | Approve a pending review |
| `/admin/swarm-reviews/:reviewId/reject` | Reject a pending review |

## Auth Posture

All admin endpoints require the same auth as existing `/admin/*` routes (`ADMIN_API_KEY` / `X-Admin-Key`).

## Write Endpoint Contracts

### Resume

```json
POST /admin/swarm-runs/:runId/resume
{
  "resumed_by": "admin-user-id",
  "resume_reason": "retry after fix"
}
```

### Approve

```json
POST /admin/swarm-reviews/:reviewId/approve
{
  "reviewer_id": "admin-user-id",
  "decision_notes": "Looks good"
}
```

### Reject

```json
POST /admin/swarm-reviews/:reviewId/reject
{
  "reviewer_id": "admin-user-id",
  "decision_notes": "Not safe to continue"
}
```
