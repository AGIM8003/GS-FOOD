# FREE AI — source-of-truth completion record

**Version:** 2.0  
**Status:** COMPLETE for the implemented repository state described below.

**Document status**

- This record is human-facing repository truth.
- It is **not** loaded by the engine at runtime unless explicitly wired later.
- It supersedes earlier completion summaries where this version contains newer factual implementation details.

---

## 1. Project identity snapshot (fail-closed)

| Field | Value |
|--------|--------|
| Project name | FREE AI |
| Project version | UNKNOWN |
| Project code / ID | UNKNOWN |
| Project author / owner | UNKNOWN |
| Company | UNKNOWN |
| Company address | UNKNOWN |

**Identity seal status:** SEALED / LOCKED (target spec).

---

## 2. Authoritative implementation state

### A. SSOT hardening — COMPLETE

**Implemented state**

- Canonical forbidden tokens are defined in `tests/ssot_forbidden_tokens.js`.
- `tests/ssot_boundary.test.js` reports: rule, file, line, snippet.
- Boundary scan scope is explicitly: `src/`, `scripts/` only.
- The SSOT boundary is aligned across: `tests/ssot_forbidden_tokens.js`, `tests/ssot_boundary.test.js`, quality gate, `AGENTS.md`, manifest checklist.

**Accepted outcome**

- Forbidden-token governance is centralized and traceable.
- Boundary failures are actionable.
- Scope is explicit and constrained to intended directories only.

### B. Backoff / jitter / hedging hardening — COMPLETE

**Implemented state**

- Contract comments exist on: `backoffWithJitter`, `suggestedHedgeSpacingMs`.
- Safer handling of bad inputs exists where implemented.
- `tests/backoff_jitter.test.js` is expanded.

**Accepted outcome**

- Reliability helper behavior is documented more clearly.
- Edge cases are covered more thoroughly.
- Contract expectations are easier to read directly from source.

### C. Metrics summary contract hardening — COMPLETE

**Implemented state**

- Metrics summary shape is documented in: `metrics.js`, `admin.js`.
- `tests/metrics_summary_contract.test.js` covers: `/admin/metrics-summary` response shape; admin auth parity with other admin routes; stricter required top-level and nested key checks.

**Accepted outcome**

- `/admin/metrics-summary` has a clearer implementation contract.
- Auth behavior is explicitly verified.
- Nested summary drift is more likely to fail early.

### D. Integration kit propagation hardening — COMPLETE

**Implemented state**

- Topology IDs are asserted across: merge guide, playbook, transfer prompt, `integration-manifest.json`.
- `/admin/metrics-summary` is asserted across generated artifacts from manifest truth.
- `build_integration_kit.js` points hosts to `docs/HOST_HORIZONTAL_GTM_OUTLINE.md`.
- Root manifest assertions were extended in integration-kit coverage.

**Accepted outcome**

- Manifest-driven propagation is tighter.
- Generated artifacts align with declared topology and admin-surface truth.
- Host-facing guidance remains explicit in generated outputs.

### E. Packs consistency hardening — COMPLETE

**Implemented state**

- Template vs example consistency was tightened.
- README files were tightened.
- `tests/pack_template_consistency.test.js` exists.

**Accepted outcome**

- Pack scaffolding is internally more consistent.
- Template / example / documentation drift is checked.

### F. GTM separation hardening — COMPLETE

**Implemented state**

- `docs/HOST_HORIZONTAL_GTM_OUTLINE.md` explicitly stresses host-only / non-engine status.
- Merge guidance also stresses host-only / non-engine status.
- `tests/gtm_separation.test.js` now scans: `src/`, `scripts/`.
- The test enforces contiguous-token separation semantics for the host GTM filename.
- `scripts/build_integration_kit.js` avoids embedding the contiguous host GTM filename token in protected script source while still generating the full human-facing path in built artifacts.

**Accepted outcome**

- GTM separation is documented and regression-protected across both protected trees.
- Generated integration artifacts may still contain the full human path as intended output.
- Protected engine/script source does not carry the forbidden contiguous token.

### G. Documentation / traceability hardening — COMPLETE

**Implemented state**

- `README.md` updated.
- `FREEAI.md` traceability for relevant sections updated.
- Manifest checklist lines updated for SSOT and related policy files.
- `docs/SOURCE_OF_TRUTH_COMPLETION_RECORD.md` updated to reflect repository truth.

**Accepted outcome**

- Documentation is aligned with implemented hardening work.
- Traceability between files, tests, manifest surfaces, and completion records is improved.

### H. Copy-only embed policy — COMPLETE

**Authoritative document**

- `docs/COPY_ONLY_EMBED_POLICY.md` exists.
- It is authoritative human / merge-contract documentation.
- It explicitly states it is not loaded by the engine.

**Policy it defines**

- FREE AI must be embedded as a full copied tree under a host path such as `vendor/free-ai/`.
- FREE AI is not to be consumed as a live dependency.
- Forbidden integration patterns include: npm-style dependency on upstream; git submodule; git subtree; symlinks; shared wrapper service; `file:` paths back to a golden checkout.
- Bidirectional independence is explicit: host SSOT is the local vendored copy; the engine does not require sibling repos at runtime; other projects must not depend on the FREE AI source repo as a live package; other projects vendor a snapshot instead.

**Propagation wiring**

- `freeai.engine.manifest.json`
- `scripts/build_integration_kit.js`
- `README.md`
- `AGENTS.md`
- `FREEAI.md`
- `tests/integration_kit.test.js`

**Accepted outcome**

- FREE AI is clearly documented as a copy-in / vendor module.
- The rule is propagated across manifest, docs, and generated handoff artifacts.
- This changes integration guidance, not runtime behavior.

### I. Copy-only anti-drift regression — COMPLETE

**Implemented state**

- `tests/manifest_copy_only_alignment.test.js` asserts: `docs/COPY_ONLY_EMBED_POLICY.md` remains in `authoritative_files`; merge checklist text still references the copy-only policy; `integration_policy.forbid_live_reference_usage === true`.
- `tests/copy_only_no_live_dependency_regression.test.js` exists.
- Package/dependency regression protection was added so FREE AI is not reclassified into a live upstream dependency pattern.

**Accepted outcome**

- Copy-only vendoring is not merely documented; it is regression-checked.
- Manifest policy drift now fails more explicitly.

### J. Durable completion record — COMPLETE

**Implemented state**

- `docs/SOURCE_OF_TRUTH_COMPLETION_RECORD.md` exists.
- It is human-facing.
- It is not loaded by the engine at runtime.
- Earlier revisions (for example 1.2) are superseded by this **2.0** record where content differs.
- Verification trust wording is included so historical PASS statements are not overstated.

**Accepted outcome**

- The repository has an in-tree human-facing completion record.
- The completion record remains documentation, not engine configuration.

### K. Provider discovery and model control plane — COMPLETE (current implemented scope)

**Implemented state — provider discovery**

- `src/providers/providerCatalogSchema.js`
- `src/providers/providerDiscoveryRegistry.js`
- Registry re-export from `src/providers/registry.js`
- `docs/provider-registry.md`

**Implemented state — model catalog**

- `src/models/modelRecordSchema.js`
- `src/models/catalogStore.js`
- `src/models/catalogDiff.js`

**Implemented state — refresh pipeline**

- `src/models/refresh/runCatalogRefresh.js`
- `src/models/refresh/normalizeProviderCatalog.js`
- `src/models/refresh/providerFetchers/ollamaTags.js`
- `src/models/refresh/providerFetchers/staticKnownModels.js`
- `scripts/refresh_model_catalog.js`

**Implemented state — policy / promotion / rollback**

- `src/routing/modelSelectionPolicy.js`
- `src/routing/resolveTaskLane.js`
- `src/routing/selectModelCandidate.js`
- `src/routing/pinnedModelMap.js`
- `src/routing/promotionStateMachine.js`
- `src/routing/rollbackModelPromotion.js`

**Implemented state — capabilities / evaluation**

- `src/capabilities/capabilityMatrix.js`
- `src/capabilities/taskToCapabilityMap.js`
- `src/eval/modelAcceptanceRunner.js`

**Implemented state — data / evidence / repo hygiene**

- `data/model_control_plane/.gitkeep`
- `.gitignore` updated for `data/model_control_plane/**`
- Refresh artifacts include snapshot / diff / evidence outputs.
- Promotion history uses structured persistence.

**Accepted outcome**

- FREE AI has a normalized provider-and-model control-plane layer.
- FREE AI can create model catalog snapshots, write refresh evidence, produce deterministic diffs, and track promotion state.
- FREE AI contains lane-based selection helpers, promotion state, rollback support, and model-control-plane persistence.
- `ProviderRegistry.callProviders` applies `selectModelCandidate` / `orderModelsForProvider` each request; default `PINNED_ONLY` preserves legacy try-order (`src/providers/registry.js`, `src/config.js`).

### L. Admin / HTTP control-plane surfaces — COMPLETE (current implemented scope)

**Implemented state**

- New admin accessors in `src/server/admin.js`: `getModelCatalogSummary`, `getModelPins`, `getModelRefreshStatus`, `getModelPromotionHistory`.
- New routes in `src/server.js`: `GET /admin/model-catalog-summary`, `GET /admin/model-pins`, `GET /admin/model-refresh-status`, `GET /admin/model-promotion-history`.

**Accepted outcome**

- Admins can inspect model catalog state, pins, refresh status, and promotion history through read-only HTTP surfaces.
- These surfaces extend observability and control-plane visibility without introducing a separate product UI requirement.

### M. Manifest / integration / doc propagation (model control plane) — COMPLETE

**Implemented state**

- `freeai.engine.manifest.json` updated with: new admin paths; authoritative docs; merge checklist additions; verification command references.
- `tests/integration_kit.test.js` asserts new admin routes on the root manifest.
- `README.md`, `AGENTS.md`, `FREEAI.md`, `docs/COPY_ONLY_EMBED_POLICY.md`, and `docs/SOURCE_OF_TRUTH_COMPLETION_RECORD.md` were updated accordingly.
- `package.json` includes `refresh-model-catalog` script support.

**Accepted outcome**

- The new model-control-plane surfaces are documented and propagated.
- Integration artifacts and manifest truth remain aligned.

### N. Test expansion — COMPLETE

**Implemented state**

The following suites were added for the new scope:

- `tests/provider_registry.test.js`
- `tests/model_catalog_store.test.js`
- `tests/model_catalog_diff.test.js`
- `tests/model_catalog_refresh.test.js`
- `tests/model_selection_policy.test.js`
- `tests/model_acceptance_runner.test.js`
- `tests/model_promotion_state_machine.test.js`
- `tests/model_rollback.test.js`
- `tests/capability_matrix.test.js`
- `tests/admin_model_catalog_endpoints.test.js`
- `tests/copy_only_no_live_dependency_regression.test.js`
- `tests/enterprise_security_baseline.test.js`
- `tests/dlp_hook.test.js`

**Accepted outcome**

- The expanded model-control-plane scope has direct regression coverage.
- Existing hardening suites remain part of the protected baseline.

### O. Enterprise readiness (Wave A + B documentation) — COMPLETE

**Implemented state**

- `src/config.js` — `security` block (`production_profile`, `require_admin_key`, `cors_allow_origins`, infer token); `validateEnterpriseSecurityConfig()`.
- `src/server/httpSecurity.js` — CORS helper, constant-time infer token check, secret fingerprint helper for logs.
- `src/server.js` — startup validation, CORS application, optional infer gate on `/v1/infer`, `/v1/stream`, `/v1/render`; `X-Tenant-Id` on metrics for correlation only.
- `docs/ENTERPRISE_DEPLOY.md`, `docs/ENTERPRISE_CONTROL_MATRIX.md`, `docs/runbooks/*`, regulated / assurance docs (`DATA_CLASSIFICATION_AND_RETENTION.md`, `TENANCY_AND_HOST_BOUNDARY.md`, `THREAT_MODEL_STRIDE_LITE.md`, `PEN_TEST_SCOPE_TEMPLATE.md`, `SOC2_EVIDENCE_PLAYBOOK.md`).
- `src/security/dlpHook.js` — pluggable DLP default no-op; `tests/dlp_hook.test.js`, `tests/enterprise_security_baseline.test.js`.
- `.github/workflows/ci.yml` — `npm ci`, quality gate, tests, refresh smoke, optional SBOM + audit.
- `scripts/generate_sbom.js`, `npm run sbom`, `dist/` gitignored.

**Accepted outcome**

- Large-enterprise-style baselines are documented and partially enforced in code without claiming SOC2/ISO certification.
- Regulated templates exist for classification, tenancy boundary, threat model, pen scope, and evidence playbook.

---

## 3. Honest limits / current non-claims

The following are explicitly true and must not be overstated:

1. **Live provider catalog coverage is partial** — Live vendor catalog API implementation currently exists only for Ollama via `/api/tags`. Other providers still rely on static rows from `providers.json` pins/candidates. There is not yet full live online listing coverage for vendors such as OpenRouter, Gemini, or others.

2. **Selection helper fusion (policy-gated)** — `ProviderRegistry.callProviders` calls `selectModelCandidate` + `orderModelsForProvider` on each request. With default **`PINNED_ONLY`** (including when `FREEAI_MODEL_SELECTION_MODE` is unset or invalid), try-order stays **identical** to `pinnedModel` then `candidates`. With **`AUTO_PROMOTE_GOVERNED`** or **`LATEST_ALIAS_ALLOWED`**, the chosen model id is tried **first** for the matching provider only when a catalog snapshot and policy produce a non–pin-only choice; other providers keep pin order.

3. **Promotion logic is governed but not silently runtime-authoritative** — Promotion state machine and rollback logging are implemented. Promotion does not automatically rewrite `providers.json` or blindly replace live inference defaults. Pins remain authoritative for inference unless explicitly integrated later.

4. **“Always latest” is governed latest-awareness, not blind replacement** — Lane-limited latest behavior exists. Auto-promotion is controlled and evidence-gated. No silent jump to production default occurs merely because a newer model appears.

---

## 4. Verification state

The following verification results are accepted as current fact for the implementation state described above:

- `node scripts/build_integration_kit.js` — OK  
- `node scripts/quality_gate.js --fast` — PASS  
- `node scripts/run_all_tests.js` — PASS  

**Verification trust note:** These results are trustworthy only if they were run after the relevant changes described here and no later edits invalidated them without re-running checks.

---

## 5. Current closed scope

The repository now has completed, implemented coverage for:

- SSOT hardening  
- Reliability helper hardening  
- Metrics summary contract hardening  
- Integration-kit propagation hardening  
- Packs consistency hardening  
- GTM separation hardening across `src/` and `scripts/`  
- Documentation / traceability hardening  
- Copy-only embed policy documentation and propagation  
- Copy-only anti-drift regression  
- Durable completion record documentation  
- Provider discovery registry  
- Normalized model catalog store  
- Model catalog diff / refresh evidence pipeline  
- Lane-based selection helpers  
- Capability matrix support  
- Model acceptance runner  
- Promotion state machine  
- Rollback event support  
- Read-only admin catalog / pins / refresh / promotion endpoints  
- Manifest / docs / integration propagation for the control plane  
- Enterprise deploy / control matrix / runbooks / assurance templates, CI workflow, and enterprise security baseline tests  

---

## 6. What is now true

- **FREE AI** remains the only project identity in scope.
- FREE AI remains copy-only / vendored and is not converted into a live dependency.
- FREE AI now includes a model control plane for discovery, cataloging, diffing, evaluation, promotion state, rollback support, and admin inspection.
- Refresh runs and related automation are documented to run inside the embedded local vendored copy.
- Live vendor catalog refresh is partial, not universal.
- Live inference routing remains **pin-led by default**; governed reordering applies only when an operator sets a non-`PINNED_ONLY` policy and the catalog supports the choice (no silent default swap).
- “Latest AI” behavior is governed, staged, and reversible rather than blind.

---

## 7. Optional follow-ups (outside the current completed claims)

These remain outside the claims above unless later implemented:

- Add live online catalog fetchers for more providers beyond Ollama.
- ~~Fuse `selectModelCandidate` into live inference routing~~ — done in a **policy-gated** form (`PINNED_ONLY` default); further work could deepen lane-specific behavior or metrics on reorder decisions.
- Add controlled runtime adoption flow from promotion state into live pin updates.
- Deepen benchmark packs and acceptance gates for more modalities and providers.

---

## 8. Final status

The repository now exceeds the earlier hardening-only state. FREE AI includes an implemented provider-and-model control-plane layer with governed refresh, evidence, staged promotion logic, rollback support, and admin visibility, while preserving copy-only vendoring and avoiding blind “always latest” replacement behavior.

**This status is valid only to the extent described in the honest-limits section (Section 3) above.**
