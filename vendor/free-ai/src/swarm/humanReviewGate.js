import crypto from 'crypto';

const reviews = new Map();

function nowIso() {
  return new Date().toISOString();
}

function matchesTenant(tenant_id, expectedTenantId) {
  if (!expectedTenantId) return true;
  return String(tenant_id || '') === String(expectedTenantId);
}

export function createReview({ run_id, node_id, requested_action, tenant_id = null }) {
  const review_id = `rev-${Date.now()}-${(crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)).slice(0, 8)}`;
  const rec = {
    review_id,
    run_id,
    node_id,
    tenant_id: tenant_id || null,
    requested_action: requested_action || 'approve_to_continue',
    review_status: 'pending',
    reviewer_id: null,
    decision_notes: null,
    decided_at: null,
    created_at: nowIso(),
  };
  reviews.set(review_id, rec);
  return rec;
}

export function getReview(reviewId, opts = {}) {
  const expectedTenantId = opts?.tenant_id || null;
  const review = reviews.get(reviewId) || null;
  if (!review) return null;
  if (!matchesTenant(review.tenant_id, expectedTenantId)) return null;
  return review;
}

export function listReviews(opts = {}) {
  const expectedTenantId = opts?.tenant_id || null;
  return [...reviews.values()]
    .filter((r) => matchesTenant(r.tenant_id, expectedTenantId))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

export function listPendingReviews(opts = {}) {
  return listReviews(opts).filter((r) => r.review_status === 'pending');
}

export function findReviewByRunAndNode(runId, nodeId, opts = {}) {
  const expectedTenantId = opts?.tenant_id || null;
  for (const r of reviews.values()) {
    if (
      r.run_id === runId
      && r.node_id === nodeId
      && r.review_status === 'pending'
      && matchesTenant(r.tenant_id, expectedTenantId)
    ) return r;
  }
  return null;
}

export function approveReview(reviewId, { reviewer_id, decision_notes, tenant_id } = {}) {
  const r = reviews.get(reviewId);
  if (!r) return { ok: false, error: 'review_not_found' };
  if (!matchesTenant(r.tenant_id, tenant_id || null)) return { ok: false, error: 'review_not_found' };
  if (r.review_status !== 'pending') return { ok: false, error: `review_already_${r.review_status}` };
  r.review_status = 'approved';
  r.reviewer_id = reviewer_id || null;
  r.decision_notes = decision_notes || null;
  r.decided_at = nowIso();
  return { ok: true, review: r };
}

export function rejectReview(reviewId, { reviewer_id, decision_notes, tenant_id } = {}) {
  const r = reviews.get(reviewId);
  if (!r) return { ok: false, error: 'review_not_found' };
  if (!matchesTenant(r.tenant_id, tenant_id || null)) return { ok: false, error: 'review_not_found' };
  if (r.review_status !== 'pending') return { ok: false, error: `review_already_${r.review_status}` };
  r.review_status = 'rejected';
  r.reviewer_id = reviewer_id || null;
  r.decision_notes = decision_notes || null;
  r.decided_at = nowIso();
  return { ok: true, review: r };
}

export function __resetReviewsForTests() {
  reviews.clear();
}
