import crypto from 'crypto';
import { NODE_TYPE_PROMPT, NODE_TYPE_MERGE, NODE_TYPE_FINAL, NODE_TYPE_TOOL, NODE_TYPE_HUMAN_REVIEW, NODE_TYPE_SUBGRAPH, NODE_TYPE_ROUTER, NODE_TYPE_MAP_REDUCE } from './nodeSchema.js';
import { edgeIsConditional } from './edgeSchema.js';
import { computeGraphHashV1 } from './graphHash.js';
import { assertRunTransition, assertNodeTransition } from './transitionReducer.js';
import { buildSwarmReceiptV1 } from './writeSwarmReceipt.js';
import { executeMergeV1 } from './mergeExecutor.js';
import { executePromptNodeV1 } from './nodeExecutor.js';
import { executeToolNodeV1 } from './executeToolNode.js';
import { executeMapReduce } from './mapReduce.js';
import { createReview } from './humanReviewGate.js';
import { evaluatePolicy } from '../policy/policyFabric.js';
import { tracer } from '../telemetry/tracer.js';
import { runBeforeHooks, runAfterHooks, runErrorHooks, runRetryHooks } from './lifecycleHooks.js';
import { startNodeMetric, endNodeMetric } from './nodeMetrics.js';
import { validateNodeInputSchema, validateNodeOutputSchema } from './schemaValidator.js';
import { validateInputGuardrail, validateOutputGuardrail } from './guardrails.js';
import { executeWithResilience, clearRetryBudget } from './resilience.js';
import { emitExecutionEvent } from './executionStream.js';
import { enforceInjectionGate } from '../security/injectionGate.js';
import { buildRunHeader, validateRunHeader } from '../security/runHeaderValidator.js';
import { signEnvelope, verifyEnvelope } from '../security/signedEnvelopes.js';
import { sealRunEvidence } from '../security/merkleSeal.js';
import { initBudget, checkBudget, consumeBudget, clearBudget } from './tokenBudget.js';
import { checkAndRecordCost } from './costAnomaly.js';
import { predictTTCRequirement } from '../routing/adaptiveTTCPredictor.js';
import { optimizeFailedPrompt } from '../telemetry/promptOptimizer.js';
import { initSli, recordNodeSli, finalizeSli } from './sliEnforcer.js';
import * as store from './graphStateStore.js';
import { enforceSchemaWithRepair } from '../validators/schemaEnforcer.js';
import { executeCriticNode } from './criticNode.js';
import './retrievalNode.js';

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
  if (order.length !== ids.length) {
    throw new Error('topological_sort_failed');
  }
  return order;
}

function evaluateEdgeCondition(condition, context) {
  try {
    const keys = Object.keys(context);
    const vals = Object.values(context);
    const fn = new Function(...keys, `return !!(${condition})`);
    return fn(...vals);
  } catch {
    return false;
  }
}

function resolveConditionalEdges(edges, fromNodeId, nodeOutputs) {
  const outEdges = edges.filter((e) => e.from_node_id === fromNodeId);
  const conditionals = outEdges.filter((e) => edgeIsConditional(e));
  if (conditionals.length === 0) return outEdges.map((e) => e.to_node_id);

  const ctx = { outputs: nodeOutputs, current: nodeOutputs[fromNodeId] || '' };
  const targets = [];
  for (const e of outEdges) {
    if (edgeIsConditional(e)) {
      if (evaluateEdgeCondition(e.condition, ctx)) targets.push(e.to_node_id);
    } else {
      targets.push(e.to_node_id);
    }
  }
  return targets;
}

function transitionRun(runId, to) {
  const r = store.getRun(runId);
  if (!r) throw new Error('run_missing');
  assertRunTransition(r.run_state, to);
  store.setRunState(runId, to);
}

function transitionNode(runId, nodeId, to) {
  const r = store.getRun(runId);
  if (!r) throw new Error('run_missing');
  const from = r.node_states[nodeId];
  assertNodeTransition(from, to);
  store.updateNodeState(runId, nodeId, to);
}

function computeParallelLevels(nodes, edges) {
  const ids = nodes.map((n) => n.node_id);
  const idSet = new Set(ids);
  const inc = new Map(ids.map((id) => [id, 0]));
  const adj = new Map(ids.map((id) => [id, []]));
  for (const e of edges) {
    if (!idSet.has(e.from_node_id) || !idSet.has(e.to_node_id)) continue;
    adj.get(e.from_node_id).push(e.to_node_id);
    inc.set(e.to_node_id, (inc.get(e.to_node_id) || 0) + 1);
  }
  const levels = [];
  const remaining = new Map(inc);
  while (true) {
    const ready = ids.filter((id) => remaining.has(id) && remaining.get(id) === 0);
    if (ready.length === 0) break;
    ready.sort((a, b) => a.localeCompare(b));
    levels.push(ready);
    for (const u of ready) {
      remaining.delete(u);
      for (const v of adj.get(u) || []) {
        if (remaining.has(v)) remaining.set(v, remaining.get(v) - 1);
      }
    }
  }
  return levels;
}

function buildCycleExecutionPlan(nodes, edges, entryNodeId, maxIterations) {
  const allIds = nodes.map((n) => n.node_id);
  const idSet = new Set(allIds);
  const outAdj = new Map(allIds.map((id) => [id, []]));
  for (const e of edges) {
    if (!idSet.has(e.from_node_id) || !idSet.has(e.to_node_id)) continue;
    outAdj.get(e.from_node_id).push(e.to_node_id);
  }
  const reachable = [];
  const q = [entryNodeId];
  const seen = new Set([entryNodeId]);
  while (q.length) {
    const u = q.shift();
    reachable.push(u);
    for (const v of outAdj.get(u) || []) {
      if (!seen.has(v)) {
        seen.add(v);
        q.push(v);
      }
    }
  }
  const plan = [];
  for (let i = 0; i < maxIterations; i += 1) {
    for (const nodeId of reachable) {
      plan.push({ nodeId, iteration: i + 1 });
    }
  }
  return plan;
}

/**
 * @param {object} graphBody validated graph request
 * @param {{ executePromptNode: (ctx: object) => Promise<{ output: string, meta?: object }> }} deps
 */
export async function runSwarmGraph(graphBody, deps) {
  const { executePromptNode, tenant_id } = deps;
  const parallel = graphBody.parallel !== false;
  const graph_hash = computeGraphHashV1(graphBody);
  const run_id = crypto.randomUUID ? crypto.randomUUID() : `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const byId = new Map(graphBody.nodes.map((n) => [n.node_id, n]));
  const preds = new Map(graphBody.nodes.map((n) => [n.node_id, []]));
  const incomingEdges = new Map(graphBody.nodes.map((n) => [n.node_id, []]));
  for (const e of graphBody.edges) {
    preds.get(e.to_node_id).push(e.from_node_id);
    if (incomingEdges.has(e.to_node_id)) incomingEdges.get(e.to_node_id).push(e);
  }
  const conditionalTargetsBySource = new Map();

  store.createRun(graphBody, graph_hash, run_id, { tenant_id });

  const runHeader = buildRunHeader({
    run_id,
    graph_id: graphBody.graph_id,
    graph_hash,
    tenant_id: tenant_id || graphBody?.tenant_id || 'default',
    receipt_mode: graphBody.receipt_mode,
  });
  const runHeaderCheck = validateRunHeader(runHeader);
  if (!runHeaderCheck.valid) {
    throw new Error(`run_header_invalid: ${runHeaderCheck.errors.join('; ')}`);
  }
  store.setRunIntegrityArtifacts(run_id, { run_header: runHeader });

  if (graphBody.budget) initBudget(run_id, graphBody.budget);
  initSli(run_id, graphBody.slo);
  emitEvent('freeai.swarm.run.started', { run_id, graph_id: graphBody.graph_id }, { subject: run_id });
  emitExecutionEvent(run_id, { event: 'run_started', graph_id: graphBody.graph_id });

  const traceId = `swarm-${run_id}`;
  const rootSpan = tracer.startSpan('swarm_graph_run', {
    traceId,
    attributes: { 'gen_ai.swarm_run_id': run_id, 'gen_ai.graph_id': graphBody.graph_id },
  });

  const t0 = Date.now();
  let currentNodeId = null;
  try {
    transitionRun(run_id, 'validating');

    const admissionPolicy = evaluatePolicy('graph_admission', { graph: graphBody });
    const admissionReceipt = buildSwarmReceiptV1({
      receipt_type: 'policy_receipt',
      run_id,
      graph_id: graphBody.graph_id,
      node_id: null,
      status: admissionPolicy.decision === 'allow' ? 'ok' : 'blocked',
      summary: admissionPolicy.summary,
      inputs: { policy_zone: 'graph_admission' },
      outputs: { decision: admissionPolicy.decision, reason_code: admissionPolicy.reason_code },
      duration_ms: Date.now() - t0,
    });
    store.appendReceipt(run_id, admissionReceipt);

    if (admissionPolicy.decision === 'deny') {
      store.failRun(run_id, `graph_admission_denied: ${admissionPolicy.reason_code}`);
      return {
        ok: false,
        run_id,
        run_state: 'failed',
        error: `graph_admission_denied: ${admissionPolicy.reason_code}`,
        policy_result: admissionPolicy,
      };
    }

    const graphReceipt = buildSwarmReceiptV1({
      receipt_type: 'graph_receipt',
      run_id,
      graph_id: graphBody.graph_id,
      node_id: null,
      status: 'ok',
      summary: 'graph admitted for execution',
      inputs: { graph_id: graphBody.graph_id, entry_node_id: graphBody.entry_node_id },
      outputs: { graph_hash },
      duration_ms: Date.now() - t0,
    });
    store.appendReceipt(run_id, graphReceipt);

    transitionRun(run_id, 'admitted');
    transitionRun(run_id, 'running');

    const allowCycles = graphBody.allow_cycles === true;
    const maxIterations = Math.max(1, Number(graphBody.max_iterations || 1));
    const order = allowCycles ? graphBody.nodes.map((n) => n.node_id) : topologicalOrder(graphBody.nodes, graphBody.edges);
    const levels = allowCycles
      ? [[graphBody.entry_node_id]]
      : (parallel ? computeParallelLevels(graphBody.nodes, graphBody.edges) : order.map((id) => [id]));
    const cyclePlan = allowCycles ? buildCycleExecutionPlan(graphBody.nodes, graphBody.edges, graphBody.entry_node_id, maxIterations) : null;
    let cycleCursor = 0;

    function updateConditionalTargetsForSource(nodeId) {
      const outEdges = graphBody.edges.filter((e) => e.from_node_id === nodeId);
      const conditionalOut = outEdges.filter((e) => edgeIsConditional(e));
      if (conditionalOut.length === 0) return;
      const selected = new Set(resolveConditionalEdges(graphBody.edges, nodeId, store.getRun(run_id).node_outputs));
      const active = new Set();
      for (const e of conditionalOut) {
        if (selected.has(e.to_node_id)) active.add(e.to_node_id);
      }
      conditionalTargetsBySource.set(nodeId, active);
    }

    function shouldExecuteNode(nodeId) {
      if (nodeId === graphBody.entry_node_id) return true;
      const edges = incomingEdges.get(nodeId) || [];
      if (edges.length === 0) return true;
      let hasDefaultIncoming = false;
      let hasActiveConditionalIncoming = false;
      for (const e of edges) {
        if (edgeIsConditional(e)) {
          const activeTargets = conditionalTargetsBySource.get(e.from_node_id);
          if (activeTargets && activeTargets.has(nodeId)) hasActiveConditionalIncoming = true;
        } else {
          hasDefaultIncoming = true;
        }
      }
      return hasDefaultIncoming || hasActiveConditionalIncoming;
    }

    function skipInactiveNode(nodeId) {
      transitionNode(run_id, nodeId, 'skipped');
      emitExecutionEvent(run_id, { event: 'node_skipped', node_id: nodeId, reason: 'conditional_not_selected' });
      store.appendReceipt(run_id, buildSwarmReceiptV1({
        receipt_type: 'node_receipt',
        run_id,
        graph_id: graphBody.graph_id,
        node_id: nodeId,
        status: 'ok',
        summary: 'node skipped: conditional path not selected',
        inputs: null,
        outputs: null,
        duration_ms: 0,
      }));
      updateConditionalTargetsForSource(nodeId);
    }

    async function executeNode(nodeId, iteration = null) {
      currentNodeId = nodeId;
      const node = byId.get(nodeId);
      if (allowCycles && iteration && iteration > 1) {
        const st = store.getRun(run_id)?.node_states?.[nodeId];
        if (st === 'completed' || st === 'skipped' || st === 'failed') {
          // Iterative cycle scheduler re-arms node state for next bounded iteration.
          store.updateNodeState(run_id, nodeId, 'pending');
        }
      }
      emitExecutionEvent(run_id, { event: 'node_started', node_id: nodeId, node_type: node?.node_type || 'unknown', iteration });
      const result = await _executeOneNode(run_id, graphBody, graph_hash, node, nodeId, preds, deps, rootSpan, traceId, t0);
      const nodeState = store.getRun(run_id)?.node_states?.[nodeId] || null;
      emitExecutionEvent(run_id, { event: 'node_finished', node_id: nodeId, node_state: nodeState, iteration });
      updateConditionalTargetsForSource(nodeId);
      return result;
    }

    if (allowCycles) {
      while (cycleCursor < cyclePlan.length) {
        const step = cyclePlan[cycleCursor];
        cycleCursor += 1;
        if (!shouldExecuteNode(step.nodeId)) {
          skipInactiveNode(step.nodeId);
          continue;
        }
        const result = await executeNode(step.nodeId, step.iteration);
        if (result) return result;
      }
      clearRetryBudget(run_id);
      throw new Error('max_iterations_exhausted_without_finalization');
    } else {
      for (const level of levels) {
        const runnable = [];
        for (const nodeId of level) {
          if (shouldExecuteNode(nodeId)) runnable.push(nodeId);
          else skipInactiveNode(nodeId);
        }
        if (runnable.length === 1) {
          const result = await executeNode(runnable[0]);
          if (result) return result;
        } else if (runnable.length > 1) {
          const results = await Promise.all(runnable.map((nodeId) => executeNode(nodeId)));
          for (const r of results) {
            if (r) return r;
          }
        }
      }
    }

    clearRetryBudget(run_id);
    throw new Error('finalization_node_not_reached');
  } catch (err) {
    const r = store.getRun(run_id);
    if (r && r.run_state !== 'completed' && r.run_state !== 'paused_for_review') {
      if (typeof currentNodeId === 'string' && !r.failed_at_node_id) {
        store.setFailedAtNode(run_id, currentNodeId);
      }
      store.failRun(run_id, err?.message || String(err));
    }
    const failedSli = finalizeSli(run_id);
    clearBudget(run_id);
    emitEvent('freeai.swarm.run.failed', { run_id, error: err?.message || String(err), sli: failedSli }, { subject: run_id });
    emitExecutionEvent(run_id, { event: 'run_failed', error: err?.message || String(err) });
    try {
      const runRec = store.getRun(run_id);
      const merkleSeal = sealRunEvidence(runRec?.receipts || []);
      const signedEnvelope = signEnvelope({
        run_id,
        graph_id: graphBody.graph_id,
        run_state: runRec?.run_state || 'failed',
        error: err?.message || String(err),
        merkle_root: merkleSeal.merkle_root,
      });
      const envelopeCheck = verifyEnvelope(signedEnvelope);
      if (envelopeCheck.valid) {
        store.setRunIntegrityArtifacts(run_id, {
          merkle_seal: merkleSeal,
          decision_envelope: signedEnvelope,
        });
      }
    } catch {
      /* keep original failure reason intact */
    }
    rootSpan.setError(err?.message || String(err));
    rootSpan.end({ 'gen_ai.run_state': store.getRun(run_id)?.run_state || 'failed' });
    return {
      ok: false,
      run_id,
      run_state: store.getRun(run_id)?.run_state || 'failed',
      error: err?.message || String(err),
    };
  }
}

async function _executeOneNode(run_id, graphBody, graph_hash, node, nodeId, preds, deps, rootSpan, traceId, t0) {
  const { executePromptNode } = deps;

  const nodePolicy = evaluatePolicy('node_execution', { node, run: store.getRun(run_id) });
  if (nodePolicy.decision === 'deny') {
    const pr = buildSwarmReceiptV1({
      receipt_type: 'policy_receipt', run_id, graph_id: graphBody.graph_id, node_id: nodeId,
      status: 'blocked', summary: nodePolicy.summary,
      inputs: { policy_zone: 'node_execution', node_id: nodeId },
      outputs: { decision: 'deny', reason_code: nodePolicy.reason_code }, duration_ms: 0,
    });
    store.appendReceipt(run_id, pr);
    transitionNode(run_id, nodeId, 'skipped');
    return null;
  }

  const providerPolicy = evaluatePolicy('provider_model_eligibility', { node, run: store.getRun(run_id) });
  store.appendReceipt(run_id, buildSwarmReceiptV1({
    receipt_type: 'policy_receipt',
    run_id,
    graph_id: graphBody.graph_id,
    node_id: nodeId,
    status: providerPolicy.decision === 'allow' ? 'ok' : 'blocked',
    summary: providerPolicy.summary,
    inputs: { policy_zone: 'provider_model_eligibility', provider_id: node?.config?.provider_id || null, model_id: node?.config?.model_id || null },
    outputs: { decision: providerPolicy.decision, reason_code: providerPolicy.reason_code },
    duration_ms: 0,
  }));
  if (providerPolicy.decision === 'deny') {
    transitionNode(run_id, nodeId, 'failed');
    store.setFailedAtNode(run_id, nodeId);
    throw new Error(`provider_policy_denied: ${providerPolicy.reason_code}`);
  }

  if (node.node_type === NODE_TYPE_PROMPT) {
    const nodeSpan = tracer.startSpan('swarm_node', {
      traceId, parentId: rootSpan.spanId,
      attributes: { 'gen_ai.swarm_node': nodeId, 'gen_ai.node_type': 'prompt_node' },
    });
    const n0 = Date.now();
    const metric = startNodeMetric(run_id, nodeId, 'prompt_node');
    transitionNode(run_id, nodeId, 'admitted');
    transitionNode(run_id, nodeId, 'running');
    try {
      const predList = preds.get(nodeId) || [];
      const predecessorOutputs = {};
      for (const p of predList) predecessorOutputs[p] = store.getRun(run_id).node_outputs[p] ?? '';

      const promptText = node.config?.prompt || Object.values(predecessorOutputs).join(' ');
      const injectionCheck = enforceInjectionGate(promptText, node.config?.injection_gate);
      if (!injectionCheck.allowed) {
        emitEvent('freeai.swarm.security.injection_blocked', { run_id, node_id: nodeId, findings: injectionCheck.result.findings }, { subject: run_id });
        throw new Error(`injection_blocked: ${injectionCheck.result.highest_severity}`);
      }

      const budgetCheck = checkBudget(run_id, node.config?.estimated_tokens || 1000, node.config?.estimated_cost || 0.01);
      if (!budgetCheck.allowed) {
        emitEvent('freeai.swarm.budget.exhausted', { run_id, node_id: nodeId, reason: budgetCheck.reason }, { subject: run_id });
        throw new Error(`budget_exhausted: ${budgetCheck.reason}`);
      }
      if (budgetCheck.warning) {
        emitEvent('freeai.swarm.budget.warning', { run_id, node_id: nodeId, percent: budgetCheck.percent }, { subject: run_id });
      }

      const hookCtx = { run_id, node, node_id: nodeId, input: predecessorOutputs };
      const beforeResult = await runBeforeHooks(hookCtx);
      if (!beforeResult.proceed) {
        const fallback = beforeResult.fallback_output || '';
        store.setNodeOutput(run_id, nodeId, fallback);
        transitionNode(run_id, nodeId, 'completed');
        endNodeMetric(run_id, nodeId, { ok: true });
        nodeSpan.end({ 'gen_ai.status': 'skipped_by_hook' });
        return null;
      }

      const inputSchemaCheck = validateNodeInputSchema(predecessorOutputs, node.config);
      if (!inputSchemaCheck.ok) {
        throw new Error(`input_schema_violation: ${inputSchemaCheck.errors.join('; ')}`);
      }

      if (node.config.input_guardrail) {
        const igCheck = validateInputGuardrail(predecessorOutputs, node.config.input_guardrail);
        if (!igCheck.ok) {
          throw new Error(`input_guardrail_violation: ${igCheck.errors.join('; ')}`);
        }
      }

      const hasRetry = node.config.retry_config && typeof node.config.retry_config === 'object';
      const useTTC = predictTTCRequirement(node, graphBody.input_payload || {});
      let resilienceResult;

      if (useTTC) {
        const { TestTimeComputeEnsemble } = await import('./testTimeCompute.js');
        const ttc = new TestTimeComputeEnsemble({ ensembleSize: node.config.ttc_size || 3 });
        const aggregatedInput = Object.values(beforeResult.modified_input || predecessorOutputs).join('\\n');
        
        const executeBound = (ctx) => executePromptNodeV1(ctx, executePromptNode);
        const ctxProps = {
            runId: run_id, 
            graphBody, 
            node, 
            predecessorOutputs: beforeResult.modified_input || predecessorOutputs, 
            input_payload: graphBody.input_payload 
        };

        const bestOutput = await ttc.runEnsemble(node.config.prompt || aggregatedInput, ctxProps, executeBound);
        resilienceResult = { ok: true, result: { output: bestOutput }, attempts: node.config.ttc_size || 3 };
      } else {
        resilienceResult = hasRetry
          ? await executeWithResilience(
              () => executePromptNodeV1(
                { runId: run_id, graphBody, node, predecessorOutputs: beforeResult.modified_input || predecessorOutputs, input_payload: graphBody.input_payload },
                executePromptNode,
              ),
              {
                run_id, service_key: `prompt:${nodeId}`, retry_config: node.config.retry_config,
                onRetry: (attempt, err) => runRetryHooks(hookCtx, attempt, err),
              },
            )
          : await executePromptNodeV1(
              { runId: run_id, graphBody, node, predecessorOutputs: beforeResult.modified_input || predecessorOutputs, input_payload: graphBody.input_payload },
              executePromptNode,
            ).then((r) => ({ ok: true, result: r, attempts: 1 }));
      }

      if (!resilienceResult.ok) {
        const errResult = await runErrorHooks(hookCtx, new Error(resilienceResult.error));
        if (errResult.suppress) {
          store.setNodeOutput(run_id, nodeId, errResult.fallback_output || '');
          transitionNode(run_id, nodeId, 'completed');
          endNodeMetric(run_id, nodeId, { ok: true, retries: resilienceResult.attempts - 1 });
          nodeSpan.end({ 'gen_ai.status': 'suppressed_by_hook' });
          return null;
        }
        throw new Error(resilienceResult.error);
      }

      let { output } = resilienceResult.result;

      if (node.config && node.config.output_schema_id) {
        const repairRes = await enforceSchemaWithRepair(output, node.config.output_schema_id, { graph_id: graphBody.graph_id, run_id }, 2, resilienceResult.result?.meta?.provider_id);
        if (!repairRes.ok) {
          throw new Error(`schema_repair_failed: ${repairRes.error} ${repairRes.details ? JSON.stringify(repairRes.details) : ''}`);
        }
        output = typeof repairRes.data === 'string' ? repairRes.data : JSON.stringify(repairRes.data);
      } else {
        const outputSchemaCheck = validateNodeOutputSchema(output, node.config);
        if (!outputSchemaCheck.ok) {
          throw new Error(`output_schema_violation: ${outputSchemaCheck.errors.join('; ')}`);
        }
      }

      if (node.config.output_guardrail) {
        const ogCheck = validateOutputGuardrail(output, node.config.output_guardrail);
        if (!ogCheck.ok) {
          throw new Error(`output_guardrail_violation: ${ogCheck.errors.join('; ')}`);
        }
      }

      if (node.config.requires_verification) {
        const retrievalContext = Object.values(predecessorOutputs).join('\n');
        const originalQuery = graphBody.input_payload?.query || '';
        const criticRes = await executeCriticNode({ 
          generated_output: output, 
          retrieval_context: retrievalContext, 
          original_query: originalQuery 
        }, { run_id }, run_id);
        
        if (!criticRes.is_grounded) {
          emitEvent('freeai.swarm.critic.rejected', { run_id, node_id: nodeId, reason: criticRes.rejection_reason }, { subject: run_id });
          throw new Error(`critic_node_rejection: ${criticRes.rejection_reason}`);
        }
      }

      const afterResult = await runAfterHooks(hookCtx, { output });

      store.setNodeOutput(run_id, nodeId, afterResult.output || output);
      transitionNode(run_id, nodeId, 'completed');
      store.setExecutionCheckpoint(run_id, nodeId);
      const nodeDuration = Date.now() - n0;
      endNodeMetric(run_id, nodeId, { ok: true, retries: resilienceResult.attempts - 1 });
      recordNodeSli(run_id, nodeId, nodeDuration, true);
      consumeBudget(run_id, node.config?.estimated_tokens || 500, node.config?.estimated_cost || 0.005);
      checkAndRecordCost(`node:${node.node_type}`, node.config?.estimated_cost || 0.005);
      emitEvent('freeai.swarm.node.completed', { run_id, node_id: nodeId, duration_ms: nodeDuration }, { subject: run_id });
      nodeSpan.end({ 'gen_ai.status': 'ok', 'gen_ai.output_len': (afterResult.output || output).length });
      store.appendReceipt(run_id, buildSwarmReceiptV1({
        receipt_type: 'node_receipt', run_id, graph_id: graphBody.graph_id, node_id: nodeId,
        status: 'ok', summary: 'prompt_node completed',
        inputs: { predecessorOutputs, input_keys: Object.keys(graphBody.input_payload || {}) },
        outputs: { output_len: (afterResult.output || output).length, attempts: resilienceResult.attempts }, duration_ms: Date.now() - n0,
      }));
    } catch (e) {
      transitionNode(run_id, nodeId, 'failed');
      store.setFailedAtNode(run_id, nodeId);
      endNodeMetric(run_id, nodeId, { ok: false, error: e?.message });
      recordNodeSli(run_id, nodeId, Date.now() - n0, false);
      emitEvent('freeai.swarm.node.failed', { run_id, node_id: nodeId, error: e?.message }, { subject: run_id });
      nodeSpan.setError(e?.message || String(e));
      nodeSpan.end();
      // Background Prompt Optimization Hook
      optimizeFailedPrompt(run_id, nodeId, e?.message || e, node.config || {}).catch(() => {});
      store.appendReceipt(run_id, buildSwarmReceiptV1({
        receipt_type: 'node_receipt', run_id, graph_id: graphBody.graph_id, node_id: nodeId,
        status: 'failed', summary: String(e?.message || e).slice(0, 500),
        inputs: null, outputs: null, duration_ms: Date.now() - n0,
      }));
      throw e;
    }
  } else if (node.node_type === NODE_TYPE_MERGE) {
    const n0 = Date.now();
    transitionNode(run_id, nodeId, 'admitted');
    transitionNode(run_id, nodeId, 'running');
    const predIds = preds.get(nodeId) || [];
    const branches = predIds.map((pid) => {
      const st = store.getRun(run_id).node_states[pid];
      const out = store.getRun(run_id).node_outputs[pid];
      const ok = st === 'completed' && typeof out === 'string';
      return { node_id: pid, output: ok ? out : '', ok };
    });
    const mergePolicy = evaluatePolicy('merge_decision', { node, branches });
    store.appendReceipt(run_id, buildSwarmReceiptV1({
      receipt_type: 'policy_receipt', run_id, graph_id: graphBody.graph_id, node_id: nodeId,
      status: mergePolicy.decision === 'allow' ? 'ok' : 'blocked', summary: mergePolicy.summary,
      inputs: { policy_zone: 'merge_decision' }, outputs: { decision: mergePolicy.decision }, duration_ms: 0,
    }));
    if (mergePolicy.decision === 'deny') {
      transitionNode(run_id, nodeId, 'failed');
      store.setFailedAtNode(run_id, nodeId);
      throw new Error(`merge_policy_denied: ${mergePolicy.reason_code}`);
    }
    const strategy = node.config.merge_strategy;
    const priority = strategy === 'deterministic_priority' ? node.config.priority : null;
    const merged = executeMergeV1({ strategy, priority, branches });
    store.appendReceipt(run_id, buildSwarmReceiptV1({
      receipt_type: 'merge_receipt', run_id, graph_id: graphBody.graph_id, node_id: nodeId,
      status: merged.ok ? 'ok' : 'failed',
      summary: merged.ok ? `picked:${merged.picked_branch}` : String(merged.reason || 'merge_failed'),
      inputs: { strategy, branches: branches.map((b) => ({ id: b.node_id, ok: b.ok, len: (b.output || '').length })) },
      outputs: merged.ok ? { picked_branch: merged.picked_branch, value_len: (merged.value || '').length } : null,
      duration_ms: Date.now() - n0,
    }));
    if (!merged.ok) {
      transitionNode(run_id, nodeId, 'failed');
      store.setFailedAtNode(run_id, nodeId);
      throw new Error(merged.reason || 'merge_failed');
    }
    store.setNodeOutput(run_id, nodeId, merged.value);
    transitionNode(run_id, nodeId, 'completed');
    store.setExecutionCheckpoint(run_id, nodeId);
  } else if (node.node_type === NODE_TYPE_FINAL) {
    const n0 = Date.now();
    transitionNode(run_id, nodeId, 'admitted');
    transitionNode(run_id, nodeId, 'running');
    const predList = preds.get(nodeId) || [];
    const pred0 = predList[0];
    const accepted = pred0 ? store.getRun(run_id).node_outputs[pred0] : '';
    const final_output = {
      text: typeof accepted === 'string' ? accepted : '',
      graph_id: graphBody.graph_id, graph_hash, graph_name: graphBody.graph_name,
      node_lane_summary: graphBody.nodes.map((n) => ({ id: n.node_id, type: n.node_type, lane: n.task_lane || null })),
    };
    store.appendReceipt(run_id, buildSwarmReceiptV1({
      receipt_type: 'final_receipt', run_id, graph_id: graphBody.graph_id, node_id: nodeId,
      status: 'ok', summary: 'finalization completed',
      inputs: { pred: predList[0] || null }, outputs: { final_len: final_output.text.length },
      duration_ms: Date.now() - n0,
    }));
    transitionNode(run_id, nodeId, 'completed');
    store.setExecutionCheckpoint(run_id, nodeId);
    store.finalizeRun(run_id, final_output);
    const runRec = store.getRun(run_id);
    const merkleSeal = sealRunEvidence(runRec?.receipts || []);
    const signedEnvelope = signEnvelope({
      run_id,
      graph_id: graphBody.graph_id,
      run_state: 'completed',
      final_output_hash: crypto.createHash('sha256').update(JSON.stringify(final_output)).digest('hex').slice(0, 16),
      merkle_root: merkleSeal.merkle_root,
    });
    const envelopeCheck = verifyEnvelope(signedEnvelope);
    if (!envelopeCheck.valid) {
      throw new Error(`signed_envelope_invalid: ${envelopeCheck.reason}`);
    }
    store.setRunIntegrityArtifacts(run_id, {
      merkle_seal: merkleSeal,
      decision_envelope: signedEnvelope,
      decision_envelope_verified: true,
    });
    const sliSummary = finalizeSli(run_id);
    clearBudget(run_id);
    emitEvent('freeai.swarm.run.completed', { run_id, graph_id: graphBody.graph_id, sli: sliSummary }, { subject: run_id });
    emitExecutionEvent(run_id, { event: 'run_completed', graph_id: graphBody.graph_id, run_state: 'completed' });
    rootSpan.end({ 'gen_ai.run_state': 'completed' });
    return { ok: true, run_id, run_state: 'completed', graph_hash, final_output, receipts_count: store.getRun(run_id).receipts.length, sli: sliSummary };
  } else if (node.node_type === NODE_TYPE_TOOL) {
    const n0 = Date.now();
    transitionNode(run_id, nodeId, 'admitted');
    transitionNode(run_id, nodeId, 'running');
    const predList = preds.get(nodeId) || [];
    const predecessorOutputs = {};
    for (const p of predList) predecessorOutputs[p] = store.getRun(run_id).node_outputs[p] ?? '';
    const toolResult = await executeToolNodeV1({ node, predecessorOutputs });
    store.appendReceipt(run_id, buildSwarmReceiptV1({
      receipt_type: 'tool_receipt', run_id, graph_id: graphBody.graph_id, node_id: nodeId,
      status: toolResult.ok ? 'ok' : 'failed',
      summary: toolResult.ok ? `tool ${node.config.tool_id} completed` : (toolResult.error || 'tool_failed'),
      inputs: { tool_id: node.config.tool_id },
      outputs: toolResult.ok ? { output_type: typeof toolResult.output } : null,
      duration_ms: Date.now() - n0,
    }));
    if (toolResult.policy_result) {
      store.appendReceipt(run_id, buildSwarmReceiptV1({
        receipt_type: 'policy_receipt', run_id, graph_id: graphBody.graph_id, node_id: nodeId,
        status: toolResult.policy_result.decision === 'allow' ? 'ok' : 'blocked',
        summary: toolResult.policy_result.summary,
        inputs: { policy_zone: 'tool_execution', tool_id: node.config.tool_id },
        outputs: { decision: toolResult.policy_result.decision }, duration_ms: 0,
      }));
    }
    if (!toolResult.ok) {
      transitionNode(run_id, nodeId, 'failed');
      store.setFailedAtNode(run_id, nodeId);
      throw new Error(toolResult.error || 'tool_node_failed');
    }
    store.setNodeOutput(run_id, nodeId, typeof toolResult.output === 'string' ? toolResult.output : JSON.stringify(toolResult.output));
    transitionNode(run_id, nodeId, 'completed');
    store.setExecutionCheckpoint(run_id, nodeId);
  } else if (node.node_type === NODE_TYPE_HUMAN_REVIEW) {
    const n0 = Date.now();
    transitionNode(run_id, nodeId, 'admitted');
    transitionNode(run_id, nodeId, 'running');
    const review = createReview({
      run_id,
      node_id: nodeId,
      requested_action: node.config.requested_action || 'approve_to_continue',
      tenant_id: store.getRun(run_id)?.tenant_id || null,
    });
    store.appendReceipt(run_id, buildSwarmReceiptV1({
      receipt_type: 'review_receipt', run_id, graph_id: graphBody.graph_id, node_id: nodeId,
      status: 'pending', summary: `Human review requested: ${review.review_id}`,
      inputs: { requested_action: node.config.requested_action },
      outputs: { review_id: review.review_id }, duration_ms: Date.now() - n0,
    }));
    transitionNode(run_id, nodeId, 'waiting_human_review');
    transitionRun(run_id, 'paused_for_review');
    emitExecutionEvent(run_id, { event: 'run_paused_for_review', node_id: nodeId, review_id: review.review_id });
    return { ok: false, run_id, run_state: 'paused_for_review', paused_at_node: nodeId, review_id: review.review_id, receipts_count: store.getRun(run_id).receipts.length };
  } else if (node.node_type === NODE_TYPE_SUBGRAPH) {
    const n0 = Date.now();
    transitionNode(run_id, nodeId, 'admitted');
    transitionNode(run_id, nodeId, 'running');
    const subgraphDef = node.config.subgraph;
    const predList = preds.get(nodeId) || [];
    const parentInput = {};
    for (const p of predList) parentInput[p] = store.getRun(run_id).node_outputs[p] ?? '';
    const subBody = {
      ...subgraphDef,
      graph_name: subgraphDef.graph_name || `${graphBody.graph_name}::${nodeId}`,
      receipt_mode: graphBody.receipt_mode,
      input_payload: { ...graphBody.input_payload, parent_outputs: parentInput },
    };
    const subResult = await runSwarmGraph(subBody, deps);
    store.appendReceipt(run_id, buildSwarmReceiptV1({
      receipt_type: 'node_receipt', run_id, graph_id: graphBody.graph_id, node_id: nodeId,
      status: subResult.ok ? 'ok' : 'failed',
      summary: subResult.ok ? `subgraph completed: ${subgraphDef.graph_id}` : `subgraph failed: ${subResult.error || 'unknown'}`,
      inputs: { subgraph_id: subgraphDef.graph_id, sub_run_id: subResult.run_id },
      outputs: subResult.ok ? { sub_final_len: (subResult.final_output?.text || '').length } : null,
      duration_ms: Date.now() - n0,
    }));
    if (!subResult.ok) {
      transitionNode(run_id, nodeId, 'failed');
      store.setFailedAtNode(run_id, nodeId);
      throw new Error(`subgraph_failed: ${subResult.error || 'unknown'}`);
    }
    store.setNodeOutput(run_id, nodeId, subResult.final_output?.text || '');
    transitionNode(run_id, nodeId, 'completed');
    store.setExecutionCheckpoint(run_id, nodeId);
  } else if (node.node_type === NODE_TYPE_ROUTER) {
    const n0 = Date.now();
    transitionNode(run_id, nodeId, 'admitted');
    transitionNode(run_id, nodeId, 'running');
    const predList = preds.get(nodeId) || [];
    const routerInput = {};
    for (const p of predList) routerInput[p] = store.getRun(run_id).node_outputs[p] ?? '';
    const routes = node.config.routes || [];
    let selectedRoute = routes.find((r) => !r.condition) || routes[0];
    for (const route of routes) {
      if (route.condition) {
        const ctx = { outputs: store.getRun(run_id).node_outputs, current: Object.values(routerInput).join('') };
        if (evaluateEdgeCondition(route.condition, ctx)) { selectedRoute = route; break; }
      }
    }
    const routeOutput = JSON.stringify({ routed_to: selectedRoute.target_node_id, route_label: selectedRoute.label || null });
    store.setNodeOutput(run_id, nodeId, routeOutput);
    transitionNode(run_id, nodeId, 'completed');
    store.setExecutionCheckpoint(run_id, nodeId);
    store.appendReceipt(run_id, buildSwarmReceiptV1({
      receipt_type: 'node_receipt', run_id, graph_id: graphBody.graph_id, node_id: nodeId,
      status: 'ok', summary: `router selected: ${selectedRoute.target_node_id}`,
      inputs: { routes_count: routes.length }, outputs: { selected: selectedRoute.target_node_id },
      duration_ms: Date.now() - n0,
    }));
  } else if (node.node_type === NODE_TYPE_MAP_REDUCE) {
    const n0 = Date.now();
    const metric = startNodeMetric(run_id, nodeId, 'map_reduce_node');
    transitionNode(run_id, nodeId, 'admitted');
    transitionNode(run_id, nodeId, 'running');
    const predList = preds.get(nodeId) || [];
    const predecessorOutputs = {};
    for (const p of predList) predecessorOutputs[p] = store.getRun(run_id).node_outputs[p] ?? '';
    const input = Object.values(predecessorOutputs).join('\n');

    const workerFn = async (workItem, idx) => {
      const workerType = node.config.worker_node_type || 'prompt_node';
      if (workerType === 'tool_node') {
        const toolResult = await executeToolNodeV1({
          node: { ...node, node_type: NODE_TYPE_TOOL, config: { ...node.config.worker_config, tool_id: node.config.worker_config?.tool_id } },
          predecessorOutputs: { _work_item: typeof workItem === 'string' ? workItem : JSON.stringify(workItem) },
        });
        return { ok: toolResult.ok, output: toolResult.output };
      }
      const { output: wo } = await executePromptNodeV1(
        { runId: run_id, graphBody, node: { ...node, node_type: NODE_TYPE_PROMPT }, predecessorOutputs: { _work_item: typeof workItem === 'string' ? workItem : JSON.stringify(workItem) }, input_payload: graphBody.input_payload },
        executePromptNode,
      );
      return { ok: true, output: wo };
    };

    const mrResult = await executeMapReduce({ config: node.config, input, workerFn });
    store.appendReceipt(run_id, buildSwarmReceiptV1({
      receipt_type: 'node_receipt', run_id, graph_id: graphBody.graph_id, node_id: nodeId,
      status: mrResult.ok ? 'ok' : 'failed',
      summary: mrResult.ok ? `map_reduce completed (${mrResult.worker_count} workers)` : (mrResult.error || 'map_reduce_failed'),
      inputs: { worker_count: mrResult.worker_count },
      outputs: mrResult.ok ? { output_len: (mrResult.output || '').length } : null,
      duration_ms: Date.now() - n0,
    }));
    if (!mrResult.ok) {
      transitionNode(run_id, nodeId, 'failed');
      store.setFailedAtNode(run_id, nodeId);
      endNodeMetric(run_id, nodeId, { ok: false, error: mrResult.error });
      throw new Error(mrResult.error || 'map_reduce_failed');
    }
    store.setNodeOutput(run_id, nodeId, mrResult.output || '');
    transitionNode(run_id, nodeId, 'completed');
    store.setExecutionCheckpoint(run_id, nodeId);
    endNodeMetric(run_id, nodeId, { ok: true });
  }
  return null;
}
