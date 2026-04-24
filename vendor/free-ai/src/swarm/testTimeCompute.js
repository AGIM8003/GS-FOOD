/*
 * Test-Time Compute (TTC) Ensemble Manager
 * Elevates free-tier model precision to near-frontier levels by parallelizing 
 * reasoning chains and applying a verifier-agent selector.
 */

export class TestTimeComputeEnsemble {
  constructor(options = {}) {
    this.ensembleSize = options.ensembleSize || 3;
    this.useVerifier = options.useVerifier !== false;
  }

  /**
   * Runs the prompt across multiple free-tier model instances.
   * @param {string} prompt 
   * @param {Object} context 
   * @param {Function} executeFn The base generation function
   */
  async runEnsemble(prompt, context, executeFn) {
    console.log(`[TTC Ensemble] Booting compute cluster of size ${this.ensembleSize}...`);

    const promises = [];
    for (let i = 0; i < this.ensembleSize; i++) {
        // executeFn must be bound to the router
        promises.push(executeFn({ ...context, _ttc_branch_id: i }));
    }

    const results = await Promise.allSettled(promises);
    const validOutputs = results
      .filter(r => r.status === 'fulfilled' && r.value && r.value.output)
      .map(r => r.value.output);

    if (validOutputs.length === 0) {
      throw new Error(`[TTC] All ${this.ensembleSize} branches failed to generate a valid output.`);
    }

    if (validOutputs.length === 1) return validOutputs[0];

    if (this.useVerifier) {
      console.log(`[TTC Ensemble] Employing Verifier Agent across ${validOutputs.length} candidate paths.`);
      return this._verifyAndSelect(validOutputs, context, executeFn);
    }
    
    return validOutputs[0]; // fallback to first valid
  }

  /**
   * Employs another lightweight zero-shot call to evaluate which of the N outputs is best.
   */
  async _verifyAndSelect(candidateOutputs, context, executeFn) {
    const verifierPrompt = `You are a strict reasoning verifier. Analyze the following candidate paths and select the single best, most accurate result based on logical coherence and truthfulness.\n\nCandidates:\n${candidateOutputs.map((v, i) => `--- CANDIDATE ${i} ---\n${v}`).join('\n\n')}\n\nOutput only the EXACT text of the winning candidate, nothing else.`;

    try {
      // Execute the verifier zero-shot pass
      const verified = await executeFn({ ...context, _ttc_is_verifier: true, override_prompt: verifierPrompt });
      if (verified && verified.output) return verified.output;
      return candidateOutputs[0];
    } catch (err) {
      console.error(`[TTC Verifier] Failed to cross-verify: ${err.message}. Falling back.`);
      return candidateOutputs[0];
    }
  }
}
