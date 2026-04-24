import { evaluatePolicy } from '../policy/policyFabric.js';
import { buildSwarmReceiptV1 } from './writeSwarmReceipt.js';
import * as store from './graphStateStore.js';
import { assertRunTransition, assertNodeTransition } from './transitionReducer.js';
import { NODE_TYPE_PROMPT, NODE_TYPE_MERGE, NODE_TYPE_FINAL, NODE_TYPE_TOOL, NODE_TYPE_HUMAN_REVIEW } from './nodeSchema.js';
import { executeMergeV1 } from './mergeExecutor.js';
import { executePromptNodeV1 } from './nodeExecutor.js';
import { executeToolNodeV1 } from './executeToolNode.js';
import { createReview } from './humanReviewGate.js';
import { emitExecutionEvent } from './executionStream.js';
import { executeMapReduce } from './mapReduce.js';

function topologicalOrder(nodes, edges) {
  const ids = nodes.map((n) => n.node_id);
  const idSet = new Set(ids);
  const inc = new Map(ids.map((id) => [id, 0]));
  const adj = new Map(ids.map((id) => [id, []]));
  for (const e of edges) {
    if (!idSet.has(e.from_node_id) || !idSet.has(e.to_node_id)) continue;
    adj.get(e.from_node_id).push(e.to_node_id);
    inc.set(e.to_node_id, (inc.get(e.to_node_id) || 0) + 1);
  }
  const q = ids.filter((id) => inc.get(id) === 0).sort((a, b) => a.localeCompare(b));
  const order = [];
  while (q.length) {
    const u = q.shift();
    order.push(u);
    for (const v of adj.get(u) || []) {
      inc.set(v, inc.get(v) - 1);
      if (inc.get(v) === 0) {
        q.push(v);
        q.sort((a, b) => a.localeCompare(b));
      }
    }
  }
  return order;
}

function buildReplayExecutionPlan(graph, checkpointNodeId) {
  const allowCycles = graph?.allow_cycles === true;
  const maxIterations = Math.max(1, Number(graph?.max_iterations || 1));
  if (!allowCycles) {
    const order = topologicalOrder(graph.nodes, graph.edges);
    const checkpointIdx = order.indexOf(checkpointNodeId);
    const resumeFrom = checkpointIdx >= 0 ? checkpointIdx + 1 : 0;
    return order.slice(resumeFrom).map((nodeId) => ({ nodeId, iteration: null }));
  }
  const nodeOrder = graph.nodes.map((n) => n.node_id);
  const plan = [];
  for (let i = 0; i < maxIterations; i += 1) {
    for (const nodeId of nodeOrder) {
      plan.push({ nodeId, iteration: i + 1 });
    }
  }
  return plan;
}

/**
 * @param {string} runId
 * @param {object} opts
 * @param {string} [opts.resumed_by]
 * @param {string} [opts.resume_reason]
 * @param {(ctx: object) => Promise<{output: string, meta?: object}>} opts.executePromptNode
 */
export async function replayRunFromCheckpoint(runId, opts) {
  const { resumed_by, resume_reason, executePromptNode } = opts;
  const run = store.getRun(runId);
  if (!run) return { ok: false, error: 'run_not_found' };
  emitExecutionEvent(runId, { event: 'run_resume_requested', run_state: run.run_state });

  const policyResult = evaluatePolicy('resume_execution', { run });

  const policyReceipt = buildSwarmReceiptV1({
    receipt_type: 'policy_receipt',
    run_id: runId,
    graph_id: run.graph_id,
    node_id: null,
    status: policyResult.decision === 'allow' ? 'ok' : 'blocked',
    summary: policyResult.summary,
    inputs: { policy_zone: 'resume_execution', run_state: run.run_state },
    outputs: { decision: policyResult.decision, reason_code: policyResult.reason_code },
    duration_ms: 0,
  });
  store.appendReceipt(runId, policyReceipt);

  if (policyResult.decision === 'deny') {
    return { ok: false, error: `resume_policy_denied: ${policyResult.reason_code}`, policy_result: policyResult };
  }

  const snap = run.graph_snapshot;
  if (!snap || !snap.nodes || !snap.edges) {
    return { ok: false, error: 'missing_graph_snapshot' };
  }

  assertRunTransition(run.run_state, 'resumable');
  store.setRunState(runId, 'resumable');
  assertRunTransition('resumable', 'resumed');
  store.setRunState(runId, 'resumed');

  run.durable_revision = (run.durable_revision || 0) + 1;
  run.resumed_from_checkpoint = run.execution_checkpoint;
  run.resumed_at = new Date().toISOString();
  run.resumed_by = resumed_by || null;
  run.resume_reason = resume_reason || null;

  const resumeReceipt = buildSwarmReceiptV1({
    receipt_type: 'resume_receipt',
    run_id: runId,
    graph_id: run.graph_id,
    node_id: null,
    status: 'ok',
    summary: `Resumed from checkpoint ${run.execution_checkpoint}`,
    inputs: { checkpoint: run.execution_checkpoint, resumed_by, resume_reason },
    outputs: { durable_revision: run.durable_revision },
    duration_ms: 0,
  });
  store.appendReceipt(runId, resumeReceipt);

  assertRunTransition('resumed', 'running');
  store.setRunState(runId, 'running');
  emitExecutionEvent(runId, { event: 'run_resumed', resumed_from_checkpoint: run.execution_checkpoint });

  const byId = new Map(snap.nodes.map((n) => [n.node_id, n]));
  const preds = new Map(snap.nodes.map((n) => [n.node_id, []]));
  for (const e of snap.edges) {
    if (preds.has(e.to_node_id)) preds.get(e.to_node_id).push(e.from_node_id);
  }

  const remainingNodes = buildReplayExecutionPlan(snap, run.execution_checkpoint);

  let currentNodeId = null;
  try {
    for (const step of remainingNodes) {
      const nodeId = step.nodeId;
      currentNodeId = nodeId;
      const node = byId.get(nodeId);
      if (!node) throw new Error(`node_not_in_snapshot: ${nodeId}`);
      emitExecutionEvent(runId, { event: 'node_started', node_id: nodeId, node_type: node.node_type, resumed: true, iteration: step.iteration });

      const currentState = run.node_states[nodeId];
      if (currentState === 'completed') continue;

      if (currentState === 'failed') {
        assertNodeTransition('failed', 'resumed');
        store.updateNodeState(runId, nodeId, 'resumed');
        assertNodeTransition('resumed', 'running');
        store.updateNodeState(runId, nodeId, 'running');
      } else if (currentState === 'pending') {
        assertNodeTransition('pending', 'admitted');
        store.updateNodeState(runId, nodeId, 'admitted');
        assertNodeTransition('admitted', 'running');
        store.updateNodeState(runId, nodeId, 'running');
      } else {
        store.updateNodeState(runId, nodeId, 'running');
      }

      if (node.node_type === NODE_TYPE_PROMPT) {
        const predList = preds.get(nodeId) || [];
        const predecessorOutputs = {};
        for (const p of predList) {
          predecessorOutputs[p] = store.getRun(runId).node_outputs[p] ?? '';
        }
        const { output } = await executePromptNodeV1(
          { runId, graphBody: snap, node, predecessorOutputs, input_payload: snap.input_payload },
          executePromptNode,
        );
        store.setNodeOutput(runId, nodeId, output);
        store.updateNodeState(runId, nodeId, 'completed');
        store.setExecutionCheckpoint(runId, nodeId);

        const nr = buildSwarmReceiptV1({
          receipt_type: 'node_receipt',
          run_id: runId,
          graph_id: run.graph_id,
          node_id: nodeId,
          status: 'ok',
          summary: 'prompt_node completed (resumed)',
          inputs: { predecessorOutputs },
          outputs: { output_len: output.length },
          duration_ms: 0,
        });
        store.appendReceipt(runId, nr);
        emitExecutionEvent(runId, { event: 'node_finished', node_id: nodeId, node_state: 'completed', resumed: true, iteration: step.iteration });
      } else if (node.node_type === NODE_TYPE_MERGE) {
        const predIds = preds.get(nodeId) || [];
        const branches = predIds.map((pid) => {
          const r = store.getRun(runId);
          const st = r.node_states[pid];
          const out = r.node_outputs[pid];
          const ok = st === 'completed' && typeof out === 'string';
          return { node_id: pid, output: ok ? out : '', ok };
        });
        const strategy = node.config.merge_strategy;
        const priority = strategy === 'deterministic_priority' ? node.config.priority : null;
        const merged = executeMergeV1({ strategy, priority, branches });
        if (!merged.ok) {
          store.updateNodeState(runId, nodeId, 'failed');
          throw new Error(merged.reason || 'merge_failed');
        }
        store.setNodeOutput(runId, nodeId, merged.value);
        store.updateNodeState(runId, nodeId, 'completed');
        store.setExecutionCheckpoint(runId, nodeId);

        const mr = buildSwarmReceiptV1({
          receipt_type: 'merge_receipt',
          run_id: runId,
          graph_id: run.graph_id,
          node_id: nodeId,
          status: 'ok',
          summary: `picked:${merged.picked_branch} (resumed)`,
          inputs: { strategy },
          outputs: { picked_branch: merged.picked_branch },
          duration_ms: 0,
        });
        store.appendReceipt(runId, mr);
        emitExecutionEvent(runId, { event: 'node_finished', node_id: nodeId, node_state: 'completed', resumed: true, iteration: step.iteration });
      } else if (node.node_type === NODE_TYPE_FINAL) {
        const predList = preds.get(nodeId) || [];
        const pred0 = predList[0];
        const accepted = pred0 ? store.getRun(runId).node_outputs[pred0] : '';
        const final_output = {
          text: typeof accepted === 'string' ? accepted : '',
          graph_id: run.graph_id,
          graph_hash: run.graph_hash,
          graph_name: snap.graph_name,
        };

        const fr = buildSwarmReceiptV1({
          receipt_type: 'final_receipt',
          run_id: runId,
          graph_id: run.graph_id,
          node_id: nodeId,
          status: 'ok',
          summary: 'finalization completed (resumed)',
          inputs: { pred: pred0 },
          outputs: { final_len: final_output.text.length },
          duration_ms: 0,
        });
        store.appendReceipt(runId, fr);
        store.updateNodeState(runId, nodeId, 'completed');
        store.setExecutionCheckpoint(runId, nodeId);
        store.finalizeRun(runId, final_output);
        emitExecutionEvent(runId, { event: 'run_completed', run_state: 'completed', resumed: true });
        return {
          ok: true,
          run_id: runId,
          run_state: 'completed',
          resumed: true,
          resumed_from_checkpoint: run.resumed_from_checkpoint,
          final_output,
          receipts_count: store.getRun(runId).receipts.length,
        };
      } else if (node.node_type === NODE_TYPE_TOOL) {
        const predList = preds.get(nodeId) || [];
        const predecessorOutputs = {};
        for (const p of predList) {
          predecessorOutputs[p] = store.getRun(runId).node_outputs[p] ?? '';
        }
        const toolResult = await executeToolNodeV1({ node, predecessorOutputs });
        if (!toolResult.ok) {
          store.updateNodeState(runId, nodeId, 'failed');
          throw new Error(toolResult.error || 'tool_node_failed');
        }
        store.setNodeOutput(runId, nodeId, typeof toolResult.output === 'string' ? toolResult.output : JSON.stringify(toolResult.output));
        store.updateNodeState(runId, nodeId, 'completed');
        store.setExecutionCheckpoint(runId, nodeId);
        emitExecutionEvent(runId, { event: 'node_finished', node_id: nodeId, node_state: 'completed', resumed: true, iteration: step.iteration });
      } else if (node.node_type === NODE_TYPE_HUMAN_REVIEW) {
        const review = createReview({
          run_id: runId,
          node_id: nodeId,
          requested_action: node.config.requested_action,
          tenant_id: run.tenant_id || null,
        });
        store.updateNodeState(runId, nodeId, 'waiting_human_review');
        store.setRunState(runId, 'paused_for_review');
        emitExecutionEvent(runId, { event: 'run_paused_for_review', node_id: nodeId, review_id: review.review_id, resumed: true });
        return {
          ok: false,
          run_id: runId,
          run_state: 'paused_for_review',
          paused_at_node: nodeId,
          review_id: review.review_id,
          resumed: true,
        };
      } else if (node.node_type === NODE_TYPE_MAP_REDUCE) {
        const predList = preds.get(nodeId) || [];
        const predecessorOutputs = {};
        for (const p of predList) {
          predecessorOutputs[p] = store.getRun(runId).node_outputs[p] ?? '';
        }
        const input = Object.values(predecessorOutputs).join('\n');
        const workerFn = async (workItem) => {
          const { output: wo } = await executePromptNodeV1(
            { runId, graphBody: snap, node: { ...node, node_type: NODE_TYPE_PROMPT }, predecessorOutputs: { _work_item: typeof workItem === 'string' ? workItem : JSON.stringify(workItem) }, input_payload: snap.input_payload },
            executePromptNode,
          );
          return { ok: true, output: wo };
        };
        const mrResult = await executeMapReduce({ config: node.config, input, workerFn });
        if (!mrResult.ok) {
          store.updateNodeState(runId, nodeId, 'failed');
          throw new Error(mrResult.error || 'map_reduce_failed');
        }
        store.setNodeOutput(runId, nodeId, mrResult.output || '');
        store.updateNodeState(runId, nodeId, 'completed');
        store.setExecutionCheckpoint(runId, nodeId);
        emitExecutionEvent(runId, { event: 'node_finished', node_id: nodeId, node_state: 'completed', resumed: true, iteration: step.iteration });
      }
    }

    throw new Error(snap?.allow_cycles ? 'max_iterations_exhausted_without_finalization' : 'finalization_node_not_reached');
  } catch (err) {
    const r = store.getRun(runId);
    if (r && r.run_state !== 'completed') {
      if (currentNodeId && !r.failed_at_node_id) {
        store.setFailedAtNode(runId, currentNodeId);
      }
      store.failRun(runId, err?.message || String(err));
    }
    emitExecutionEvent(runId, { event: 'run_failed', error: err?.message || String(err), resumed: true });
    return {
      ok: false,
      run_id: runId,
      run_state: store.getRun(runId)?.run_state || 'failed',
      error: err?.message || String(err),
      resumed: true,
    };
  }
}
