/**
 * API Contract Testing.
 *
 * Validates that every admin and run endpoint returns the expected
 * response shape. Run as part of the CI pipeline.
 */

const CONTRACT_REGISTRY = [
  { path: '/health', method: 'GET', expected: { fields: ['status', 'version'], status_code: 200 } },
  { path: '/admin/swarm-graph-schemas', method: 'GET', expected: { fields: ['schemas'], status_code: 200 } },
  { path: '/admin/swarm-runs', method: 'GET', expected: { fields: ['runs'], status_code: 200 } },
  { path: '/admin/swarm-policy-zones', method: 'GET', expected: { fields: ['zones'], status_code: 200 } },
  { path: '/admin/swarm-circuit-breakers', method: 'GET', expected: { fields: ['breakers', 'count'], status_code: 200 } },
  { path: '/admin/swarm-lifecycle-hooks', method: 'GET', expected: { fields: ['hooks'], status_code: 200 } },
  { path: '/swarm/run', method: 'POST', expected: { fields: ['run_id'], status_code: 200 } },
];

function validateResponseContract(path, method, responseBody, statusCode) {
  const contract = CONTRACT_REGISTRY.find((c) => c.path === path && c.method === method);
  if (!contract) return { valid: true, reason: 'no_contract_defined' };

  const errors = [];

  if (contract.expected.status_code && statusCode !== contract.expected.status_code) {
    errors.push(`expected status ${contract.expected.status_code}, got ${statusCode}`);
  }

  if (contract.expected.fields && responseBody && typeof responseBody === 'object') {
    for (const field of contract.expected.fields) {
      if (!(field in responseBody)) {
        errors.push(`missing required field: ${field}`);
      }
    }
  }

  return { valid: errors.length === 0, errors, path, method };
}

function getContractRegistry() {
  return CONTRACT_REGISTRY.slice();
}

function addContract(contract) {
  CONTRACT_REGISTRY.push(contract);
}

export { validateResponseContract, getContractRegistry, addContract, CONTRACT_REGISTRY };
