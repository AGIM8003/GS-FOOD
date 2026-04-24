# Swarm demo (one command)

From the **FREE AI** engine root (this folder):

```bash
npm run swarm-demo
```

## What it does

1. Starts `src/server.js` on a random port in the **3400–3799** range.
2. Waits for `/health/ready`.
3. Calls `POST /v1/infer` three times (researcher worker, coder worker, reviewer preview merge with `fan_in` + `child_trace_ids`) using [`examples/swarm_host_orchestrator/lib.mjs`](examples/swarm_host_orchestrator/lib.mjs) (timeouts, retries, `traceparent`).
4. Prints `task_id`, `trace_id`s, `receipt.swarm` on the merge step, and a short **metrics tail** count for this `swarm_task_id`.

Exit **0** only if all HTTP steps succeed and worker traces exist.

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Port bind errors | Close other processes; rerun (port is random). |
| `ECONNREFUSED` / timeout | Check firewall; ensure Node 18+. |
| Infer **401** / **403** | Your tree may require infer auth (`FREEAI_REQUIRE_INFER_TOKEN`). Unset for local demo or set `Authorization` / `X-Infer-Key` in `lib.mjs` (extend `inferWithRetry` headers). |
| Metrics counts zero | Normal if `FREEAI_METRICS_JSONL` points elsewhere; merge still shows `receipt.swarm`. |

## HTTP contract

See [docs/openapi/infer_swarm_fragment.yaml](docs/openapi/infer_swarm_fragment.yaml) and [docs/POST_ENTERPRISE_EXTENSIONS.md](docs/POST_ENTERPRISE_EXTENSIONS.md).

## CI

Optional: `FREEAI_SWARM_DEMO_IN_GATE=1 node scripts/quality_gate.js` — see [docs/QUALITY_GATE_CI.md](docs/QUALITY_GATE_CI.md).
