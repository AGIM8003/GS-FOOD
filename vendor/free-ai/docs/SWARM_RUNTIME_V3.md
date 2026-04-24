# Swarm Runtime V3 — Operational Control Package

## Overview

V3 upgrades FREE AI from a **durable swarm runtime** (V2) to an **operational swarm runtime** with:

- **Replay / resume** from checkpoints for failed runs
- **Human review gate** — pause-and-approve behavior via `human_review_node`
- **Unified policy fabric** — graph admission, node execution, merge, resume, tool, and review policies
- **Tool node** — controlled, deterministic tool execution via `tool_node`
- **Expanded state model** — new run and node states for operational control
- **Expanded receipts** — `policy_receipt`, `review_receipt`, `resume_receipt`, `tool_receipt`
- **Admin operational control surfaces** — resume, review, policy, and checkpoint endpoints

## What V3 Includes

| Feature | Status |
|---------|--------|
| Replay/resume from checkpoint | Implemented |
| Human review node | Implemented |
| Policy fabric (7 zones) | Implemented |
| Tool node (4 tool classes) | Implemented |
| Admin resume endpoint | Implemented |
| Admin review endpoints | Implemented |
| Admin policy summary | Implemented |
| Admin checkpoints | Implemented |
| V3 state model | Implemented |
| V3 receipt types | Implemented |

## What V3 Does NOT Include

- SQLite migration
- Distributed workers or queues
- Full SDK
- Unrestricted shell/network/filesystem tools
- Pack admission state machine
- Cloud orchestration

## Backward Compatibility

V3 auto-detects graphs that use V3 node types (`human_review_node`, `tool_node`) and widens validation. V1/V2 graphs continue to work unchanged. An explicit `graph_schema_version: "v3"` field is also supported.

## Environment Variables

No new required environment variables for V3 core. `FREEAI_SWARM_PERSIST` (V2) continues to control persistence.

## New Admin Endpoints

- `POST /admin/swarm-runs/:runId/resume`
- `GET /admin/swarm-reviews`
- `GET /admin/swarm-reviews/:reviewId`
- `POST /admin/swarm-reviews/:reviewId/approve`
- `POST /admin/swarm-reviews/:reviewId/reject`
- `GET /admin/swarm-policy-summary`
- `GET /admin/swarm-checkpoints`
