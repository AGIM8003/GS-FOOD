import assert from 'assert';
import { redactPlaintextForTenant, redactInferResponseBody } from '../src/security/dlpHook.js';

const savedChoices = process.env.FREEAI_DLP_REDACT_OPENAI_CHOICES;

assert.strictEqual(redactPlaintextForTenant('x', undefined), 'x');
assert.strictEqual(redactPlaintextForTenant('x', { enabled: false }), 'x');
assert.strictEqual(redactPlaintextForTenant('keep', { enabled: true }), 'keep');

const email = 'Contact alice@example.com today.';
assert.ok(!redactPlaintextForTenant(email, { enabled: true }).includes('alice@'));
assert.ok(redactPlaintextForTenant(email, { enabled: true }).includes('[REDACTED_EMAIL]'));

const phone = 'Call 415-555-0100 please.';
const rp = redactPlaintextForTenant(phone, { enabled: true });
assert.ok(!rp.includes('415'));
assert.ok(rp.includes('[REDACTED_PHONE]'));

const savedAllow = process.env.FREEAI_DLP_ALLOW_SUBSTR;
process.env.FREEAI_DLP_ALLOW_SUBSTR = '@corp.internal.trusted';
const allowText = 'alice@example.com and route @corp.internal.trusted';
const allowOut = redactPlaintextForTenant(allowText, { enabled: true });
assert.strictEqual(allowOut, allowText, 'allow-substr bypasses redaction for trusted marker payloads');
if (savedAllow !== undefined) process.env.FREEAI_DLP_ALLOW_SUBSTR = savedAllow;
else delete process.env.FREEAI_DLP_ALLOW_SUBSTR;

const jsonBody = redactInferResponseBody({ text: 'ping user@evil.com ok', meta: 'x' }, { enabled: true });
assert.ok(typeof jsonBody === 'object');
assert.ok(!String(jsonBody.text).includes('evil.com'));
assert.strictEqual(jsonBody.meta, 'x');

process.env.FREEAI_DLP_REDACT_OPENAI_CHOICES = '1';
const withChoices = redactInferResponseBody(
  {
    choices: [{ message: { content: 'reach leak@example.com please' } }, { message: { role: 'assistant', content: 'ok' } }],
  },
  { enabled: true },
);
assert.ok(!String(withChoices.choices[0].message.content).includes('leak@'));
if (savedChoices !== undefined) process.env.FREEAI_DLP_REDACT_OPENAI_CHOICES = savedChoices;
else delete process.env.FREEAI_DLP_REDACT_OPENAI_CHOICES;

console.log('dlp_hook test OK');
