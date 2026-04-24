import { evaluateGraphPolicy } from './evaluateGraphPolicy.js';
import { evaluateNodePolicy } from './evaluateNodePolicy.js';
import { evaluateMergePolicy } from './evaluateMergePolicy.js';
import { evaluateResumePolicy } from './evaluateResumePolicy.js';
import { evaluateToolPolicy } from './evaluateToolPolicy.js';
import { evaluateHumanReviewDecisionPolicy } from './evaluateHumanReviewDecisionPolicy.js';
import { evaluateProviderEligibilityPolicy } from './evaluateProviderEligibilityPolicy.js';

const POLICY_ZONES = [
  'graph_admission',
  'node_execution',
  'merge_decision',
  'resume_execution',
  'human_review_decision',
  'tool_execution',
  'provider_model_eligibility',
];

const evaluators = {
  graph_admission: evaluateGraphPolicy,
  node_execution: evaluateNodePolicy,
  merge_decision: evaluateMergePolicy,
  resume_execution: evaluateResumePolicy,
  tool_execution: evaluateToolPolicy,
  human_review_decision: evaluateHumanReviewDecisionPolicy,
  provider_model_eligibility: evaluateProviderEligibilityPolicy,
};

function allow(zone, reasonCode) {
  return {
    policy_id: `pol-${zone}-${Date.now()}`,
    policy_zone: zone,
    decision: 'allow',
    blocking: false,
    reason_code: reasonCode,
    summary: `${zone}: allowed`,
    remediation: null,
    evaluated_at: new Date().toISOString(),
  };
}

export function deny(zone, reasonCode, summary, remediation) {
  return {
    policy_id: `pol-${zone}-${Date.now()}`,
    policy_zone: zone,
    decision: 'deny',
    blocking: true,
    reason_code: reasonCode,
    summary: summary || `${zone}: denied`,
    remediation: remediation || null,
    evaluated_at: new Date().toISOString(),
  };
}

export function evaluatePolicy(zone, context) {
  const evaluator = evaluators[zone];
  if (!evaluator) {
    return deny(zone, 'unknown_zone', `Unknown policy zone: ${zone}`, 'Check zone name');
  }
  return evaluator(context);
}

export { POLICY_ZONES };
