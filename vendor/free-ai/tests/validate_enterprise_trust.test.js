import assert from 'assert';
import { spawnSync } from 'child_process';

const root = process.cwd();

function runTrust(extraEnv) {
  return spawnSync('node', ['scripts/validate_enterprise_trust.js'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
  });
}

const fail = runTrust({
  NODE_ENV: 'production',
  FREEAI_REQUIRE_ADMIN_KEY: '1',
  ADMIN_API_KEY: '',
});
assert.notStrictEqual(fail.status, 0, 'expected failure without ADMIN_API_KEY');

const ok = runTrust({
  NODE_ENV: 'production',
  FREEAI_REQUIRE_ADMIN_KEY: '1',
  ADMIN_API_KEY: 'test-key-for-validate-script-only',
  FREEAI_CORS_ALLOW_ORIGINS: 'https://app.example.com',
});
assert.strictEqual(ok.status, 0, 'expected success with admin key and cors');

console.log('validate_enterprise_trust test OK');
