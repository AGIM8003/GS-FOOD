/*
 * Autonomous Model Discovery Engine
 * The "Engine of Improvement" that actively scans open-source hubs for new free-tier
 * capabilities that might out-perform current local or cloud endpoints.
 */

import fs from 'fs/promises';
import path from 'path';

export class ModelDiscoveryEngine {
  constructor() {
    this.hubs = [
      'https://openrouter.ai/api/v1/models',
    ];
    this.discoveredModels = [];
    this.pendingDiscoveriesLog = path.join(process.cwd(), 'data', 'memory', 'obsidian', 'transient', 'pending_discoveries.json');
  }

  /**
   * Scans listed hubs for candidate models categorized as cost: 0.0 or free-tier.
   */
  async scanForNewFreeTiers() {
    console.log("[Model Discovery] Contacting hubs to scan for new free models...");
    
    try {
      const response = await fetch(this.hubs[0]);
      if (!response.ok) throw new Error(`Hub returned status ${response.status}`);
      
      const responseData = await response.json();
      const models = responseData.data || [];

      // Filter for strictly free models
      const freeModels = models.filter(m => {
        const p = m.pricing;
        if (!p) return false;
        const promptCost = Number(p.prompt);
        const completionCost = Number(p.completion);
        return promptCost === 0 && completionCost === 0 && (m.id.toLowerCase().includes('free') || m.id.toLowerCase().includes('open'));
      });

      console.log(`[Model Discovery] Extracted ${freeModels.length} fully free candidate models from network.`);

      // Store discovered models that we haven't tracked yet this session
      for (const m of freeModels) {
        if (!this.discoveredModels.some(ext => ext.id === m.id)) {
          this.discoveredModels.push({
            id: m.id,
            name: m.name,
            context_length: m.context_length,
            pricing: m.pricing,
            architecture: m.architecture,
            discoveredAt: Date.now()
          });
        }
      }

      return this.discoveredModels;
    } catch (err) {
      console.error(`[Model Discovery] Network scan failed: ${err.message}`);
      return [];
    }
  }

  /**
   * Stages the newly discovered models for injection into providers.json.
   * Modifies the local providers.json directly for maximum performance.
   */
  async promoteCandidateToCatalog() {
    if (this.discoveredModels.length === 0) return false;
    
    try {
      const providersPath = path.join(process.cwd(), 'providers.json');
      let fileData;
      let existingConfig;
      
      try {
        fileData = await fs.readFile(providersPath, 'utf8');
        existingConfig = JSON.parse(fileData);
      } catch (err) {
        console.error(`[Model Discovery] Cannot find or parse providers.json: ${err.message}`);
        return false;
      }

      let injectedCount = 0;
      for (const p of existingConfig.providers) {
        if (p.id === 'openrouter') {
          if (!p.candidates) p.candidates = [];
          
          for (const d of this.discoveredModels) {
            if (!p.candidates.includes(d.id)) {
              p.candidates.push(d.id);
              injectedCount++;
            }
          }
        }
      }

      if (injectedCount > 0) {
        await fs.writeFile(providersPath, JSON.stringify(existingConfig, null, 2), 'utf8');
        console.log(`[Model Discovery] Injected ${injectedCount} candidates directly into providers.json for OpenRouter.`);
      } else {
        console.log(`[Model Discovery] No novel candidates to inject for OpenRouter.`);
      }

      return { promoted: this.discoveredModels.map(m => m.id), status: 'live' };
    } catch (err) {
      console.error(`[Model Discovery] Failed to log candidates: ${err.message}`);
      return false;
    }
  }
}
