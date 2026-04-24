import { validateSwarmGraphV1 } from '../../swarm/graphSchema.js';
import { validateSwarmRunEnvelopeV1 } from './swarmRunRequestSchema.js';

/**
 * Strict validation for POST /v1/swarm/run (always-on; no env bypass).
 * @param {unknown} body
 * @returns {{ ok: true, graph: object } | { ok: false, errors: string[] }}
 */
export function validateSwarmRunRequest(body) {
  const envErrs = validateSwarmRunEnvelopeV1(body);
  const graphRes = validateSwarmGraphV1(body);
  const errors = [...(graphRes.ok ? [] : graphRes.errors), ...envErrs];
  if (errors.length) return { ok: false, errors };
  return { ok: true, graph: graphRes.graph };
}
