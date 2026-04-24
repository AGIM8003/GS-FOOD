/**
 * Schema Registry & API Versioning.
 *
 * Centralized registry of all graph schema versions with migration guidance.
 * Tracks backward compatibility and provides version-negotiation utilities.
 */

const SCHEMA_VERSIONS = [
  { version: 'v1', released: '2024-12-01', features: ['prompt_node', 'merge_node', 'finalization_node'], deprecated: false },
  { version: 'v2', released: '2025-01-15', features: ['durable_persistence', 'receipt_chain'], deprecated: false },
  { version: 'v3', released: '2025-03-01', features: ['human_review_node', 'tool_node', 'policy_fabric', 'replay_resume'], deprecated: false },
  { version: 'v4', released: '2025-06-01', features: ['conditional_edges', 'cycles', 'subgraph_node', 'router_node', 'parallel_execution', 'streaming', 'guardrails'], deprecated: false },
  { version: 'v5', released: '2025-09-01', features: ['resilience', 'map_reduce_node', 'lifecycle_hooks', 'node_metrics', 'json_schema_validation'], deprecated: false },
];

function getSchemaVersion(version) {
  return SCHEMA_VERSIONS.find((v) => v.version === version) || null;
}

function getLatestSchemaVersion() {
  const active = SCHEMA_VERSIONS.filter((v) => !v.deprecated);
  return active[active.length - 1] || null;
}

function isVersionCompatible(requested, current) {
  const versions = SCHEMA_VERSIONS.map((v) => v.version);
  const reqIdx = versions.indexOf(requested);
  const curIdx = versions.indexOf(current);
  if (reqIdx < 0 || curIdx < 0) return { compatible: false, reason: 'unknown_version' };
  return { compatible: curIdx >= reqIdx, reason: curIdx >= reqIdx ? 'ok' : 'version_too_old' };
}

function getMigrationPath(from, to) {
  const versions = SCHEMA_VERSIONS.map((v) => v.version);
  const fromIdx = versions.indexOf(from);
  const toIdx = versions.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return { ok: false, error: 'unknown_version' };
  if (fromIdx >= toIdx) return { ok: true, steps: [], message: 'already_at_or_above_target' };
  const steps = [];
  for (let i = fromIdx; i < toIdx; i++) {
    steps.push({ from: versions[i], to: versions[i + 1], new_features: SCHEMA_VERSIONS[i + 1].features });
  }
  return { ok: true, steps };
}

function listSchemaVersions() {
  return SCHEMA_VERSIONS.map((v) => ({ ...v }));
}

export { getSchemaVersion, getLatestSchemaVersion, isVersionCompatible, getMigrationPath, listSchemaVersions, SCHEMA_VERSIONS };
