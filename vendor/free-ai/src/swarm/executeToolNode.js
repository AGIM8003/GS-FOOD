import { getTool } from './toolRegistry.js';
import { evaluatePolicy } from '../policy/policyFabric.js';

/**
 * @param {object} params
 * @param {object} params.node - tool_node definition
 * @param {object} params.predecessorOutputs
 * @returns {Promise<{ok: boolean, output: any, policy_result: object, duration_ms: number}>}
 */
export async function executeToolNodeV1({ node, predecessorOutputs }) {
  const t0 = Date.now();
  const config = node.config || {};
  const tool_id = config.tool_id;
  const timeout_ms = config.timeout_ms || 5000;
  const allow_network = config.allow_network === true;
  const allow_filesystem = config.allow_filesystem === true;

  const tool = getTool(tool_id);
  if (!tool) {
    return {
      ok: false,
      output: null,
      error: `tool_not_found: ${tool_id}`,
      policy_result: null,
      duration_ms: Date.now() - t0,
    };
  }

  const policyResult = evaluatePolicy('tool_execution', {
    tool_id,
    tool_class: tool.tool_class,
    allow_network,
    allow_filesystem,
  });

  if (policyResult.decision === 'deny') {
    return {
      ok: false,
      output: null,
      error: `tool_policy_denied: ${policyResult.reason_code}`,
      policy_result: policyResult,
      duration_ms: Date.now() - t0,
    };
  }

  const tool_input = config.tool_input || predecessorOutputs || {};

  try {
    const result = await Promise.race([
      Promise.resolve(tool.execute(tool_input)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('tool_execution_timeout')), timeout_ms),
      ),
    ]);

    if (config.expected_output_contract) {
      const contract = config.expected_output_contract;
      if (typeof contract === 'object' && contract.required_fields) {
        for (const field of contract.required_fields) {
          if (result == null || result[field] === undefined) {
            return {
              ok: false,
              output: result,
              error: `output_contract_violation: missing field '${field}'`,
              policy_result: policyResult,
              duration_ms: Date.now() - t0,
            };
          }
        }
      }
    }

    return {
      ok: true,
      output: result,
      policy_result: policyResult,
      duration_ms: Date.now() - t0,
    };
  } catch (err) {
    return {
      ok: false,
      output: null,
      error: err?.message || String(err),
      policy_result: policyResult,
      duration_ms: Date.now() - t0,
    };
  }
}
