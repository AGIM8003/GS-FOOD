import assert from 'assert';
import { adminTenantScope } from '../src/security/adminRoles.js';

const old = process.env.FREEAI_ENFORCE_TENANT_ID;

process.env.FREEAI_ENFORCE_TENANT_ID = '1';

{
  const req = { headers: {} };
  const r = adminTenantScope(req, 'admin_read');
  assert.strictEqual(r.allowed, false);
  assert.strictEqual(r.reason, 'tenant_scope_required');
}

{
  const req = { headers: { 'x-tenant-id': 'tenant-a' } };
  const r = adminTenantScope(req, 'admin_read');
  assert.strictEqual(r.allowed, true);
  assert.strictEqual(r.tenant_id, 'tenant-a');
}

{
  const req = { headers: {} };
  const r = adminTenantScope(req, 'admin_write');
  assert.strictEqual(r.allowed, true);
}

if (old === undefined) delete process.env.FREEAI_ENFORCE_TENANT_ID;
else process.env.FREEAI_ENFORCE_TENANT_ID = old;

console.log('admin_tenant_scope test OK');

