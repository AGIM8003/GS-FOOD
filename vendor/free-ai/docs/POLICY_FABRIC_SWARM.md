# Policy Fabric for Swarm Operations

## Overview

The policy fabric provides unified governance across all swarm execution decisions. Every significant action evaluates a policy before proceeding.

## Policy Zones

| Zone | When Evaluated |
|------|---------------|
| `graph_admission` | Before a graph is admitted for execution |
| `node_execution` | Before each node executes |
| `merge_decision` | Before a merge node combines branch results |
| `resume_execution` | Before a failed run resumes from checkpoint |
| `human_review_decision` | During human review decisions |
| `tool_execution` | Before a tool node runs |
| `provider_model_eligibility` | During provider/model selection |

## Policy Result Contract

Every policy evaluation returns:

```json
{
  "policy_id": "pol-graph_admission-1234",
  "policy_zone": "graph_admission",
  "decision": "allow",
  "blocking": false,
  "reason_code": "graph_valid",
  "summary": "Graph admitted by policy",
  "remediation": null,
  "evaluated_at": "2026-04-13T00:00:00.000Z"
}
```

## Receipt Linkage

Every policy evaluation generates a `policy_receipt` attached to the run record for full auditability.

## Deny-by-Default Zones

- `tool_execution`: Tools are denied unless they belong to an allowed tool class and do not request network or filesystem access.

## Files

- `src/policy/policyFabric.js` — zone router
- `src/policy/evaluateGraphPolicy.js`
- `src/policy/evaluateNodePolicy.js`
- `src/policy/evaluateMergePolicy.js`
- `src/policy/evaluateResumePolicy.js`
- `src/policy/evaluateToolPolicy.js`
