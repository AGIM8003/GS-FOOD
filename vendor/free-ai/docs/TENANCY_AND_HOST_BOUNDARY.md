# FREE AI — tenancy and host boundary

**Status:** Human-facing architecture contract. Not engine-loaded.

## Default: host-enforced tenancy

For most enterprises, **tenant identity, quotas, and RBAC** should live in the **reverse proxy / API gateway** (virtual keys, JWT claims, mTLS). The engine listens on **127.0.0.1** and trusts the host that already authenticated the caller.

## Optional: correlation only in-engine

When clients send **`X-Tenant-Id`** (non-secret label), the engine may attach it to **metrics** (`tenant_id` field on `request_handled`) for correlation in your SIEM. This is **not** authentication and must not be treated as proof of tenant isolation.

## When to add in-process multi-tenancy

Only if product scope explicitly requires per-tenant isolation **inside** the Node process (separate budgets, separate memory namespaces). That is a **large** follow-on design; do not infer it from header pass-through alone.

## Related spec

See `FREEAI.md` §33.7 and §33.10 for virtual keys, budgets, and audit field lists.
