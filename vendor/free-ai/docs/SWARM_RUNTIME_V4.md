# Swarm Runtime V4 — Advanced Orchestration

## Overview

V4 extends FREE AI's swarm runtime with capabilities that match or exceed LangGraph-class orchestrators:

- **Conditional edges** — edges with runtime conditions that gate traversal
- **Cycle support** — bounded iteration loops via `allow_cycles` + `max_iterations`
- **Subgraph nodes** — inline nested graph execution (`subgraph_node`)
- **Router nodes** — condition-based route selection (`router_node`)
- **Configurable fan-out** — per-graph or env-level fan-out limits (up to 16)
- **Expanded tool registry** — 37 deterministic built-in tools
- **Time-travel debugging** — state snapshots at every checkpoint with rewind
- **Typed SDK** — TypeScript + JavaScript client with full type coverage

## Version Detection

V4 is activated when any of:
1. `graph_schema_version: "v4"` is set explicitly
2. Any node uses `subgraph_node` or `router_node` type (auto-detect)
3. Any edge has `edge_type: "conditional"` (auto-detect)

Backward compatibility: V1/V3 graphs continue to work unchanged.

## Conditional Edges

```json
{
  "from_node_id": "p1",
  "to_node_id": "p2",
  "edge_type": "conditional",
  "condition": "current.length > 100"
}
```

Conditions are evaluated at runtime against `{ outputs, current }` context:
- `outputs` — all node outputs so far
- `current` — output of the `from` node

Non-conditional edges always fire. Conditional edges only fire when condition evaluates to truthy.

## Cycle Support

V4 graphs can declare `allow_cycles: true` with a bounded `max_iterations` (default 50, max 200):

```json
{
  "graph_schema_version": "v4",
  "allow_cycles": true,
  "max_iterations": 10,
  ...
}
```

This enables iterative refinement patterns (e.g., generate → evaluate → regenerate loops).

## Subgraph Nodes

Nest a complete graph inside a single node:

```json
{
  "node_id": "sg1",
  "node_type": "subgraph_node",
  "config": {
    "subgraph": {
      "graph_id": "inner-graph",
      "graph_name": "Summarizer",
      "entry_node_id": "sp1",
      "nodes": [...],
      "edges": [...]
    }
  }
}
```

The subgraph executes as a nested `runSwarmGraph` call. Parent input_payload plus predecessor outputs are passed down.

## Router Nodes

Route execution dynamically based on conditions:

```json
{
  "node_id": "rt1",
  "node_type": "router_node",
  "config": {
    "routes": [
      { "target_node_id": "fast_path", "condition": "current.length < 50", "label": "short" },
      { "target_node_id": "deep_path", "label": "default" }
    ]
  }
}
```

The first matching route wins. Routes without conditions serve as fallback.

## Configurable Fan-Out

Set `max_fan_out` in the graph body or via `FREEAI_MAX_FAN_OUT` env:

```json
{ "max_fan_out": 8, ... }
```

Ceiling: 16. Default: 2 (V1 compatibility).

## Tool Registry (37 Tools)

Categories:
- **String**: uppercase, lowercase, trim, split, join, replace, length, slice
- **Array**: sort, filter_truthy, unique, flatten, length
- **Math**: sum, average, round, min_max, clamp
- **Date**: iso_now, parse
- **Crypto**: hash_sha256
- **Encoding**: base64_encode, base64_decode
- **JSON**: stringify, parse, extract_field
- **Regex**: match, replace
- **Object**: keys, values, merge, pick
- **Control**: conditional_select, counter
- **Template**: template_render
- **Lookup**: lookup_registry, identity_transform

Inspect at runtime: `GET /admin/swarm-tool-registry`

## Time-Travel Debugging

Every checkpoint creates a full state snapshot. Admin endpoints:

- `GET /admin/swarm-runs/:runId/snapshots` — list all snapshots
- `POST /admin/swarm-runs/:runId/rewind` — rewind to a snapshot index

Rewind restores node states/outputs and marks run as `resume_eligible`.

## Typed SDK

TypeScript (`sdk/freeai-client.ts`) and JavaScript (`sdk/index.js`) clients:

```typescript
import { FreeAIClient } from './sdk/freeai-client';
const client = new FreeAIClient({ baseUrl: 'http://localhost:3000' });

const result = await client.swarmRun(graph);
const snaps = await client.getSwarmSnapshots(result.run_id);
await client.rewindSwarmRun(result.run_id, 0);
```

## New Admin Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/swarm-runs/:runId/snapshots` | List time-travel snapshots |
| POST | `/admin/swarm-runs/:runId/rewind` | Rewind to snapshot |
| GET | `/admin/swarm-tool-registry` | List all registered tools |

## Environment Variables

| Key | Default | Purpose |
|-----|---------|---------|
| `FREEAI_MAX_FAN_OUT` | 2 | Max outgoing edges per node (ceiling: 16) |
