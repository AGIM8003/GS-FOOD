# Swarm State Model V3

## Run States

| State | Description | Valid Transitions To |
|-------|-------------|---------------------|
| `created` | Run record created | `validating`, `failed` |
| `validating` | Graph being validated | `admitted`, `failed` |
| `admitted` | Validation passed | `running`, `failed` |
| `running` | Nodes being executed | `completed`, `failed`, `paused_for_review` |
| `completed` | All nodes done | *(terminal)* |
| `failed` | Execution failed | `resumable` |
| `paused_for_review` | Waiting for human review | `running`, `rejected`, `failed` |
| `resumable` | Eligible for resume | `resumed`, `failed` |
| `resumed` | Resume initiated | `running`, `failed` |
| `rejected` | Review rejected the run | *(terminal)* |
| `quarantined` | Isolated for investigation | *(terminal)* |

## Node States

| State | Description | Valid Transitions To |
|-------|-------------|---------------------|
| `pending` | Not yet started | `admitted`, `skipped` |
| `admitted` | Ready to execute | `running` |
| `running` | Currently executing | `completed`, `failed`, `waiting_human_review` |
| `completed` | Done successfully | *(terminal)* |
| `failed` | Execution failed | `resumed` |
| `skipped` | Skipped by policy or branch | *(terminal)* |
| `waiting_human_review` | Paused for review | `completed`, `failed`, `quarantined` |
| `resumed` | Resumed after failure | `running` |
| `quarantined` | Isolated | *(terminal)* |

## Fail-Closed Rule

Any transition not listed above throws `invalid_run_transition` or `invalid_node_transition`. There are no silent fallbacks.
