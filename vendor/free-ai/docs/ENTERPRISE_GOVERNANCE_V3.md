# Enterprise Governance V3

## Overview

V3 adds scoped admin roles, tenant enforcement, and receipt tamper detection to bring FREE AI closer to enterprise-grade governance.

## Scoped Admin Roles

Set `FREEAI_ADMIN_ROLES` to a comma-separated list of `key:role` pairs:

```
FREEAI_ADMIN_ROLES=readkey123:admin_read,writekey456:admin_write
```

| Role | Permissions |
|------|------------|
| `admin_read` | GET admin endpoints only |
| `admin_write` | All admin endpoints including POST resume/approve/reject |

When `FREEAI_ADMIN_ROLES` is not set, the legacy `ADMIN_API_KEY` single-key model applies and grants `admin_write`.

## Tenant Enforcement

Set `FREEAI_ENFORCE_TENANT_ID=1` to require `X-Tenant-Id` header on `/v1/infer` and `/v1/swarm/run` routes. Requests without the header are rejected with HTTP 400.

Tenant ID is:
- Stored on swarm run records (`tenant_id` field)
- Emitted in metrics events for filtering
- Truncated to 128 characters

## Receipt Chain HMAC

Every receipt appended to a swarm run record includes a `chain_hmac` field. Each HMAC is computed over the receipt's core fields plus the previous receipt's HMAC, forming a hash chain. This enables tamper detection without full blockchain overhead.

Set `FREEAI_RECEIPT_HMAC_SECRET` to a secret key. The default key is for development only.

Verify chain integrity programmatically:

```javascript
import { verifyReceiptChain } from './src/swarm/receiptChainHmac.js';
const result = verifyReceiptChain(run.receipts);
// { valid: true, chain_length: 6 }
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FREEAI_ADMIN_ROLES` | *(unset)* | Scoped role map |
| `FREEAI_ENFORCE_TENANT_ID` | `0` | Require X-Tenant-Id |
| `FREEAI_RECEIPT_HMAC_SECRET` | dev default | HMAC secret for chain |
