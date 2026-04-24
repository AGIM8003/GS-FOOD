import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createCloudEvent, emitEvent, subscribe, listEventTypes, __resetEventsForTests } from '../src/swarm/cloudEvents.js';

describe('cloudEvents', () => {
  beforeEach(() => __resetEventsForTests());

  it('creates valid CloudEvents v1.0 envelope', () => {
    const e = createCloudEvent('freeai.swarm.run.started', { run_id: 'r1' });
    assert.equal(e.specversion, '1.0');
    assert.equal(e.type, 'freeai.swarm.run.started');
    assert.ok(e.id);
    assert.ok(e.time);
    assert.equal(e.datacontenttype, 'application/json');
  });

  it('rejects unknown event type', () => {
    assert.throws(() => createCloudEvent('com.unknown.event', {}));
  });

  it('allows custom freeai. prefixed events', () => {
    const e = createCloudEvent('freeai.custom.event', {});
    assert.equal(e.type, 'freeai.custom.event');
  });

  it('emits to subscribers', () => {
    const received = [];
    subscribe((e) => received.push(e));
    emitEvent('freeai.swarm.run.started', { run_id: 'r1' });
    assert.equal(received.length, 1);
    assert.equal(received[0].data.run_id, 'r1');
  });

  it('unsubscribes correctly', () => {
    const received = [];
    const unsub = subscribe((e) => received.push(e));
    emitEvent('freeai.swarm.run.started', {});
    unsub();
    emitEvent('freeai.swarm.run.completed', {});
    assert.equal(received.length, 1);
  });

  it('subscriber errors do not break emission', () => {
    subscribe(() => { throw new Error('boom'); });
    const received = [];
    subscribe((e) => received.push(e));
    emitEvent('freeai.swarm.run.started', {});
    assert.equal(received.length, 1);
  });

  it('lists all event types', () => {
    const types = listEventTypes();
    assert.ok(types.length > 5);
    assert.ok(types.includes('freeai.swarm.run.started'));
  });
});
