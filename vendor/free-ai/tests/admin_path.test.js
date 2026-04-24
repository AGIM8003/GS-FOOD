import assert from 'assert';
import { isProtectedAdminPath } from '../src/server/adminPath.js';

assert.strictEqual(isProtectedAdminPath('/admin'), true);
assert.strictEqual(isProtectedAdminPath('/admin/imports'), true);
assert.strictEqual(isProtectedAdminPath('/admin/metrics-summary?x=1'), true);
assert.strictEqual(isProtectedAdminPath('/admin/prompt-preview?prompt=hi'), true);

assert.strictEqual(isProtectedAdminPath('/administrator'), false, 'must not treat /administrator as admin surface');
assert.strictEqual(isProtectedAdminPath('/admin-evil'), false);
assert.strictEqual(isProtectedAdminPath('/v1/infer'), false);
assert.strictEqual(isProtectedAdminPath(''), false);

console.log('admin_path test OK');
