import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerWebhook, getWebhook, listWebhooks, getDeadLetterQueue, __resetWebhooksForTests } from '../src/swarm/webhookReliability.js';

describe('webhookReliability', () => {
  beforeEach(() => __resetWebhooksForTests());

  it('registers webhook', () => {
    registerWebhook('wh1', { url: 'http://example.com/hook', events: ['freeai.swarm.run.completed'] });
    const w = getWebhook('wh1');
    assert.ok(w);
    assert.equal(w.url, 'http://example.com/hook');
  });

  it('rejects webhook without url', () => {
    assert.throws(() => registerWebhook('wh1', {}));
  });

  it('lists webhooks', () => {
    registerWebhook('wh1', { url: 'http://a.com' });
    registerWebhook('wh2', { url: 'http://b.com' });
    assert.equal(listWebhooks().length, 2);
  });

  it('dead letter queue starts empty', () => {
    assert.equal(getDeadLetterQueue().length, 0);
  });

  it('returns null for unknown webhook', () => {
    assert.equal(getWebhook('missing'), null);
  });

  it('defaults events to wildcard', () => {
    registerWebhook('wh1', { url: 'http://a.com' });
    assert.deepEqual(getWebhook('wh1').events, ['*']);
  });
});
