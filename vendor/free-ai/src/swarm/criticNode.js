import { registerTool } from './toolRegistry.js';
import { executePromptNodeV1 } from './nodeExecutor.js';
import { emitMetric } from '../observability/metrics.js';

export async function executeCriticNode(input, context, runId) {
  const startMs = Date.now();
  const { generated_output, retrieval_context, original_query } = input || {};
  if (!generated_output || !retrieval_context) {
    return { is_grounded: false, rejection_reason: 'Missing required inputs: generated_output, retrieval_context' };
  }

  // Define a prompt to evaluate the output against ground truth context
  const evaluationPrompt = `You are a strict verifier. Evaluate the following generated answer against the retrieved context to ensure it is accurately grounded.
If it hallucinated any claims not present in the context, or directly contradicted the context, reject it.
Output ONLY valid JSON according to this schema:
{
  "is_grounded": boolean,
  "rejection_reason": "string or empty if grounded",
  "confidence_score": number between 0 and 1
}

Original Query: ${original_query || 'N/A'}

Retrieved Context:
${retrieval_context}

Generated Output:
${generated_output}
`;

  try {
    // Instead of duplicating provider logic, we leverage existing node capabilities
    // Assuming context has a router or we call out to the main provider registry
    const registryModule = await import('../providers/registry.js');
    const { ProviderRegistry } = registryModule;
    const configModule = await import('../config.js');
    
    // Attempt highest capability model (70B/critic equivalent) by overriding model hint if possible
    const cfg = configModule.loadConfig();
    const registry = new ProviderRegistry(cfg);

    const ctx = { ...context, json_output: true, intent_family: 'verification' };
    const result = await registry.callProviders(evaluationPrompt, ctx);

    if (result && result.ok) {
      const parsed = JSON.parse(result.output);
      const latencyMs = Date.now() - startMs;
      emitMetric('critic_latency_overhead', latencyMs, { run_id: runId, grounded: parsed.is_grounded, model: result.meta?.provider_id });
      return parsed; // expected: { is_grounded: true/false, rejection_reason, confidence_score }
    } else {
      const latencyMs = Date.now() - startMs;
      emitMetric('critic_latency_overhead', latencyMs, { run_id: runId, grounded: false, error: 'provider_failed' });
      return { is_grounded: false, rejection_reason: `Critic node failed: ${result?.error_msg || 'unknown error'}` };
    }
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    emitMetric('critic_latency_overhead', latencyMs, { run_id: runId, grounded: false, error: 'exception_thrown' });
    return { is_grounded: false, rejection_reason: `Verification exception: ${err.message}` };
  }
}

registerTool({
  tool_id: 'critic_verifier',
  tool_class: 'verification_agent',
  description: 'Verifies if generated output is properly grounded in retrieved context without hallucinations.',
  execute: executeCriticNode
});
