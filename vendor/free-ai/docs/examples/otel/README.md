# OpenTelemetry bridge (host or sidecar)

FREE AI can emit **JSONL traces** to `data/traces.jsonl` and structured logs; full OTLP export is optional via environment ([AGENTS.md](../../AGENTS.md) mentions `OTEL_*` placeholders).

## Pattern: OpenTelemetry Collector sidecar

Run the [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) next to the engine process or in the same pod. The collector:

1. Receives OTLP from your app **or** tails JSON files with a filelog receiver.
2. Exports to your vendor (Datadog, Honeycomb, Grafana Cloud, etc.).

## Minimal collector fragment

See [collector-snippet.yaml](collector-snippet.yaml) for a starting `receivers` / `exporters` skeleton. Replace exporter endpoints with your backend DSNs.

## Correlation

Prefer propagating **`trace_id`** from engine receipts and metrics into your trace backend. `X-Tenant-Id` is a **correlation** header only — not authentication ([AGENTS.md](../../AGENTS.md)).
