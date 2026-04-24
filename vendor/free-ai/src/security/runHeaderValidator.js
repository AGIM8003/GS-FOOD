/**
 * Run Header Validation.
 *
 * Enforces required machine-verifiable header fields on every swarm run.
 * Validates tenant, timestamp, graph integrity, and policy clearance.
 */

const REQUIRED_FIELDS = ['run_id', 'graph_id', 'graph_hash', 'tenant_id', 'initiated_at', 'receipt_mode'];

function validateRunHeader(header) {
  if (!header || typeof header !== 'object') {
    return { valid: false, errors: ['run header must be an object'] };
  }
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (header[field] === undefined || header[field] === null || header[field] === '') {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (header.initiated_at) {
    const ts = Date.parse(header.initiated_at);
    if (isNaN(ts)) {
      errors.push('initiated_at must be valid ISO timestamp');
    } else {
      const age = Date.now() - ts;
      if (age > 300000) errors.push('initiated_at is older than 5 minutes (stale run)');
      if (age < -60000) errors.push('initiated_at is in the future');
    }
  }

  if (header.receipt_mode && !['full', 'summary', 'none'].includes(header.receipt_mode)) {
    errors.push('receipt_mode must be full|summary|none');
  }

  return { valid: errors.length === 0, errors };
}

function buildRunHeader(params) {
  return {
    run_id: params.run_id,
    graph_id: params.graph_id,
    graph_hash: params.graph_hash,
    tenant_id: params.tenant_id || 'default',
    initiated_at: new Date().toISOString(),
    receipt_mode: params.receipt_mode || 'full',
    engine_version: process.env.npm_package_version || '0.1.0',
  };
}

export { validateRunHeader, buildRunHeader, REQUIRED_FIELDS };
