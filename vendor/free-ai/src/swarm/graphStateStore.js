/** @typedef {import('./transitionReducer.js').RunState} RunState */

import { assertRunTransition } from './transitionReducer.js';
import { isValidSwarmReceiptV1 } from './swarmReceiptSchema.js';
import { computeReceiptHmac } from './receiptChainHmac.js';
import * as persist from './swarmRunPersistence.js';

/** @type {Map<string, object>} */
const runs = new Map();

/** @type {Map<string, Array<object>>} run_id -> array of state snapshots */
const snapshots = new Map();

let diskLoadedOnce = false;

function nowIso() {
  return new Date().toISOString();
}

function syncRunToDisk(runId) {
  const r = runs.get(runId);
  if (!r || !persist.isSwarmPersistenceEnabled()) return;
  r.durable_revision = (r.durable_revision || 0) + 1;
  persist.writeRunRecordAtomic(r);
}

/**
 * Load persisted runs from disk into the in-memory map (merge by run_id).
 * Called once at server startup when persistence is enabled.
 */
export function initializeSwarmStoreFromDisk() {
  if (!persist.isSwarmPersistenceEnabled() || diskLoadedOnce) return;
  diskLoadedOnce = true;
  for (const rec of persist.loadAllRunRecords()) {
    runs.set(rec.run_id, rec);
  }
}

/**
 * Test helper: clear memory and reload from disk (same process).
 */
export function __reloadSwarmStoreFromDiskForTests() {
  runs.clear();
  diskLoadedOnce = false;
  initializeSwarmStoreFromDisk();
}

/**
 * @param {object} graphBody validated swarm graph request body
 * @param {string} graph_hash
 * @param {string} run_id
 */
export function createRun(graphBody, graph_hash, run_id, opts = {}) {
  const node_states = {};
  for (const n of graphBody.nodes) {
    node_states[n.node_id] = 'pending';
  }
  const rec = {
    schema_version: 'freeaiSwarmRunRecord.v2',
    run_id,
    graph_id: graphBody.graph_id,
    graph_name: graphBody.graph_name,
    graph_hash,
    run_state: 'created',
    node_states,
    created_at: nowIso(),
    updated_at: nowIso(),
    final_output: null,
    error_summary: null,
    receipts: [],
    node_outputs: {},
    execution_checkpoint: null,
    failed_at_node_id: null,
    resume_eligible: false,
    tenant_id: opts.tenant_id || null,
    durable_revision: 0,
    receipt_mode: graphBody.receipt_mode || 'full',
    graph_snapshot: {
      graph_id: graphBody.graph_id,
      graph_name: graphBody.graph_name,
      entry_node_id: graphBody.entry_node_id,
      receipt_mode: graphBody.receipt_mode,
      input_payload: graphBody.input_payload,
      nodes: graphBody.nodes.map((n) => ({
        node_id: n.node_id,
        node_type: n.node_type,
        role_id: n.role_id,
        task_lane: n.task_lane,
        config: n.config,
      })),
      edges: graphBody.edges,
    },
  };
  runs.set(run_id, rec);
  syncRunToDisk(run_id);
  return rec;
}

export function getRun(runId) {
  return runs.get(runId) || null;
}

export function listRuns() {
  return [...runs.values()].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

export function appendReceipt(runId, receipt) {
  const r = runs.get(runId);
  if (!r) throw new Error('run_not_found');
  if (!isValidSwarmReceiptV1(receipt)) {
    throw new Error('invalid_receipt: receipt fails schema validation');
  }
  const mode = r.receipt_mode || 'full';
  if (mode === 'none') return;

  const previousHmac = r.receipts.length > 0 ? r.receipts[r.receipts.length - 1].chain_hmac || null : null;
  receipt.chain_hmac = computeReceiptHmac(receipt, previousHmac);

  if (mode === 'summary') {
    r.receipts.push({
      receipt_id: receipt.receipt_id,
      receipt_type: receipt.receipt_type,
      run_id: receipt.run_id,
      graph_id: receipt.graph_id,
      node_id: receipt.node_id,
      status: receipt.status,
      timestamp: receipt.timestamp,
      inputs_hash: receipt.inputs_hash,
      outputs_hash: receipt.outputs_hash,
      duration_ms: receipt.duration_ms,
      summary: receipt.summary,
      chain_hmac: receipt.chain_hmac,
    });
  } else {
    r.receipts.push(receipt);
  }
  r.updated_at = nowIso();
  syncRunToDisk(runId);
}

export function updateNodeState(runId, nodeId, nextState) {
  const r = runs.get(runId);
  if (!r) throw new Error('run_not_found');
  r.node_states[nodeId] = nextState;
  r.updated_at = nowIso();
  syncRunToDisk(runId);
}

export function setRunState(runId, nextState) {
  const r = runs.get(runId);
  if (!r) throw new Error('run_not_found');
  r.run_state = nextState;
  r.updated_at = nowIso();
  syncRunToDisk(runId);
}

export function setNodeOutput(runId, nodeId, output) {
  const r = runs.get(runId);
  if (!r) throw new Error('run_not_found');
  r.node_outputs[nodeId] = output;
  r.updated_at = nowIso();
  syncRunToDisk(runId);
}

/**
 * Persist run-level integrity metadata (header, merkle seal, signed envelope).
 */
export function setRunIntegrityArtifacts(runId, artifacts) {
  const r = runs.get(runId);
  if (!r) throw new Error('run_not_found');
  r.integrity_artifacts = {
    ...(r.integrity_artifacts || {}),
    ...(artifacts || {}),
  };
  r.updated_at = nowIso();
  syncRunToDisk(runId);
}

/**
 * Last successfully completed node_id in topo order (replay-oriented metadata).
 * Also captures a time-travel snapshot for debugging.
 */
export function setExecutionCheckpoint(runId, nodeId) {
  const r = runs.get(runId);
  if (!r) return;
  r.execution_checkpoint = nodeId;
  r.updated_at = nowIso();

  if (!snapshots.has(runId)) snapshots.set(runId, []);
  snapshots.get(runId).push({
    snapshot_id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    checkpoint_node_id: nodeId,
    timestamp: nowIso(),
    run_state: r.run_state,
    node_states: { ...r.node_states },
    node_outputs: { ...r.node_outputs },
    receipts_count: r.receipts.length,
  });

  syncRunToDisk(runId);
}

export function getSnapshots(runId) {
  return snapshots.get(runId) || [];
}

export function getSnapshotByIndex(runId, index) {
  const snaps = snapshots.get(runId);
  if (!snaps || index < 0 || index >= snaps.length) return null;
  return snaps[index];
}

/**
 * Rewind a run to a previous snapshot, restoring node states and outputs.
 * Only allowed on failed or resumable runs.
 */
export function rewindToSnapshot(runId, snapshotIndex) {
  const r = runs.get(runId);
  if (!r) return { ok: false, error: 'run_not_found' };
  if (!['failed', 'resumable'].includes(r.run_state)) {
    return { ok: false, error: `cannot_rewind_from_state:${r.run_state}` };
  }
  const snap = getSnapshotByIndex(runId, snapshotIndex);
  if (!snap) return { ok: false, error: 'snapshot_not_found' };

  r.node_states = { ...snap.node_states };
  r.node_outputs = { ...snap.node_outputs };
  r.execution_checkpoint = snap.checkpoint_node_id;
  r.failed_at_node_id = null;
  r.error_summary = null;
  r.resume_eligible = true;
  r.updated_at = nowIso();
  r.rewound_to_snapshot = snap.snapshot_id;
  syncRunToDisk(runId);

  return { ok: true, snapshot_id: snap.snapshot_id, checkpoint_node_id: snap.checkpoint_node_id };
}

export function setFailedAtNode(runId, nodeId) {
  const r = runs.get(runId);
  if (!r) return;
  r.failed_at_node_id = nodeId;
  r.resume_eligible = !!(nodeId && r.execution_checkpoint);
  r.updated_at = nowIso();
  syncRunToDisk(runId);
}

export function finalizeRun(runId, finalOutput) {
  const r = runs.get(runId);
  if (!r) throw new Error('run_not_found');
  assertRunTransition(r.run_state, 'completed');
  r.final_output = finalOutput;
  r.run_state = 'completed';
  r.resume_eligible = false;
  r.updated_at = nowIso();
  syncRunToDisk(runId);
}

export function failRun(runId, errorSummary) {
  const r = runs.get(runId);
  if (!r) throw new Error('run_not_found');
  if (r.run_state === 'completed') return;
  if (r.run_state === 'failed') {
    r.error_summary = String(errorSummary || r.error_summary || 'failed');
    r.updated_at = nowIso();
    syncRunToDisk(runId);
    return;
  }
  assertRunTransition(r.run_state, 'failed');
  r.error_summary = String(errorSummary || 'failed');
  r.run_state = 'failed';
  r.updated_at = nowIso();
  syncRunToDisk(runId);
}

function aggregateFromRuns() {
  let node_executions_total = 0;
  let merges_total = 0;
  for (const r of runs.values()) {
    for (const rc of r.receipts || []) {
      if (rc.receipt_type === 'node_receipt') node_executions_total += 1;
      else if (rc.receipt_type === 'merge_receipt') {
        node_executions_total += 1;
        merges_total += 1;
      } else if (rc.receipt_type === 'final_receipt') {
        node_executions_total += 1;
      }
    }
  }
  return {
    runs_total: runs.size,
    runs_completed: [...runs.values()].filter((x) => x.run_state === 'completed').length,
    runs_failed: [...runs.values()].filter((x) => x.run_state === 'failed').length,
    node_executions_total,
    merges_total,
  };
}

export function getGraphSummary() {
  const a = aggregateFromRuns();
  return {
    ...a,
    persistence_enabled: persist.isSwarmPersistenceEnabled(),
    persistence_dir: persist.isSwarmPersistenceEnabled() ? persist.getSwarmRunsDir() : null,
  };
}

/**
 * Test isolation — clears in-memory map and optionally on-disk JSON when persistence is on.
 */
export function __resetSwarmStoreForTests() {
  runs.clear();
  snapshots.clear();
  diskLoadedOnce = false;
  if (persist.isSwarmPersistenceEnabled()) {
    try {
      persist.clearSwarmRunsDiskForTests();
    } catch {
      /* ignore */
    }
  }
}
