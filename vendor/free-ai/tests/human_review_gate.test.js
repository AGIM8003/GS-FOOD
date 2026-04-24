import assert from 'assert';
import { createReview, getReview, listReviews, listPendingReviews, approveReview, rejectReview, findReviewByRunAndNode, __resetReviewsForTests } from '../src/swarm/humanReviewGate.js';

__resetReviewsForTests();

{
  const r = createReview({ run_id: 'run-1', node_id: 'n-1', requested_action: 'approve_to_continue', tenant_id: 'tenant-a' });
  assert.ok(r.review_id);
  assert.strictEqual(r.run_id, 'run-1');
  assert.strictEqual(r.node_id, 'n-1');
  assert.strictEqual(r.tenant_id, 'tenant-a');
  assert.strictEqual(r.review_status, 'pending');
  assert.strictEqual(r.reviewer_id, null);
}

{
  const list = listReviews();
  assert.strictEqual(list.length, 1);
  const pending = listPendingReviews();
  assert.strictEqual(pending.length, 1);
}

{
  const r = createReview({ run_id: 'run-2', node_id: 'n-2', requested_action: 'approve_to_continue', tenant_id: 'tenant-b' });
  const found = findReviewByRunAndNode('run-2', 'n-2', { tenant_id: 'tenant-b' });
  assert.ok(found);
  assert.strictEqual(found.review_id, r.review_id);
  const notFoundOtherTenant = findReviewByRunAndNode('run-2', 'n-2', { tenant_id: 'tenant-a' });
  assert.strictEqual(notFoundOtherTenant, null);
}

{
  const reviews = listReviews({ tenant_id: 'tenant-a' });
  const rid = reviews[0].review_id;
  const result = approveReview(rid, { reviewer_id: 'admin-1', decision_notes: 'Looks good', tenant_id: 'tenant-a' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.review.review_status, 'approved');
  assert.strictEqual(result.review.reviewer_id, 'admin-1');
  assert.ok(result.review.decided_at);

  const again = approveReview(rid, { tenant_id: 'tenant-a' });
  assert.strictEqual(again.ok, false);
  assert.ok(again.error.includes('already'));
}

{
  const r = createReview({ run_id: 'run-3', node_id: 'n-3', requested_action: 'approve_to_continue', tenant_id: 'tenant-c' });
  const result = rejectReview(r.review_id, { reviewer_id: 'admin-2', decision_notes: 'Not safe', tenant_id: 'tenant-c' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.review.review_status, 'rejected');
}

{
  const result = approveReview('nonexistent', { tenant_id: 'tenant-a' });
  assert.strictEqual(result.ok, false);
  assert.ok(result.error.includes('not_found'));
}

{
  const r = createReview({ run_id: 'run-4', node_id: 'n-4', requested_action: 'approve_to_continue', tenant_id: 'tenant-z' });
  const denied = approveReview(r.review_id, { reviewer_id: 'x', tenant_id: 'tenant-a' });
  assert.strictEqual(denied.ok, false);
  assert.ok(denied.error.includes('not_found'));
}

__resetReviewsForTests();
assert.strictEqual(listReviews().length, 0);

console.log('human_review_gate test OK');
