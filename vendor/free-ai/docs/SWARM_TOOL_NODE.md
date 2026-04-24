# Swarm Tool Node

## Overview

The `tool_node` executes controlled, deterministic tools within a swarm graph. Tool execution is **deny-by-default** — only registered tools in allowed classes can execute.

## Node Type

```json
{
  "node_id": "tool1",
  "node_type": "tool_node",
  "role_id": "tool_runner",
  "task_lane": "transform",
  "config": {
    "tool_id": "identity_transform",
    "tool_input": { "data": "hello" },
    "timeout_ms": 5000,
    "allow_network": false,
    "allow_filesystem": false,
    "expected_output_contract": { "required_fields": ["value"] }
  }
}
```

## Allowed Tool Classes

| Class | Description |
|-------|-------------|
| `local_transform` | Pure data transformation |
| `json_extract` | JSON field extraction |
| `deterministic_template_render` | Template variable substitution |
| `internal_readonly_lookup` | Static map lookup |

## Built-in Tools

| Tool ID | Class | Description |
|---------|-------|-------------|
| `identity_transform` | `local_transform` | Returns input unchanged |
| `json_extract_field` | `json_extract` | Extracts a field from JSON |
| `template_render` | `deterministic_template_render` | Renders `{{var}}` templates |
| `lookup_registry` | `internal_readonly_lookup` | Looks up key in a map |

## Policy Enforcement

Before execution, `tool_execution` policy checks:
1. Tool exists in registry
2. Tool class is in the allowed list
3. `allow_network` is false
4. `allow_filesystem` is false

If any check fails, execution is denied and a `policy_receipt` is written.

## Forbidden in V3

- Arbitrary shell execution
- Unrestricted filesystem mutation
- Unrestricted network access
- Plugin marketplace
