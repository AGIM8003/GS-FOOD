import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSchemaVersion, getLatestSchemaVersion, isVersionCompatible, getMigrationPath, listSchemaVersions } from '../src/swarm/schemaRegistry.js';

describe('schemaRegistry', () => {
  it('gets known version', () => {
    const v = getSchemaVersion('v3');
    assert.ok(v);
    assert.equal(v.version, 'v3');
    assert.ok(v.features.includes('human_review_node'));
  });

  it('returns null for unknown version', () => {
    assert.equal(getSchemaVersion('v99'), null);
  });

  it('gets latest version', () => {
    const latest = getLatestSchemaVersion();
    assert.ok(latest);
    assert.equal(latest.version, 'v5');
  });

  it('checks version compatibility', () => {
    assert.equal(isVersionCompatible('v1', 'v5').compatible, true);
    assert.equal(isVersionCompatible('v5', 'v1').compatible, false);
  });

  it('gets migration path', () => {
    const path = getMigrationPath('v1', 'v3');
    assert.equal(path.ok, true);
    assert.equal(path.steps.length, 2);
    assert.equal(path.steps[0].from, 'v1');
    assert.equal(path.steps[0].to, 'v2');
  });

  it('reports no steps when already at target', () => {
    const path = getMigrationPath('v3', 'v3');
    assert.equal(path.ok, true);
    assert.equal(path.steps.length, 0);
  });

  it('lists all versions', () => {
    assert.ok(listSchemaVersions().length >= 5);
  });
});
