# FREE AI — penetration test scope (template)

**Status:** Human-facing. Hand to external testers; customize per deployment.

## In scope (typical)

- `/admin/*` with and without `ADMIN_API_KEY`
- `/v1/infer`, `/v1/stream` with optional infer token enabled
- CORS behavior under `FREEAI_CORS_ALLOW_ORIGINS` and production profile
- Provider adapters (credential handling, error paths) — **read-only** review unless contract allows live calls

## Out of scope (unless explicitly added)

- Third-party AI vendor infrastructure
- Host OS kernel hardening
- Physical security of datacenters

## Rules of engagement

- Bind test target to non-production keys.
- No destructive writes to production `memory/` or `evidence/` without written approval.

## Deliverables

Executive summary, finding list with severity, retest notes after remediation.
