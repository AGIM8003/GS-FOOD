# FREE AI (local reusable engine)

This folder implements the FREE AI runtime engine described in `FREEAI.md`. It is self-contained, runnable locally, and intended to be reused inside other projects only by full local copy into that host project.

Owner rule: this repository must not be used as a shared wrapper, remote dependency, or live reference for other projects. If another project needs FREE AI, copy the full engine into that project and run the copied implementation there.

If another AI or engineer needs to embed this engine into a host application, start with:

- `AGENTS.md`
- `freeai.engine.manifest.json`
- `README.md`

Those files define the reusable boundary, required folders, entrypoints, runtime assumptions, and merge checklist.

For host-project reuse, generate the ready-made integration bundle:

```powershell
node scripts/build_integration_kit.js
```

That produces `out/integration-kit/` with a checksummed file inventory, a host merge guide, a machine-readable merge playbook, an agent transfer prompt, an env template, and a package snippet for reuse in another project.

For the fastest clean transfer into another project, hand the receiving agent these files first:

- `AGENTS.md`
- `freeai.engine.manifest.json`
- `out/integration-kit/integration-manifest.json`
- `out/integration-kit/HOST_MERGE_GUIDE.md`
- `out/integration-kit/AGENT_TRANSFER_PROMPT.md`

Quick start

1. Ensure Node.js >=18 is installed.
2. (Optional) create a `.env` from `.env.example` and fill keys.
3. Run the server:

```powershell
node src/server.js
```

Health probes:

```powershell
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/startup
curl http://localhost:3000/health
```

To sync provider candidates from the existing probe artifact (created by `vendor-probe.ps1`), run:

```powershell
node src/sync/syncFromProbe.js
```

Run smoke test:

```powershell
node tests/smoke.test.js
```

Run the local quality gate:

```powershell
node scripts/quality_gate.js
```

Project layout (important files):

- `src/` - application code (server, providers, cognitive, cache)
- `providers.json` - provider registry and pins
- `skills/`, `personas/` - local skill and persona manifests
- `out/` - probe artifacts (kept by sync scripts)

Training engine

- FREE AI now includes a governed training unit that observes live requests, builds domain academies, and writes overlays under `data/training/` instead of silently rewriting base personas or skills.
- Use `node scripts/run_training_cycle.js` to force a learning pass, `node scripts/training_status_report.js` to inspect status, and `node scripts/set_training_state.js off` to stop the training loop.
- Learned overlays now have retention rules and a review queue for stronger promotions. Inspect the queue with `node scripts/training_review_report.js`.
- Admin inspection and control endpoints are available at `/admin/training`, `/admin/training/insights`, `/admin/training/overlays`, `/admin/training/review-queue`, `/admin/training/run`, `/admin/training/control`, `/admin/training/profile`, and `/admin/training/review`.

Reuse readiness

- FREE AI now includes retrieval evaluation and corrective local fallback gating under `src/retrieval/`.
- Receipt files are mirrored into an append-only chained ledger at `evidence/receipts/ledger.jsonl`.
- Use `/admin/receipt-chain` to verify ledger integrity.
- Use `node scripts/quality_gate.js --fast` before vendoring into another project to confirm the engine boundary, manifest, integration kit, receipt chain, and tests are intact.

Preserves `FREEAI.md` as the authoritative blueprint.
