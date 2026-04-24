/**
 * @param {object} params
 * @param {string} params.strategy deterministic_priority | first_valid
 * @param {string[]|null} params.priority node_ids for deterministic_priority
 * @param {{ node_id: string, output: string, ok: boolean }[]} params.branches
 * @returns {{ ok: boolean, value: string|null, picked_branch: string|null, reason?: string }}
 */
export function executeMergeV1({ strategy, priority, branches }) {
  const list = Array.isArray(branches) ? branches : [];
  const valid = (b) => b && b.ok && typeof b.output === 'string' && b.output.trim().length > 0;

  if (strategy === 'deterministic_priority') {
    const order = Array.isArray(priority) ? priority : [];
    for (const id of order) {
      const b = list.find((x) => x.node_id === id);
      if (b && valid(b)) {
        return { ok: true, value: b.output, picked_branch: id };
      }
    }
    return { ok: false, value: null, picked_branch: null, reason: 'no_priority_branch_valid' };
  }

  if (strategy === 'first_valid') {
    const sorted = [...list].sort((a, b) => String(a.node_id).localeCompare(String(b.node_id)));
    for (const b of sorted) {
      if (valid(b)) return { ok: true, value: b.output, picked_branch: b.node_id };
    }
    return { ok: false, value: null, picked_branch: null, reason: 'no_first_valid_branch' };
  }

  return { ok: false, value: null, picked_branch: null, reason: 'unknown_strategy' };
}
