# FREE AI — copy-only embed policy (host projects)

**Status:** Human-facing contract. This file is **not** loaded by the engine at runtime. It explains **how** FREE AI is allowed to exist inside another repository.

## What you are merging

FREE AI ships as a **self-contained engine folder** (see `freeai.engine.manifest.json` and `AGENTS.md`). It is designed to be **vendored**: copied or merged **in full** into a host application’s tree (for example `vendor/free-ai/`, `engines/free-ai/`, or `src/freeai/`), then run from **that local copy**.

## What is forbidden

Do **not** treat FREE AI as an installable dependency on an upstream or sibling tree.

| Forbidden pattern | Why |
|-------------------|-----|
| `npm` / `pnpm` / `yarn` dependency pointing at this repo or a published “FREE AI” package that pulls live sources | Breaks single-tree SSOT; couples releases to an external registry or repo |
| `git submodule`, `git subtree`, or symlink into another checkout | Live reference; merges and CI become nondeterministic across machines |
| Shared wrapper service that multiple apps call instead of a local copy | This repo must not become a shared runtime for other products |
| Import aliases or `file:` paths that resolve **outside** the copied engine folder back to a “golden” checkout | Same as a live dependency |

**Rule of thumb:** After integration, deleting the original FREE AI source tree (or losing network access to it) must **not** break the host project. The **embedded copy** is the only implementation the host should rely on.

## Bidirectional independence (SSOT + no coupling)

1. **Inside the host:** After a correct merge, **behavioral SSOT** for the engine is the copied tree plus `FREEAI.md` in that copy. The host app wires **to** the copied engine (HTTP to `POST /v1/infer`, or in-process calls into the copied `src/`). The host does not depend on an external FREE AI service for correctness.

2. **Upstream / sibling repos:** The shipped engine does **not** require another product repository to be present at runtime (see SSOT boundary tests under `tests/`). Maintainer notes may mention other codebases **only as documentation**; they are not runtime dependencies.

3. **“Nobody depends on us” in the dependency sense:** Other projects must not declare a **package-level** or **git-level** dependency on the FREE AI source repo. They **vendor** a snapshot. Updates are deliberate: copy a new tree, re-run verification, merge consciously—not `npm update`.

## What “full copy” means

Copy everything the manifest requires: `required_directories`, `authoritative_files`, schemas, personas, skills, tests, scripts, and optional `docs/` when you want host-facing guides (including this file). Partial cherry-picks break pipeline order, receipts, evidence, acquisition, and training assumptions described in `AGENTS.md`.

## Verification

From the **root of the copied engine** (paths relative to that folder):

```powershell
node scripts/quality_gate.js --fast
node scripts/run_all_tests.js
```

Regenerate the host integration bundle when refreshing from upstream:

```powershell
node scripts/build_integration_kit.js
```

Use `out/integration-kit/HOST_MERGE_GUIDE.md` and `AGENT_TRANSFER_PROMPT.md` with another engineer or agent when performing the merge.

## Scheduled jobs still mean “local copy”

Host CI or cron may run `node scripts/refresh_model_catalog.js` **against the embedded engine directory only**. That is not a live dependency on the FREE AI source repository; it is the host operating on its own vendored tree, same as `quality_gate` or `run_all_tests`.
