# Prometheus / SIEM integration examples

FREE AI emits **JSON lines** to `data/metrics.jsonl` by default (override with **`FREEAI_METRICS_JSONL`** = absolute path to a `.jsonl` file). Exposes **`GET /admin/metrics-summary`** (requires admin auth when `FREEAI_REQUIRE_ADMIN_KEY` / production profile).

## Option A — Scrape admin summary (JSON)

Use a **blackbox** or **script exporter** that calls the admin endpoint with `X-Admin-Key` stored in a secret, or scrape from a sidecar that reads the same file system.

Example `prometheus.yml` fragment (adjust targets and credentials):

```yaml
scrape_configs:
  - job_name: freeai_metrics_summary
    scrape_interval: 30s
    metrics_path: /admin/metrics-summary
    scheme: https
    static_configs:
      - targets: ['proxy-internal.example.com:443']
    authorization:
      credentials_file: /etc/prometheus/secrets/freeai_admin_bearer.txt
```

Store a single line `Bearer <ADMIN_API_KEY>` or use basic auth if your proxy terminates it differently.

## Option B — Ship JSONL to your log stack

Tail `data/metrics.jsonl` with **Vector**, **Fluent Bit**, or **Filebeat** and parse JSON. Map fields used in SLOs:

- `event` (e.g. `request_handled`, `gen_ai_infer`, `gen_ai_stream`, `freeai_swarm_assignment`)
- `status`, `fallback_used`, `cache_hit`, `trace_id`, `tenant_id`
- **Swarm correlation:** `swarm_task_id`, `child_trace_ids` (array, when host passes prior worker traces), `preview_only`, `cache_hit_l1`, `cache_hit_l2` on `freeai_swarm_assignment`

**Path resolution:** each append uses `FREEAI_METRICS_JSONL` if set, else `join(process.cwd(), 'data', 'metrics.jsonl')` at **write time** (see `getMetricsJsonlPath()` in [`src/observability/metrics.js`](../../src/observability/metrics.js)). Run the engine with cwd set to the engine root (typical).

See [runbooks/slo_error_budgets.md](../runbooks/slo_error_budgets.md) and [runbooks/alerting_examples.md](../runbooks/alerting_examples.md).

## Example queries (LogQL / vendor-neutral)

Conceptually mirror the SLO doc:

- **Availability:** ratio of `request_handled` with `status` in 200 range vs all `request_handled` over 30d.
- **Fallback rate:** count `fallback_used == true` / count all non-cache `request_handled`.
- **Latency:** p95 of `gen_ai_latency_ms` or gateway upstream timing if measured at the proxy.

Exact syntax depends on your backend (Loki, Datadog, Splunk, etc.).

## Example PromQL-style patterns (if you convert JSONL → metrics)

After an ETL step labels `event`, `swarm_task_id`, `trace_id`:

- **Infer volume by swarm task:** `sum by (swarm_task_id) (rate(freeai_jsonl_events{event="gen_ai_infer",swarm_task_id!=""}[5m]))`
- **Assignment rows (includes preview/cache):** `rate(freeai_jsonl_events{event="freeai_swarm_assignment"}[5m])`

Adapt metric names and labels to your exporter; the JSONL field names above are the stable contract from the engine.
