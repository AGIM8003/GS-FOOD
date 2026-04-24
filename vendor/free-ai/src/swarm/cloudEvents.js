/**
 * CloudEvents Envelope — normalized event emission for every swarm state change.
 *
 * All events conform to CloudEvents v1.0 spec with structured content mode.
 * Enables routing to any CNCF-compatible sink (Kafka, Pub/Sub, webhooks).
 */

const EVENT_TYPES = [
  'freeai.swarm.run.started',
  'freeai.swarm.run.completed',
  'freeai.swarm.run.failed',
  'freeai.swarm.node.started',
  'freeai.swarm.node.completed',
  'freeai.swarm.node.failed',
  'freeai.swarm.node.retried',
  'freeai.swarm.budget.warning',
  'freeai.swarm.budget.exhausted',
  'freeai.swarm.anomaly.detected',
  'freeai.swarm.security.injection_blocked',
];

const subscribers = [];

function createCloudEvent(type, data, opts = {}) {
  if (!EVENT_TYPES.includes(type) && !type.startsWith('freeai.')) {
    throw new Error(`unknown event type: ${type}`);
  }
  return {
    specversion: '1.0',
    id: opts.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: opts.source || 'urn:freeai:swarm-runtime',
    type,
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    subject: opts.subject || undefined,
    data,
  };
}

function emitEvent(type, data, opts) {
  const event = createCloudEvent(type, data, opts);
  for (const sub of subscribers) {
    try { sub(event); } catch { /* subscriber errors must not break the pipeline */ }
  }
  return event;
}

function subscribe(fn) {
  if (typeof fn !== 'function') throw new Error('subscriber must be a function');
  subscribers.push(fn);
  return () => {
    const idx = subscribers.indexOf(fn);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}

function listEventTypes() {
  return EVENT_TYPES.slice();
}

function __resetEventsForTests() {
  subscribers.length = 0;
}

export { createCloudEvent, emitEvent, subscribe, listEventTypes, EVENT_TYPES, __resetEventsForTests };
