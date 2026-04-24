import fs from 'fs';
import path from 'path';

/**
 * Prompt Optimizer
 * Telemetric analysis of node failures to retroactively tune prompt directives.
 */

const OPTIMIZER_LOG_DIR = path.join(process.cwd(), 'evidence', 'prompt_optimizations');

export async function optimizeFailedPrompt(runId, nodeId, error, nodeConfig) {
  try {
    if (!fs.existsSync(OPTIMIZER_LOG_DIR)) {
      fs.mkdirSync(OPTIMIZER_LOG_DIR, { recursive: true });
    }
    
    const basePrompt = nodeConfig.prompt || '';
    let suggestion = '';
    
    // Identify failure type
    const errStr = String(error).toLowerCase();
    
    if (errStr.includes('schema') || errStr.includes('json') || errStr.includes('schema_repair_failure')) {
      suggestion = '[SYSTEM CORRECTION] The previous response failed strict schema validation. You MUST emit ONLY valid JSON matching the exact schema. DO NOT wrap the output in markdown code blocks unless requested. DO NOT hallucinate missing fields.';
    } else if (errStr.includes('critic_node_rejection') || errStr.includes('grounding') || errStr.includes('hallucination')) {
      suggestion = '[SYSTEM CORRECTION] Your previous response was rejected by the verification critic for fabricating claims not supported by the retrieved context. Ensure 100% adherence to grounding context. If the answer is unknown, say so.';
    } else if (errStr.includes('timeout')) {
      suggestion = '[SYSTEM CORRECTION] Previous execution timed out. Provide a more concise response.';
    } else if (errStr.includes('guardrail')) {
      suggestion = '[SYSTEM CORRECTION] Reinforce safety boundaries explicitly. Do not bypass constraints.';
    } else {
      suggestion = '[SYSTEM CORRECTION] Add defensive boundaries to handle edge cases gracefully.';
    }

    const optimizationRecord = {
      timestamp: new Date().toISOString(),
      run_id: runId,
      node_id: nodeId,
      intent_family: nodeConfig.intent_family || 'unknown',
      original_error: String(error),
      original_length: basePrompt.length,
      optimization_suggestion: suggestion,
      node_type: nodeConfig.node_type || 'prompt'
    };

    const targetFile = path.join(OPTIMIZER_LOG_DIR, `opt_${nodeId}_${Date.now()}.json`);
    fs.writeFileSync(targetFile, JSON.stringify(optimizationRecord, null, 2));

    console.log(`[PromptOptimizer] Recorded optimization hint for node ${nodeId} based on failure: ${suggestion}`);
  } catch (ex) {
    console.error(`[PromptOptimizer] Failed to record optimization: ${ex.message}`);
  }
}

/**
 * Retrieve active prompt optimizations for a given nodeId.
 * Iterates recent active corrections and returns them as a single appended instruction block.
 */
export function getActiveOptimizations(nodeId) {
  try {
    if (!fs.existsSync(OPTIMIZER_LOG_DIR)) return '';
    const files = fs.readdirSync(OPTIMIZER_LOG_DIR)
      .filter(f => f.startsWith(`opt_${nodeId}_`))
      .sort()
      .reverse(); // Newest first

    if (!files.length) return '';

    // Read the top most recent optimization
    const latest = JSON.parse(fs.readFileSync(path.join(OPTIMIZER_LOG_DIR, files[0]), 'utf8'));
    return latest.optimization_suggestion || '';
  } catch (err) {
    return '';
  }
}
