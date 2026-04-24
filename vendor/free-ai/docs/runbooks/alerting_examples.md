# Runbook — alerting examples (metrics / admin)

For SLO targets and error-budget policy language, see [slo_error_budgets.md](slo_error_budgets.md).

## Metrics JSONL

`data/metrics.jsonl` receives rows from `emitMetric` (e.g. `request_handled`, `gen_ai_infer`). Ship to your log stack or use `GET /admin/metrics-summary` on a schedule.

### Example checks

- **Error rate:** count `request_handled` with `status >= 400` vs total over 5m.
- **Fallback rate:** fraction of `request_handled` with `fallback_used: true` above baseline (see `FREEAI.md` §33.5 / online rollback themes).

## Composite health

`GET /admin/health-composite` — blend score 0–100; alert when below threshold for two consecutive scrapes.

## Auth failures

If `FREEAI_REQUIRE_INFER_TOKEN` is enabled, monitor 401 rates on `/v1/infer` at the proxy (engine returns JSON `{ error: infer_unauthorized }`).
