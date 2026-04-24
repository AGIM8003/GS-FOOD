import { validate } from '../schemaValidator.js';
import { callSwarmNode } from '../swarm/swarmGraphEngine.js'; // Assuming we can run a quick repair node
import { emitMetric } from '../observability/metrics.js';

/**
 * Tolerant JSON parser. Attempts to extract JSON array/object from markdown 
 * code blocks or dirty strings.
 */
function extractAndParseJSON(rawText) {
  let cleaned = rawText.trim();
  // Strip markdown code blocks
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    if (lines[0].startsWith('```')) lines.shift();
    if (lines[lines.length - 1].startsWith('```')) lines.pop();
    cleaned = lines.join('\n').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Basic repair strategy: try to find the first { or [ and last } or ]
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');

    let start = -1;
    let end = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = lastBrace;
    } else if (firstBracket !== -1) {
      start = firstBracket;
      end = lastBracket;
    }

    if (start !== -1 && end !== -1 && start < end) {
      try {
        return JSON.parse(cleaned.substring(start, end + 1));
      } catch (innerE) {
        // failed tolerant extract
      }
    }
    return null;
  }
}

/**
 * Enforces schema strictness. If an output is requested as JSON and an output schema 
 * is defined, it validates the structure. It triggers a repair loop if parsing fails.
 * 
 * @param {string} rawOutput The raw text output from the model
 * @param {string} schemaId The target schema identifier
 * @param {object} routerContext Context to use for the repair loop
 * @param {number} maxRetries Maximum number of repair attempts
 */
export async function enforceSchemaWithRepair(rawOutput, schemaId, routerContext = {}, maxRetries = 2, originalProviderId = null) {
  if (!schemaId || schemaId === 'plain_text') {
    return { ok: true, data: rawOutput, originalRaw: rawOutput };
  }

  let attempt = 0;
  let currentRaw = rawOutput;

  while (attempt <= maxRetries) {
    const parsed = extractAndParseJSON(currentRaw);
    if (!parsed) {
      if (attempt === maxRetries) return { ok: false, error: 'unparseable_json', raw: currentRaw };
    } else {
      const validationResult = validate(schemaId, parsed);
      if (validationResult.valid) {
        if (attempt > 0) emitMetric('schema_repair_success', 1, { schema: schemaId, attempts: attempt });
        return { ok: true, data: parsed, raw: currentRaw, repairAttempts: attempt };
      }
      
      if (attempt === maxRetries) {
        emitMetric('schema_repair_failure', 1, { schema: schemaId, attempts: attempt, provider: originalProviderId });
        if (originalProviderId) {
          try {
            const hm = await import('../providers/healthMatrix.js');
            hm.recordProviderCapability(originalProviderId, 'structured_output', { ok: false, failure_class: 'schema_repair_failure' });
          } catch (e) {}
        }
        return { ok: false, error: 'schema_violation', details: validationResult.errors, raw: currentRaw, partialData: parsed };
      }
    }

    // Enter repair loop
    attempt++;
    console.log(`[Schema Enforcer] Attempt ${attempt}/${maxRetries} to repair schema adherence for ${schemaId}.`);
    
    const repairPrompt = `You outputted invalid JSON or structurally incorrect JSON that violated the required schema.
Please FIX the errors and return ONLY valid JSON.

Errors:
${parsed ? 'Schema Violations' : 'Failed to parse JSON string. Ensure it is strict JSON formatting.'}
Target Schema: ${schemaId}

Previous Output:
${currentRaw}

Output ONLY the corrected JSON:`;

    try {
      // We import router up top or dynamically
      const registryModule = await import('../providers/registry.js');
      const { ProviderRegistry } = registryModule;
      const configModule = await import('../config.js');
      const cfg = configModule.loadConfig();
      const registry = new ProviderRegistry(cfg);

      const ctx = { ...routerContext, response_contract_id: schemaId };
      const repairAttempt = await registry.callProviders(repairPrompt, ctx);
      
      if (repairAttempt && repairAttempt.ok) {
        currentRaw = repairAttempt.output;
      } else {
        return { ok: false, error: 'repair_loop_failed', reason: 'Provider call failed during repair' };
      }
    } catch (e) {
      console.error('[Schema Enforcer] Repair mechanism encountered a fatal error:', e.message);
      emitMetric('schema_repair_failure', 1, { schema: schemaId, error_type: 'fatal', provider: originalProviderId });
      if (originalProviderId) {
        try {
          const hm = await import('../providers/healthMatrix.js');
          hm.recordProviderCapability(originalProviderId, 'structured_output', { ok: false, failure_class: 'schema_repair_fatal' });
        } catch (e) {}
      }
      return { ok: false, error: 'repair_fatal_error' };
    }
  }

  emitMetric('schema_repair_failure', 1, { schema: schemaId, error_type: 'exhausted', provider: originalProviderId });
  if (originalProviderId) {
    try {
      const hm = await import('../providers/healthMatrix.js');
      hm.recordProviderCapability(originalProviderId, 'structured_output', { ok: false, failure_class: 'schema_repair_exhausted' });
    } catch (e) {}
  }
  return { ok: false, error: 'exhausted_retries' };
}
