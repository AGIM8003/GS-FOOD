function buildResult(decision, reason_code, summary, remediation = null) {
  return {
    policy_id: `pol-human_review_decision-${Date.now()}`,
    policy_zone: 'human_review_decision',
    decision,
    blocking: decision === 'deny',
    reason_code,
    summary,
    remediation,
    evaluated_at: new Date().toISOString(),
  };
}

export function evaluateHumanReviewDecisionPolicy(ctx) {
  const action = ctx?.action;
  const review = ctx?.review;
  const payload = ctx?.payload || {};
  const reviewerId = payload.reviewer_id || null;
  const notes = payload.decision_notes || '';

  if (!review) {
    return buildResult('deny', 'review_not_found', 'Review record not found', 'Load review before decision');
  }
  if (review.review_status !== 'pending') {
    return buildResult('deny', 'review_not_pending', `Review already ${review.review_status}`, 'Only pending reviews can be decided');
  }
  if (!reviewerId || String(reviewerId).trim().length < 2) {
    return buildResult('deny', 'missing_reviewer_id', 'reviewer_id required', 'Provide reviewer_id');
  }
  if (action === 'reject' && String(notes).trim().length < 3) {
    return buildResult('deny', 'reject_notes_required', 'Rejections require decision_notes', 'Provide non-empty decision_notes');
  }
  if (action !== 'approve' && action !== 'reject') {
    return buildResult('deny', 'invalid_review_action', `Invalid action '${action}'`, 'Use approve or reject');
  }
  return buildResult('allow', 'human_review_decision_allowed', `Review ${action} allowed`);
}

