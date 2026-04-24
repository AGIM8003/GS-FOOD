import { timingSafeEqual, createHash } from 'crypto';

/**
 * @param {import('http').IncomingMessage} req
 */
export function inferTokenFromRequest(req) {
  const auth = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const alt = String(req.headers?.['x-infer-key'] || '').trim();
  return auth || alt || '';
}

/**
 * Constant-time compare when lengths match.
 * @param {string} expected
 */
export function inferAuthorized(req, expected) {
  if (!expected) return true;
  const got = inferTokenFromRequest(req);
  if (!got) return false;
  const a = Buffer.from(got, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Apply CORS headers. Dev default: wildcard. Production without allowlist: omit ACAO (same-site / non-browser clients).
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {object} [sec]
 * @param {boolean} [sec.production_profile]
 * @param {string[]} [sec.cors_allow_origins]
 */
export function applyCorsHeaders(req, res, sec) {
  const origins = sec?.cors_allow_origins || [];
  const prod = sec?.production_profile === true;
  const origin = String(req.headers?.origin || '').trim();

  if (origins.length > 0) {
    if (origin && origins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else if (origins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  } else if (!prod) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, X-Admin-Key, X-Infer-Key, X-Tenant-Id');
}

/**
 * Stable hash for logs (never log raw keys).
 * @param {string} s
 */
export function redactSecretFingerprint(s) {
  if (!s) return null;
  return createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 12);
}
