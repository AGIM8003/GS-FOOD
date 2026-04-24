import crypto from 'crypto';

const VALID_ROLES = ['admin_read', 'admin_write'];

/**
 * Parse FREEAI_ADMIN_ROLES env var.
 * Format: "key1:role1,key2:role2" or empty (backward compatible: single ADMIN_API_KEY gets admin_write).
 * @returns {Map<string, string>} key -> role
 */
export function parseAdminRoles() {
  const raw = process.env.FREEAI_ADMIN_ROLES || '';
  const map = new Map();
  if (!raw.trim()) return map;
  for (const entry of raw.split(',')) {
    const [key, role] = entry.split(':').map((s) => s.trim());
    if (key && VALID_ROLES.includes(role)) {
      map.set(key, role);
    }
  }
  return map;
}

/**
 * Determine the admin role for a request.
 * Returns 'admin_write' for legacy single-key mode, or the scoped role if FREEAI_ADMIN_ROLES is set.
 * Returns null if unauthorized.
 */
export function resolveAdminRole(req, cfg) {
  const key = process.env.ADMIN_API_KEY;
  const requireKey = cfg?.security?.require_admin_key === true;
  const tok = (req.headers['x-admin-key'] || '').trim() ||
    String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();

  const roleMap = parseAdminRoles();

  if (roleMap.size > 0) {
    const role = roleMap.get(tok);
    if (role) return role;
    return null;
  }

  if (requireKey) {
    if (!String(key || '').trim()) return null;
    return tok === key ? 'admin_write' : null;
  }

  if (!key) return 'admin_write';
  return tok === key ? 'admin_write' : null;
}

export function isTenantEnforcementEnabled() {
  return process.env.FREEAI_ENFORCE_TENANT_ID === '1';
}

export function extractTenantId(req) {
  return String(req.headers['x-tenant-id'] || '').trim().slice(0, 128) || null;
}

export function adminTenantScope(req, role) {
  if (!isTenantEnforcementEnabled()) return { allowed: true, tenant_id: null, reason: null };
  if (role === 'admin_write') return { allowed: true, tenant_id: extractTenantId(req), reason: null };
  const tenantId = extractTenantId(req);
  if (!tenantId) {
    return { allowed: false, tenant_id: null, reason: 'tenant_scope_required' };
  }
  return { allowed: true, tenant_id: tenantId, reason: null };
}

export { VALID_ROLES };
