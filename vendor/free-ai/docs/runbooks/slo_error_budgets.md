# FREE AI — SLO / SLI and error budgets (operations contract)

**Status:** Human-facing. Not engine-loaded. Defines how to **operate** the engine behind a gateway using metrics the repo already emits.

For Prometheus / log shipper wiring examples, see [../examples/prometheus/README.md](../examples/prometheus/README.md).

## Service level objectives (examples)

Tune numbers to your org; defaults below are a reasonable **single-region pilot**.

| SLO | Target | Measurement window |
|-----|--------|---------------------|
| **Availability** (inferred) | 99.5% successful `request_handled` (HTTP 200 family for `/v1/infer` via proxy) | 30 days rolling |
| **Latency** | p95 end-to-end infer < **8 s** for text (excluding streaming chunk tail) | 30 days rolling |
| **Provider resilience** | Fallback rate from `fallback_used` < **5%** of non-cache traffic | 7 days rolling |

## Service level indicators (SLIs)

Map to structured logs and `/admin/metrics-summary` (or Prometheus scrape of the same counters if you export them).

| SLI | Source | Notes |
|-----|--------|--------|
| Request success | `event: request_handled` with `status` 200 | Count failures separately (5xx, 429). |
| Cache hit rate | `cache_hit: true` on receipt / metric | High cache hit can mask provider outages — segment SLI. |
| L2 semantic hit | `l2_hit` | Distinct from L1 exact cache. |
| Fallback used | `fallback_used` on receipt | Correlate with provider health runbook. |
| Latency | `latency_ms` on receipt or span `gen_ai.request.duration` | Prefer gateway-side timing for user-observed SLO. |
| Swarm fan-in correlation | `gen_ai_infer` / `gen_ai_stream` with `swarm_task_id`, optional `child_trace_ids[]`; plus `event: freeai_swarm_assignment` on preview/L1/L2 paths when `swarm.task_id` is set | Host passes prior worker traces in `swarm.child_trace_ids`. `freeai_swarm_assignment` gives correlatable rows **without** calling a provider (e.g. `preview_only`). |

### Example queries (after JSONL → your warehouse)

- **Workers per logical task (assignment rows):** filter `event == "freeai_swarm_assignment"` and `group by swarm_task_id` counting distinct `trace_id`.
- **Fan-in payload present:** filter `event == "gen_ai_infer"` and `length(child_trace_ids) > 0` (syntax depends on warehouse).
- **Dashboard idea:** one tile = rate of `freeai_swarm_assignment` with `preview_only: true` and same `swarm_task_id` as recent `gen_ai_infer` rows (merge step in flight).

Metrics path defaults to `data/metrics.jsonl` under **current `process.cwd()` per append**, or **`FREEAI_METRICS_JSONL`** when set; see [../examples/prometheus/README.md](../examples/prometheus/README.md).

## Error budgets

For each SLO, define a **budget** = allowed bad events in the window (e.g. 0.5% unavailability ≈ 3.6 h / month for 99.5%).

| Policy | Action when budget burns |
|--------|---------------------------|
| **Budget > 50% consumed in first half of window** | Page on-call; run [provider_outage.md](provider_outage.md) checklist. |
| **Budget exhausted** | Freeze non-critical releases; enable stricter pins (`PINNED_ONLY`); consider temporary traffic cap at gateway. |

## FinOps linkage

Request receipts include **canonical** token fields (`usage.prompt_tokens`, `usage.completion_tokens`, `usage.total_tokens`, `usage.provider_reported`) for chargeback-style exports. Join `trace_id` / `X-Tenant-Id` (if set at the gateway) in your warehouse — see [alerting_examples.md](alerting_examples.md) for metric naming consistency.
