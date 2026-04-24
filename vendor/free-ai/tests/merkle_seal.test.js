import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeMerkleRoot, verifyMerkleRoot, sealRunEvidence } from '../src/security/merkleSeal.js';

describe('merkleSeal', () => {
  it('computes root for single item', () => {
    const { root, leaf_count } = computeMerkleRoot(['receipt1']);
    assert.ok(root);
    assert.equal(leaf_count, 1);
  });

  it('computes root for multiple items', () => {
    const { root, leaf_count, tree } = computeMerkleRoot(['a', 'b', 'c', 'd']);
    assert.ok(root);
    assert.equal(leaf_count, 4);
    assert.ok(tree.length >= 2);
  });

  it('returns null for empty', () => {
    const { root } = computeMerkleRoot([]);
    assert.equal(root, null);
  });

  it('verifies correct root', () => {
    const items = ['r1', 'r2', 'r3'];
    const { root } = computeMerkleRoot(items);
    const v = verifyMerkleRoot(items, root);
    assert.equal(v.valid, true);
  });

  it('detects tampered items', () => {
    const items = ['r1', 'r2'];
    const { root } = computeMerkleRoot(items);
    const v = verifyMerkleRoot(['r1', 'r2-tampered'], root);
    assert.equal(v.valid, false);
  });

  it('seals run evidence', () => {
    const seal = sealRunEvidence(['receipt1', 'receipt2']);
    assert.ok(seal.merkle_root);
    assert.equal(seal.leaf_count, 2);
    assert.equal(seal.schema_version, 'freeaiMerkleSeal.v1');
  });

  it('deterministic root', () => {
    const r1 = computeMerkleRoot(['a', 'b', 'c']).root;
    const r2 = computeMerkleRoot(['a', 'b', 'c']).root;
    assert.equal(r1, r2);
  });
});
