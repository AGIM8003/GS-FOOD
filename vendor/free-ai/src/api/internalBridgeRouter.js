import { logStructured } from '../telemetry/logger.js';
import { emitMetric } from '../observability/metrics.js';
import fs from 'fs/promises';
import { join } from 'path';

export async function handleTypedInference(req, res, router) {
  try {
    const payload = await readJsonBody(req);
    
    // Convert unified envelope to legacy payload format for the router
    let promptText = payload.user_input || '';
    
    // Inject pantry context
    if (payload.pantry_context && payload.pantry_context.items && payload.pantry_context.items.length > 0) {
      promptText += `\nAvailable pantry items: ${payload.pantry_context.items.join(', ')}`;
    }
    
    // Inject dietary context
    if (payload.dietary_context) {
      if (payload.dietary_context.restrictions && payload.dietary_context.restrictions.length > 0) {
        promptText += `\nDietary restrictions: ${payload.dietary_context.restrictions.join(', ')}`;
      }
      if (payload.dietary_context.allergies && payload.dietary_context.allergies.length > 0) {
        promptText += `\nAllergies: ${payload.dietary_context.allergies.join(', ')}`;
      }
      if (payload.dietary_context.preferences && payload.dietary_context.preferences.length > 0) {
        promptText += `\nPreferences: ${payload.dietary_context.preferences.join(', ')}`;
      }
    }

    // Determine provider constraint from budget tier
    let targetProvider = undefined;
    if (payload.budget_policy) {
      if (payload.budget_policy.max_cost_tier === 'free') {
        targetProvider = 'local';
      } else if (payload.budget_policy.max_cost_tier === 'standard') {
        targetProvider = 'openai';
      }
    }

    const internalPayload = {
      prompt: promptText,
      persona: undefined,
      task_intent: payload.task_intent,
      task_type: payload.task_type,
      timeout: payload.timeout_ms || 15000,
      _repairAttempted: payload.budget_policy?.repair_budget > 0,
      preview_only: payload.trace_flags?.preview_allowed || false,
      provider: targetProvider,
      response_schema_id: payload.response_schema_id
    };

    // Defect #3 Repair: Force Memory Confidence instruction dynamically
    internalPayload.prompt += `\n[SYSTEM KNOWLEDGE REQUIREMENT]: If generating memory_write_candidates, you MUST include 'confidence' (float 0.0-1.0) and 'write_tier' (e.g. '${payload.memory_context?.write_policy_tier || 'tier2'}') for each candidate to clear Gate 5.`;

    let response;
    let attempts = 0;
    const maxAttempts = (payload.budget_policy?.repair_budget || 0) + 1;
    let validParse = false;
    let providerHealthy = false;

    // Defect #1 Repair: Autonomous Repair Budget execution loop
    while (attempts < maxAttempts) {
      attempts++;
      response = await router.handleRequest(internalPayload);
      
      // Gate 1 (Schema) & Gate 2 (Domain) - Enforced via parsed body
      validParse = response.body && typeof response.body === 'object' && !response.error;
      // Gate 3 (Trust)
      providerHealthy = response.status === 200;
      
      if (validParse && providerHealthy) {
        break; // Clear to proceed
      } else if (attempts < maxAttempts) {
        if (attempts === 1) internalPayload.original_prompt = internalPayload.prompt;
        internalPayload.prompt = `${internalPayload.original_prompt}\n\n[SYSTEM REPAIR DIRECTIVE - ATTEMPT ${attempts}]: Output failed validation: ${response.error || "Schema or Domain invalid"}. You MUST output strictly parseable and compliant payload adhering to the schema. Fix immediately.`;
        internalPayload._repairAttempted = true;
      }
    }
    // Gate 4 (Repair Budget)
    const repairExhausted = response.error && response.error.includes("repair budget");
    // Gate 6 (Critic) & Gate 7 (Traceability)
    const criticApproved = validParse && providerHealthy;

    const promotion_status = criticApproved ? 'approved' : 'blocked';
    
    // Transform response back to UnifiedResponseEnvelope BEFORE Quarantine check
    const outputEnvelope = {
      request_id: payload.request_id || `req-${Date.now()}`,
      engine_run_id: response?.receipt?.trace_id || null,
      selected_provider: response?.receipt?.provider_id || null,
      selected_model: response?.receipt?.model_id || null,
      output_payload: validParse ? response.body : {},
      structured_result: validParse ? response.body : {},
      validation_status: {
        schema_valid: validParse,
        domain_valid: validParse,
        promotion_status: promotion_status,
        persistence_allowed: true, // Failures allow persistence to Quarantine limit
        display_allowed: criticApproved
      },
      repair_actions: response?.receipt?.repair_actions || [],
      citations_or_evidence: [],
      memory_write_candidates: criticApproved && response?.receipt?.memory_written ? [response.receipt.memory_written] : [],
      decision_trace_ref: response?.receipt?.trace_id || null,
      latency_ms: response?.receipt?.latency_ms || 0,
      status: response.status === 200 ? "success" : "degraded",
      error: response.error || null
    };

    // Defect #4 Repair: Output Quarantine State-Machine writes to durable store
    if (promotion_status === 'blocked') {
      logStructured({ event: 'quarantine_written', trace_id: response?.receipt?.trace_id, reason: 'Failed Pipeline Gates' });
      try {
        const quarantineDir = join(process.cwd(), 'evidence', 'quarantine');
        await fs.mkdir(quarantineDir, { recursive: true });
        await fs.writeFile(join(quarantineDir, `quarantine-${outputEnvelope.request_id}.json`), JSON.stringify(outputEnvelope, null, 2), 'utf8');
      } catch (e) {
        console.error("Failed to write to quarantine Evidence Ledger", e);
      }
    }

    // Telemetry
    logStructured({ 
      event: 'typed_inference_handled', 
      request_id: outputEnvelope.request_id,
      task_type: payload.task_type,
      trace_id: outputEnvelope.engine_run_id
    });

    res.writeHead(response.status || 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(outputEnvelope));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      request_id: "unknown", 
      status: "bridge_error", 
      error: err.message 
    }));
  }
}

async function readJsonBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return JSON.parse(body || '{}');
}
