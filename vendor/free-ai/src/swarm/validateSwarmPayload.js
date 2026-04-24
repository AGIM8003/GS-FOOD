import { emitMetric } from '../observability/metrics.js';

/** Max child_trace_ids entries when validation runs (DoS guard). */
export const SWARM_MAX_CHILD_TRACE_IDS = 128;

/** True when `swarm` body must pass `validateSwarmPayload` (allowed keys, types, caps). */
export function isSwarmPayloadValidationEnabled() {
  if (process.env.FREEAI_VALIDATE_SWARM_PAYLOAD === '1') return true;
  if (process.env.FREEAI_STRICT_SWARM === '1') return true;
  if (process.env.NODE_ENV === 'production') return true;
  if (process.env.FREEAI_PRODUCTION_PROFILE === '1') return true;
  if (process.env.FREEAI_REQUIRE_ADMIN_KEY === '1') return true;
  return false;
}

const ALLOWED_KEYS = new Set([
  'task_id',
  'agent_id',
  'role',
  'subtask_goal',
  'child_trace_ids',
  'fan_in',
  'rollup',
  'merge_strategy',
  'parent_trace_id',
  'cua_payload', // Computer-Use Autonomy payload
]);

function isNonEmptyString(v) {
  return typeof v === 'string' && v.length > 0;
}

/**
 * @param {unknown} swarm
 * @returns {{ ok: true } | { ok: false, error: string, status: number }}
 */
export function validateSwarmPayload(swarm) {
  if (swarm === undefined || swarm === null) return { ok: true };
  if (typeof swarm !== 'object' || Array.isArray(swarm)) {
    return { ok: false, error: 'swarm must be an object', status: 400 };
  }
  for (const key of Object.keys(swarm)) {
    if (!ALLOWED_KEYS.has(key)) {
      return { ok: false, error: `swarm.${key} is not an allowed field`, status: 400 };
    }
  }
  const { task_id, agent_id, role, subtask_goal, child_trace_ids, fan_in, rollup, merge_strategy, parent_trace_id, cua_payload } = swarm;

  if (task_id !== undefined && task_id !== null && typeof task_id !== 'string') {
    return { ok: false, error: 'swarm.task_id must be a string', status: 400 };
  }
  if (agent_id !== undefined && agent_id !== null && typeof agent_id !== 'string') {
    return { ok: false, error: 'swarm.agent_id must be a string', status: 400 };
  }
  if (role !== undefined && role !== null && typeof role !== 'string') {
    return { ok: false, error: 'swarm.role must be a string', status: 400 };
  }
  if (subtask_goal !== undefined && subtask_goal !== null && typeof subtask_goal !== 'string') {
    return { ok: false, error: 'swarm.subtask_goal must be a string', status: 400 };
  }
  if (merge_strategy !== undefined && merge_strategy !== null && typeof merge_strategy !== 'string') {
    return { ok: false, error: 'swarm.merge_strategy must be a string', status: 400 };
  }
  if (parent_trace_id !== undefined && parent_trace_id !== null && typeof parent_trace_id !== 'string') {
    return { ok: false, error: 'swarm.parent_trace_id must be a string', status: 400 };
  }
  if (fan_in !== undefined && typeof fan_in !== 'boolean') {
    return { ok: false, error: 'swarm.fan_in must be a boolean', status: 400 };
  }
  if (rollup !== undefined && typeof rollup !== 'boolean') {
    return { ok: false, error: 'swarm.rollup must be a boolean', status: 400 };
  }
  if (child_trace_ids !== undefined && child_trace_ids !== null) {
    if (!Array.isArray(child_trace_ids)) {
      return { ok: false, error: 'swarm.child_trace_ids must be an array of strings', status: 400 };
    }
    if (child_trace_ids.length > SWARM_MAX_CHILD_TRACE_IDS) {
      return {
        ok: false,
        error: `swarm.child_trace_ids exceeds max of ${SWARM_MAX_CHILD_TRACE_IDS}`,
        status: 400,
      };
    }
    for (let i = 0; i < child_trace_ids.length; i += 1) {
      if (typeof child_trace_ids[i] !== 'string' || !child_trace_ids[i]) {
        return { ok: false, error: 'swarm.child_trace_ids must contain only non-empty strings', status: 400 };
      }
    }
  }

  // SCUAS Hardware-Symbiosis: Protect against OS command injections and UI override attacks
  if (cua_payload !== undefined && cua_payload !== null) {
    if (typeof cua_payload !== 'object' || Array.isArray(cua_payload)) {
      return { ok: false, error: 'swarm.cua_payload must be an object', status: 400 };
    }
    const maliciousOverrides = ['format', 'rm -rf', 'execute_binary', 'shell'];
    if (cua_payload.action && typeof cua_payload.action === 'string') {
      if (maliciousOverrides.some(cmd => cua_payload.action.includes(cmd))) {
         return { ok: false, error: `swarm.cua_payload contains a forbidden destructive override attack: ${cua_payload.action}`, status: 403 };
      }
    }
  }

  return { ok: true };
}

/**
 * Attach a small correlation block to receipts (additionalProperties allowed on requestReceipt).
 * @param {object} receipt
 * @param {object|null|undefined} swarmPayload
 */
export function attachSwarmToReceipt(receipt, swarmPayload) {
  if (!receipt || !swarmPayload || !isNonEmptyString(swarmPayload.task_id)) return;
  receipt.swarm = {
    task_id: swarmPayload.task_id,
    agent_id: swarmPayload.agent_id ?? null,
    role: swarmPayload.role != null ? String(swarmPayload.role) : null,
  };
}

/**
 * @param {object} params
 * @param {string} params.trace_id
 * @param {object|null|undefined} params.swarmPayload
 * @param {{ preview_only?: boolean, cache_hit_l1?: boolean, cache_hit_l2?: boolean }} params.flags
 */
export function emitSwarmAssignmentMetric({ trace_id, swarmPayload, flags = {} }) {
  if (!swarmPayload || typeof swarmPayload.task_id !== 'string' || !swarmPayload.task_id) return Promise.resolve();
  const line = {
    event: 'freeai_swarm_assignment',
    route: '/v1/infer',
    trace_id,
    swarm_task_id: swarmPayload.task_id,
    swarm_agent_id: swarmPayload.agent_id ?? null,
    swarm_role: swarmPayload.role != null ? String(swarmPayload.role) : null,
    preview_only: !!flags.preview_only,
    cache_hit_l1: !!flags.cache_hit_l1,
    cache_hit_l2: !!flags.cache_hit_l2,
  };
  if (Array.isArray(swarmPayload.child_trace_ids) && swarmPayload.child_trace_ids.length) {
    line.child_trace_ids = swarmPayload.child_trace_ids;
  }
  return emitMetric(line);
}
