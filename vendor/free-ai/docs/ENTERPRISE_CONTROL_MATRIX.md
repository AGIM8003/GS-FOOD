# FREE AI — enterprise control matrix (evidence map)

**Status:** Human-facing. Not engine-loaded. Maps common SOC2-style expectations to **implementation or host responsibility** — not a certification.

## Primary matrix (SOC2-style + responsibility)

| Control area | ID | Evidence in repo | Host / org responsibility |
|--------------|-----|-------------------|----------------------------|
| Access — admin | CC6.x | `ADMIN_API_KEY`, `FREEAI_REQUIRE_ADMIN_KEY`, `src/server.js` `adminAuthorized` | Key rotation, vault storage, who may call `/admin/*` |
| Access — infer | CC6.x | Optional `FREEAI_REQUIRE_INFER_TOKEN`, `src/server/httpSecurity.js` | Gateway auth, mTLS, WAF |
| Change management | CC8.x | `scripts/quality_gate.js`, `scripts/run_all_tests.js`, `tests/` | PR review, protected branches |
| Monitoring | CC7.x | `src/observability/metrics.js`, `/admin/metrics-summary`, [runbooks/slo_error_budgets.md](runbooks/slo_error_budgets.md) | SIEM, dashboards, paging, SLO burn reviews |
| Vendor / dependency | CC9.x | `package-lock.json`, `scripts/generate_sbom.js`, `npm audit` in CI | Allowlist registries, license review |
| Data — classification | C1 | [DATA_CLASSIFICATION_AND_RETENTION.md](DATA_CLASSIFICATION_AND_RETENTION.md) | Legal, DPA, residency decisions |
| Incident | A1 | [runbooks/incident_response.md](runbooks/incident_response.md) | On-call roster, comms templates |

## OWASP Top 10 for LLM Applications — control mapping

Use [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) as the risk taxonomy. Map product/runtime behavior and **host** controls; this table is **evidence readiness**, not a claim that every risk class is fully mitigated in-tree.

| OWASP LLM | Risk (short) | In-repo / engine evidence | Host / org evidence (typical) |
|-----------|--------------|---------------------------|--------------------------------|
| LLM01 | Prompt injection | Prompt/output contracts (`src/prompt/contracts.js`), validation path on infer; skills orchestration limits | WAF, input sanitization at gateway, allowlisted clients, abuse monitoring |
| LLM02 | Insecure output handling | Output validation + JSON repair path; optional reference PII redactor (`FREEAI_DLP_REDACT_PII`, `src/security/dlpHook.js`) | Downstream sink reviews, egress DLP, human review for high-risk flows |
| LLM03 | Training data poisoning | Copy-only policy, SSOT boundary tests, no silent promotion of model pins | Supply chain review of upstream weights/datasets (if you fine-tune) |
| LLM04 | Model denial of service | Provider ladder, cooldowns, `budgetGuardian.js`, metrics | Rate limits at edge, quota per tenant, circuit breakers |
| LLM05 | Supply chain vulnerabilities | Lockfile, SBOM script, CI audit step | Dependency allowlists, signed artifacts (see [HELM_GITOPS.md](HELM_GITOPS.md)) |
| LLM06 | Sensitive information disclosure | Admin/infer auth flags, CORS defaults in production profile; DLP hook | Secrets in vault, log redaction, SIEM rules, field-level encryption |
| LLM07 | Insecure plugin / tool design | Skill allowlists, orchestrator caps (`FREEAI.md` alignment) | Tool egress policies, second-person approval for privileged tools |
| LLM08 | Excessive agency | Ladder + bounded tool steps in spec; operational caps in config | Human-in-the-loop for irreversible actions |
| LLM09 | Overreliance | Model pins, governed promotion state machine, eval hooks | Operational acceptance criteria, disclaimers in product UX |
| LLM10 | Model theft / unbounded consumption | Optional infer token, usage fields on receipts (`usageAccounting` normalization), metrics | API key rotation, per-tenant billing gateway, egress controls |

## NIST AI RMF — function mapping (organizational program)

[NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) functions (**Govern**, **Map**, **Measure**, **Manage**) describe how an **organization** runs AI risk management. FREE AI supports them with **artifacts and runtime hooks**; full RMF lifecycle is host-owned.

| NIST AI RMF function | How FREE AI supports it (examples) | Host / org owns |
|---------------------|-------------------------------------|-----------------|
| **Govern** | Documented trust boundary, control matrix, threat model, pen-test scope templates | Policies, roles, vendor risk, board-level AI governance |
| **Map** | Provider registry, model catalog snapshots + diff, DATA_CLASSIFICATION doc | System context, business use-case mapping, DPIA/ROPA |
| **Measure** | Metrics + admin summaries, catalog refresh status, optional eval runners | Continuous monitoring program, internal audit sampling |
| **Manage** | Incident/key-rotation runbooks, promotion gates, outage runbook | Response playbooks, residual risk acceptance, insurance |

## Evidence pointers (release hygiene)

- **Gate JSON:** `node scripts/quality_gate.js --fast` (CI-aligned).
- **SBOM:** `node scripts/generate_sbom.js` → `dist/sbom.json` (CycloneDX).
- **Tests:** `node scripts/run_all_tests.js`.
- **Catalog integrity:** `FREEAI_REFRESH_SKIP_NETWORK=1 node scripts/refresh_model_catalog.js` in CI; live refresh optional in controlled environments.

Re-run this matrix when FREE AI or host controls change; attach gate JSON and SBOM to each release record.

## Appendix — LLM07 / LLM08 and swarm handoffs (host vs engine)

| Concern | OWASP ref | Engine (this repo) | Host swarm orchestrator |
|---------|-----------|---------------------|-------------------------|
| Tool / skill exposure | LLM07 | Skill catalog + `orchestrateSkills` caps (`maxSkills`, token budget), persona exclusions, `risk_class` deprioritization; per-assignment `intent_family: swarm_task` scoring path | Pin `persona_id` / allowed skill sets per worker; enforce tool egress and allowlists at the gateway; deny-by-default for privileged tools |
| Agentic depth / handoff loops | LLM08 | Single-turn infer per HTTP call; provider ladder and timeouts; no built-in multi-hop agent scheduler | Own max handoffs, deadlines, fan-out/fan-in, merge policy (FREEAI §19.4), and human gates for irreversible actions |
| Traceability | §22 / metrics | `trace_id` per request; optional `child_trace_ids` and `swarm_task_id` on metrics when the host sends `swarm.child_trace_ids` / `swarm.task_id` | Propagate W3C `traceparent`; aggregate `child_trace_ids` in the swarm rollup receipt; join warehouse SLIs on `swarm_task_id` |

The engine honors **assignment context** fields on the payload for scoring and observability; **DAG scheduling, convergence, and spend policy** remain host-owned (see `docs/POST_ENTERPRISE_EXTENSIONS.md`).
