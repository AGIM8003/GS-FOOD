import assert from 'assert';
import { validateEnterpriseSecurityConfig } from '../src/config.js';
import { inferAuthorized, applyCorsHeaders } from '../src/server/httpSecurity.js';
import { redactPlaintextForTenant } from '../src/security/dlpHook.js';

const savedAdmin = process.env.ADMIN_API_KEY;
const savedInfer = process.env.FREEAI_INFER_API_KEY;

function mockRes() {
  const headers = {};
  return {
    setHeader(k, v) {
      headers[k] = v;
    },
    headers,
  };
}

function mockReq(headers = {}) {
  return { headers };
}

// validateEnterpriseSecurityConfig
delete process.env.ADMIN_API_KEY;
let v = validateEnterpriseSecurityConfig({
  security: { require_admin_key: true, infer_api_key_required: false, infer_api_key: null },
});
assert.ok(!v.ok, 'must reject missing admin key when required');
if (savedAdmin !== undefined) process.env.ADMIN_API_KEY = savedAdmin;
else delete process.env.ADMIN_API_KEY;

delete process.env.FREEAI_INFER_API_KEY;
v = validateEnterpriseSecurityConfig({
  security: { require_admin_key: false, infer_api_key_required: true, infer_api_key: null },
});
assert.ok(!v.ok, 'must reject missing infer key when required');
if (savedInfer !== undefined) process.env.FREEAI_INFER_API_KEY = savedInfer;
else delete process.env.FREEAI_INFER_API_KEY;

v = validateEnterpriseSecurityConfig({
  security: { require_admin_key: false, infer_api_key_required: true, infer_api_key: 'secret-token' },
});
assert.ok(v.ok);

// inferAuthorized
const reqOk = mockReq({ authorization: 'Bearer secret-token' });
assert.strictEqual(inferAuthorized(reqOk, 'secret-token'), true);
assert.strictEqual(inferAuthorized(mockReq({ 'x-infer-key': 'a' }), 'b'), false);

// CORS: production with no list omits wildcard
const res = mockRes();
applyCorsHeaders(mockReq({ origin: 'https://evil.example' }), /** @type {any} */ (res), {
  production_profile: true,
  cors_allow_origins: [],
});
assert.ok(!Object.prototype.hasOwnProperty.call(res.headers, 'Access-Control-Allow-Origin'));

const res2 = mockRes();
applyCorsHeaders(mockReq({ origin: 'https://app.example' }), /** @type {any} */ (res2), {
  production_profile: true,
  cors_allow_origins: ['https://app.example'],
});
assert.strictEqual(res2.headers['Access-Control-Allow-Origin'], 'https://app.example');

// DLP hook default
assert.strictEqual(redactPlaintextForTenant('hello', { enabled: false }), 'hello');

console.log('enterprise_security_baseline test OK');
