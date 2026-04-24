# FREE AI — data governance checklist (org-owned)

**Status:** Human-facing template. Legal and security teams complete this per deployment; the engine does not load it.

Use with [DATA_CLASSIFICATION_AND_RETENTION.md](DATA_CLASSIFICATION_AND_RETENTION.md) and [ENTERPRISE_DEPLOY.md](ENTERPRISE_DEPLOY.md).

## 1. Data classes in scope

| Data type | Example locations | Classification (example) | Owner |
|-----------|-------------------|-------------------------|--------|
| End-user prompts | Request bodies, logs | | |
| Model outputs | Response bodies, receipts | | |
| Receipts / ledger | `evidence/receipts/` | | |
| Metrics | `data/metrics.jsonl` | | |
| Training / review queues | `data/training/` | | |

## 2. Retention

| Store | Retention period | Deletion method | Evidence |
|-------|------------------|-----------------|----------|
| metrics.jsonl | | | |
| traces | | | |
| receipts | | | |
| training review queue | | | |

## 3. DLP split (engine vs host)

| Path | Engine (`FREEAI_DLP_REDACT_PII`) | Host (gateway / SIEM / sinks) |
|------|----------------------------------|------------------------------|
| Non-streaming infer string body | Optional reference regex | Recommended full DLP |
| Streaming infer | Not redacted in-engine | Required if PII risk |
| JSON structured infer body | Not redacted field-by-field | App or gateway |
| Logs / receipts | Policy below | Redact before central log |

**Org decision:** Who approves turning on `FREEAI_DLP_REDACT_PII` and who owns gateway DLP rules?

## 4. Cross-border / residency

| Requirement | Satisfied how | Review date |
|---------------|---------------|---------------|
| Region for inference API | | |
| Region for logs | | |

## 5. Sign-off

| Role | Name | Date |
|------|------|------|
| Security | | |
| Legal / privacy | | |
| Engineering owner | | |
