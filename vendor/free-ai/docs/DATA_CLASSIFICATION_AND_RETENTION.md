# FREE AI — data classification and retention

**Status:** Human-facing policy template. Not engine-loaded.

## Classification (host-owned)

| Class | Examples | Default routing |
|-------|----------|-------------------|
| Public | Marketing copy | May leave browser without engine |
| Internal | Product docs, tickets | Engine OK on loopback; avoid shipping to cloud without review |
| Confidential | PII, credentials, health/financial | **No** cloud provider without DPA + encryption; prefer local / air-gapped |
| Regulated | HIPAA/GDPR special categories | **Blocked** from FREE AI cloud paths unless legal approves explicit controls |

FREE AI does **not** auto-classify prompts; the **host application** must enforce policy before calling `/v1/infer`.

## Retention (defaults for this repo)

| Artifact | Location | Suggested retention |
|----------|----------|---------------------|
| Metrics JSONL | `data/metrics.jsonl` | 30–90 days; truncate per host policy |
| Traces | `data/traces.jsonl` (if used) | Match observability policy |
| Evidence | `evidence/` | Until investigation closed; prune via `scripts/prune_evidence.js` |
| Model control plane | `data/model_control_plane/` | Until superseded; keep last N snapshots in backup |
| Promotion history | `promotion_events.jsonl` | 1 year minimum for audit; host may extend |

## Pluggable DLP

`src/security/dlpHook.js` exports `redactPlaintextForTenant` (default no-op). Optional reference redaction: `FREEAI_DLP_REDACT_PII=1` (see [ENTERPRISE_DEPLOY.md](ENTERPRISE_DEPLOY.md) host vs in-engine boundary). Post-enterprise DLP options and modality/catalog extensions: [POST_ENTERPRISE_EXTENSIONS.md](POST_ENTERPRISE_EXTENSIONS.md). Wire stricter redactors in host forks per `FREEAI.md` §33.10.
