# Swarm Runtime V5: Production Resilience & Observability Package

Version: 5.0
Status: Active
Schema version string: `v5`

## Overview

V5 builds on top of V4's advanced orchestration with five production-critical capabilities:

1. **Retry/Resilience Module** — circuit breaker, exponential backoff with jitter, error taxonomy, retry budgets
2. **Map-Reduce Dynamic Fan-Out** — runtime task spawning for variable-width parallel work
3. **Node Lifecycle Hooks** — before/after/error callbacks for cross-cutting concerns
4. **Per-Node Observability Metrics** — token usage, cost attribution, latency, waste tracking
5. **JSON Schema Output Validation** — structured output enforcement at the node level

## Version Detection

V5 is auto-detected when any graph uses `map_reduce_node`. Explicit declaration: `graph_schema_version: "v5"`.

V5 is a superset of V4 — all V4 features (conditional edges, cycles, subgraphs, router nodes, time-travel, parallel execution, guardrails, SSE streaming) remain available.

## 1. Retry/Resilience Module

Source: `src/swarm/resilience.js`

### Error Taxonomy

| Class | Retryable | Examples |
|-------|-----------|----------|
| `transient` | Yes | timeout, ECONNREFUSED, 502/503 |
| `rate_limited` | Yes | 429, throttled |
| `permanent` | No | 401, 403, not_found, invalid |
| `budget_exhausted` | No | Retry budget spent |

### Circuit Breaker

Per-service circuit breakers prevent cascading failures:

- **Closed** → normal operation
- **Open** → all calls blocked (trips after 5 consecutive failures)
- **Half-open** → allows 2 probe attempts after 30s cooldown

### Retry Policy

Opt-in per node via `config.retry_config`:

```json
{
  "node_type": "prompt_node",
  "config": {
    "retry_config": {
      "max_retries": 3,
      "base_delay_ms": 200,
      "max_delay_ms": 10000,
      "jitter": true,
      "retry_budget": 10
    }
  }
}
```

Exponential backoff formula: `min(base_delay_ms * 2^attempt, max_delay_ms)` with optional jitter (±50%).

### Retry Budget

Per-run budget caps total retries across all nodes. Default: 10 retries per run.

## 2. Map-Reduce Dynamic Fan-Out

Source: `src/swarm/mapReduce.js`
Node type: `map_reduce_node`

Enables runtime task decomposition:

```json
{
  "node_id": "mr1",
  "node_type": "map_reduce_node",
  "role_id": "worker",
  "task_lane": "processing",
  "config": {
    "mapper_expression": "input.split(',')",
    "reducer_strategy": "json_array",
    "max_workers": 8,
    "worker_node_type": "prompt_node"
  }
}
```

### Mapper

The mapper splits input into work items:
- **`mapper_expression`**: JavaScript expression evaluated with `input` in scope
- **Auto-split**: If no expression, arrays pass through; strings are parsed as JSON; objects become value arrays

### Reducer Strategies

| Strategy | Behavior |
|----------|----------|
| `concatenate` | Join all outputs with newline |
| `json_array` | JSON array of all outputs (default) |
| `first_valid` | Return first successful result |
| `custom` | Evaluate `reducer_expression` with `results` array |

### Worker Cap

`max_workers` (default 16) prevents unbounded fan-out.

## 3. Node Lifecycle Hooks

Source: `src/swarm/lifecycleHooks.js`

Four hook phases available:

| Phase | Timing | Can Modify Execution? |
|-------|--------|----------------------|
| `beforeNodeExecution` | Before node runs | Yes — skip or modify input |
| `afterNodeExecution` | After successful run | Yes — transform output |
| `onNodeError` | On failure | Yes — suppress with fallback |
| `onNodeRetry` | On each retry | No — informational only |

### Registration

```javascript
import { registerHook } from './lifecycleHooks.js';

registerHook('beforeNodeExecution', async (ctx) => {
  if (ctx.node.config.requires_auth && !ctx.input.token) {
    return { skip: true, fallback_output: 'auth_required' };
  }
}, { name: 'auth-gate', priority: 10, node_type: 'prompt_node' });
```

Hooks are sorted by `priority` (lower runs first). Global hooks run before node-type-specific hooks.

## 4. Per-Node Observability Metrics

Source: `src/swarm/nodeMetrics.js`

Tracked per node:
- `latency_ms` — wall-clock time
- `input_tokens`, `output_tokens`, `total_tokens`
- `cost` — monetary cost attribution
- `retries` — number of retry attempts
- `waste_tokens` — tokens consumed by failed attempts

Tracked per run:
- `total_latency_ms`, `total_tokens`, `total_cost`
- `waste_ratio` — waste_tokens / total_tokens (target: < 0.05)
- `node_count` — number of executed nodes

### Admin Endpoints

- `GET /admin/swarm-runs/:runId/metrics` — full run metrics with per-node breakdown
- `GET /admin/swarm-runs/:runId/cost-breakdown` — cost sorted by most expensive node
- `GET /admin/swarm-circuit-breakers` — all circuit breaker states
- `GET /admin/swarm-lifecycle-hooks` — all registered hooks

## 5. JSON Schema Output Validation

Source: `src/swarm/schemaValidator.js`

Enforces structured output contracts via JSON Schema (draft-07 subset):

```json
{
  "node_type": "prompt_node",
  "config": {
    "output_schema": {
      "type": "object",
      "required": ["result", "confidence"],
      "properties": {
        "result": { "type": "string", "minLength": 1 },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
      },
      "additionalProperties": false
    }
  }
}
```

Supported constraints:
- **Type**: string, number, integer, boolean, array, object, null
- **String**: minLength, maxLength, pattern
- **Number**: minimum, maximum, exclusiveMinimum, exclusiveMaximum
- **Array**: minItems, maxItems, items (nested schema)
- **Object**: required, properties (nested schemas), additionalProperties
- **Value**: enum, const

Auto-parses JSON strings when the schema type is non-string.

## Environment Variables

No new environment variables in V5. All configuration is per-node via `config`.

## Node Types (Cumulative)

| Type | Since |
|------|-------|
| `prompt_node` | V1 |
| `merge_node` | V1 |
| `finalization_node` | V1 |
| `human_review_node` | V3 |
| `tool_node` | V3 |
| `subgraph_node` | V4 |
| `router_node` | V4 |
| `map_reduce_node` | V5 |
