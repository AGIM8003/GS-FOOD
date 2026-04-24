# Quality gate and smoke tests (CI expectations)

## Commands

- **Fast loop (default in many dev flows):** `node scripts/quality_gate.js --fast`  
  Skips [`tests/smoke.test.js`](../tests/smoke.test.js), which starts a real server on port **3311** and calls `/health` and `/v1/infer`.

- **Full gate (release / CI):** `node scripts/quality_gate.js`  
  Runs the same stages as `--fast`, then **smoke**. Ensure port **3311** is free and no other process binds it on the runner.

- **Swarm demo in gate (optional):** `FREEAI_SWARM_DEMO_IN_GATE=1 node scripts/quality_gate.js`  
  After smoke, runs `npm run swarm-demo` (random **3400–3799** port). Use on release runners when you want an extra end-to-end check; omit on developer machines to save time.

- **All unit tests only:** `node scripts/run_all_tests.js` (used by the gate’s `tests` stage).

## Stages (see [`scripts/quality_gate.js`](../scripts/quality_gate.js))

1. Required files and manifest consistency  
2. SSOT boundary  
3. Receipt ledger verification  
4. Integration kit test  
5. Full `tests/*.js` suite (including swarm correlation and payload validation)  
6. Smoke (non-fast only): live `node src/server.js` with `PORT=3311`

## Artifacts

Each full run writes JSON under `evidence/reports/local-quality-gate-<timestamp>.json`. Attach that file to release evidence per [ENTERPRISE_DEPLOY.md](ENTERPRISE_DEPLOY.md) when your org requires it.

## Swarm-related tests

- [`tests/swarm_skill_selection.test.js`](../tests/swarm_skill_selection.test.js) — orchestrator + rollup + schema.  
- [`tests/swarm_router_correlation.test.js`](../tests/swarm_router_correlation.test.js) — two `Router.handleRequest` preview calls, shared `swarm.task_id`, `receipt.swarm`, and `freeai_swarm_assignment` metrics.  
- [`tests/swarm_payload_validation.test.js`](../tests/swarm_payload_validation.test.js) — `FREEAI_VALIDATE_SWARM_PAYLOAD=1` rejects oversized `child_trace_ids`.
