/**
 * Merkle Seal over evidence/receipt trees.
 *
 * Produces a Merkle root hash from an array of items, allowing
 * tamper-evident verification of evidence integrity.
 */
import crypto from 'crypto';

function hashLeaf(data) {
  const s = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(s).digest('hex');
}

function hashPair(a, b) {
  const combined = a < b ? a + b : b + a;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

function computeMerkleRoot(items) {
  if (!Array.isArray(items) || items.length === 0) return { root: null, leaf_count: 0, tree: [] };
  let level = items.map((item) => hashLeaf(item));
  const tree = [level.slice()];

  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        next.push(hashPair(level[i], level[i + 1]));
      } else {
        next.push(level[i]);
      }
    }
    level = next;
    tree.push(level.slice());
  }

  return { root: level[0], leaf_count: items.length, tree };
}

function verifyMerkleRoot(items, expectedRoot) {
  const { root } = computeMerkleRoot(items);
  return { valid: root === expectedRoot, computed: root, expected: expectedRoot };
}

function sealRunEvidence(receipts) {
  const seal = computeMerkleRoot(receipts);
  return {
    schema_version: 'freeaiMerkleSeal.v1',
    sealed_at: new Date().toISOString(),
    merkle_root: seal.root,
    leaf_count: seal.leaf_count,
  };
}

export { computeMerkleRoot, verifyMerkleRoot, sealRunEvidence, hashLeaf, hashPair };
