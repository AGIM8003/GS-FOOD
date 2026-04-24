/** Ordered promotion stages (advance forward one step at a time; terminal paths are explicit). */
export const ORDERED_STAGES = [
  'discovered',
  'normalized',
  'candidate',
  'staged',
  'benchmark_passed',
  'canary',
  'promoted',
  'rollback_candidate',
  'rolled_back',
  'quarantined',
];

const idx = (s) => ORDERED_STAGES.indexOf(s);

/**
 * @param {string} from
 * @param {string} to
 * @param {{ evidence_ok?: boolean }} opts promotion to `promoted` requires opts.evidence_ok === true
 */
export function canTransitionPromotion(from, to, opts = {}) {
  if (from === to) return { ok: true, reason: 'noop' };
  const a = idx(from);
  const b = idx(to);
  if (a < 0 || b < 0) return { ok: false, reason: 'unknown_stage' };
  if (to === 'quarantined') return { ok: true, reason: 'quarantine' };
  if (to === 'rolled_back') {
    return { ok: ['promoted', 'canary', 'rollback_candidate'].includes(from), reason: 'rollback_terminal' };
  }
  if (to === 'rollback_candidate') {
    return { ok: from === 'promoted' || from === 'canary', reason: 'rollback_candidate' };
  }
  if (from === 'discovered' && to === 'promoted') return { ok: false, reason: 'illegal_skip_to_promoted' };
  if (b === a + 1) {
    if (to === 'promoted' && opts.evidence_ok !== true) return { ok: false, reason: 'promotion_requires_evidence' };
    return { ok: true, reason: 'sequential' };
  }
  if (b > a + 1) return { ok: false, reason: 'illegal_skip_forward' };
  return { ok: false, reason: 'backward_blocked' };
}
