/** @typedef {'created'|'validating'|'admitted'|'running'|'completed'|'failed'|'paused_for_review'|'resumable'|'resumed'|'rejected'|'quarantined'} RunState */
/** @typedef {'pending'|'admitted'|'running'|'completed'|'failed'|'skipped'|'waiting_human_review'|'resumed'|'quarantined'} NodeState */

const RUN_ALLOWED = {
  created: ['validating', 'failed'],
  validating: ['admitted', 'failed'],
  admitted: ['running', 'failed'],
  running: ['completed', 'failed', 'paused_for_review'],
  completed: [],
  failed: ['resumable'],
  paused_for_review: ['running', 'rejected', 'failed'],
  resumable: ['resumed', 'failed'],
  resumed: ['running', 'failed'],
  rejected: [],
  quarantined: [],
};

const NODE_ALLOWED = {
  pending: ['admitted', 'skipped'],
  admitted: ['running'],
  running: ['completed', 'failed', 'waiting_human_review'],
  completed: [],
  failed: ['resumed'],
  skipped: [],
  waiting_human_review: ['completed', 'failed', 'quarantined'],
  resumed: ['running'],
  quarantined: [],
};

export const RUN_STATES = Object.keys(RUN_ALLOWED);
export const NODE_STATES = Object.keys(NODE_ALLOWED);

export function assertRunTransition(from, to) {
  const next = RUN_ALLOWED[from] || [];
  if (!next.includes(to)) {
    throw new Error(`invalid_run_transition:${from}->${to}`);
  }
}

export function assertNodeTransition(from, to) {
  const next = NODE_ALLOWED[from] || [];
  if (!next.includes(to)) {
    throw new Error(`invalid_node_transition:${from}->${to}`);
  }
}
