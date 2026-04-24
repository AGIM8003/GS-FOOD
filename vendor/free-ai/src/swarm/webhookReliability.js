/**
 * Webhook Reliability Engine.
 *
 * Ensures at-least-once delivery for run/event webhooks with exponential
 * backoff, dead-letter queue, and delivery tracking.
 */

const webhookRegistry = new Map();
const deadLetterQueue = [];
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

function registerWebhook(id, config) {
  if (!config.url) throw new Error('webhook requires url');
  webhookRegistry.set(id, {
    id,
    url: config.url,
    events: config.events || ['*'],
    secret: config.secret || null,
    enabled: config.enabled !== false,
    deliveries: 0,
    failures: 0,
    last_delivery: null,
  });
}

function getWebhook(id) {
  return webhookRegistry.get(id) || null;
}

async function deliverWebhook(id, event) {
  const wh = webhookRegistry.get(id);
  if (!wh || !wh.enabled) return { ok: false, reason: 'not_found_or_disabled' };

  if (wh.events[0] !== '*' && !wh.events.includes(event.type)) {
    return { ok: true, reason: 'event_filtered' };
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (wh.secret) {
        const { createHmac } = await import('crypto');
        const sig = createHmac('sha256', wh.secret).update(JSON.stringify(event)).digest('hex');
        headers['X-FreeAI-Signature'] = sig;
      }

      const resp = await fetch(wh.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
      });

      if (resp.ok) {
        wh.deliveries++;
        wh.last_delivery = new Date().toISOString();
        return { ok: true, attempt, status: resp.status };
      }

      if (resp.status >= 400 && resp.status < 500 && resp.status !== 429) {
        wh.failures++;
        deadLetterQueue.push({ webhook_id: id, event, error: `HTTP ${resp.status}`, at: new Date().toISOString() });
        return { ok: false, reason: `client_error_${resp.status}`, dlq: true };
      }
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        wh.failures++;
        deadLetterQueue.push({ webhook_id: id, event, error: err?.message, at: new Date().toISOString() });
        return { ok: false, reason: 'max_retries_exhausted', dlq: true };
      }
    }

    const delay = BASE_DELAY_MS * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, delay));
  }

  return { ok: false, reason: 'unknown_failure' };
}

function getDeadLetterQueue() {
  return deadLetterQueue.slice();
}

function listWebhooks() {
  return [...webhookRegistry.values()].map((w) => ({
    id: w.id,
    url: w.url,
    events: w.events,
    enabled: w.enabled,
    deliveries: w.deliveries,
    failures: w.failures,
  }));
}

function __resetWebhooksForTests() {
  webhookRegistry.clear();
  deadLetterQueue.length = 0;
}

export { registerWebhook, getWebhook, deliverWebhook, getDeadLetterQueue, listWebhooks, __resetWebhooksForTests };
