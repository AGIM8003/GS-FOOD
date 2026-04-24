# FREE AI — beyond baseline enterprise rollout

**Status:** Human-facing roadmap pointer. Not engine-loaded.

After [ENTERPRISE_DEPLOY.md](ENTERPRISE_DEPLOY.md) steps (trust boundary, observability, data governance, model governance, evidence pack, optional Kubernetes), these **platform extensions** deepen capability without replacing the host reverse proxy or claiming certification from code alone.

## Shipped in-repo starting points

| Track | What exists | Next steps (your org) |
|-------|-------------|------------------------|
| **FinOps** | Normalized `usage` on receipts ([src/observability/usageAccounting.js](../src/observability/usageAccounting.js)) | Join `trace_id` / `X-Tenant-Id` in warehouse; gateway metering |
| **Catalog + modalities** | Live list + `modality_flags` heuristics for OpenAI ([src/models/refresh/providerFetchers/openaiModels.js](../src/models/refresh/providerFetchers/openaiModels.js)); Ollama / OpenRouter / Groq fetchers | Extend heuristics per provider; add acceptance tests per modality |
| **DLP** | Regex PII + optional **allow-substring bypass** + **JSON top-level field** redaction + **streaming** chunk redaction ([src/security/dlpHook.js](../src/security/dlpHook.js)) | Gateway DLP for production; field-level policies; structured allowlists |
| **Observability bridge** | [examples/otel/README.md](examples/otel/README.md) | Deploy collector sidecar; wire OTLP from [tracing](../src/tracing/) if enabled |

## Larger program items (not small patches)

- Virtual-key multi-tenant gateway parity (host edge).
- HITL review queues for high-risk personas.
- Multi-region active/active data plane.
- Thin SDKs (TypeScript/Java) with timeouts and client-side redaction.

See [ENTERPRISE_CONTROL_MATRIX.md](ENTERPRISE_CONTROL_MATRIX.md) for control language; do not claim SOC 2 / ISO 42001 / HIPAA from repository artifacts alone.

## Swarm integration (host orchestrator + engine)

**Contract (schemas):** Per-worker `AssignmentContext` and host-owned fan-in rollup shapes live in:

- [`../src/schemas/assignmentContext.v1.json`](../src/schemas/assignmentContext.v1.json)
- [`../src/schemas/swarmFanInRollup.v1.json`](../src/schemas/swarmFanInRollup.v1.json)

Normative behavior and merge strategies remain in **FREEAI.md §19–§22** (trace correlation, swarm receipt aggregate).

### Headers

- **`traceparent` / `tracestate`:** Forward W3C trace context from the host on every worker call so `trace_id` and downstream spans align (FREEAI §22).
- **`X-Tenant-Id`:** Optional; continues to mean correlation-only tenant label when enabled (see enterprise deploy notes).

### Request payload (JSON body hints)

| Field | Role |
|-------|------|
| `intent_family: "swarm_task"` | Marks the turn as swarm-scoped for skill scoring (may combine with `swarm` object). |
| `swarm.task_id` | Logical swarm task id for metrics/receipt correlation. |
| `swarm.agent_id` | Worker id within the task graph. |
| `swarm.role` | One of `researcher`, `coder`, `reviewer` — selects default persona `swarm_role_<role>` when `persona` is not overridden. |
| `swarm.subtask_goal` | Optional string copied into intent for orchestrator hints. |
| `swarm.child_trace_ids` | Prior worker `trace_id` values; included on **metrics** rows for fan-in observability. |
| `swarm.fan_in` / `swarm.rollup` | When true, engine writes an optional **swarm rollup** JSON file under `evidence/receipts/` via [`../src/swarm/receiptAggregate.js`](../src/swarm/receiptAggregate.js). |
| `swarm.merge_strategy` | Passed through to rollup receipt when `fan_in` / `rollup` is set. |
| `swarm.parent_trace_id` | Optional parent span correlation for the rollup artifact. |

### Personas and skills (in-repo)

Default swarm role personas: `swarm_role_researcher`, `swarm_role_coder`, `swarm_role_reviewer` under `personas/`. Swarm-oriented skills are tagged in `skills/active_catalog.json` (e.g. `swarm_*` ids) for orchestrator boosts when `intent_family` is `swarm_task`.

### Host example (reference client)

Runnable sketch under [`../examples/swarm_host_orchestrator/`](../examples/swarm_host_orchestrator/) (`README.md`, `lib.mjs`, `example_fanout.mjs`). Merge behavior remains **host-owned**; the script only shows JSON shapes and optional `fan_in` rollup emission.

**One-command demo:** from engine root, `npm run swarm-demo` — see [`../SWARM_DEMO.md`](../SWARM_DEMO.md).

**OpenAPI fragment (swarm fields):** [`openapi/infer_swarm_fragment.yaml`](openapi/infer_swarm_fragment.yaml).

### Non-goals

- The engine **does not** schedule DAGs, run a global task queue, or implement LangGraph/OpenAI Swarm–style multi-step coordination. **Fan-out, deadlines, merge policy, and aggregate SLOs are host-owned.**
- Swarm flags alone do **not** imply multi-tenant isolation or compliance certification.
