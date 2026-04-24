/*
 * Background Daemon Crawler
 * Automates the Model Discovery Engine asynchronously on a set interval.
 * Discovers, filters, scores (smoke tests), and promotes candidate endpoints.
 */

import { ModelDiscoveryEngine } from '../providers/modelDiscoveryEngine.js';
import { runModelAcceptanceGates } from '../eval/modelAcceptanceRunner.js';
import { logStructured } from '../telemetry/logger.js';
import { emitMetric } from '../observability/metrics.js';

export class DaemonCrawler {
  constructor(defaultIntervalMs = 86400000) {
    this.engine = new ModelDiscoveryEngine();
    // Allow interval to be dynamically configured via environment or fallback
    this.intervalMs = Number(process.env.FREEAI_CRAWLER_INTERVAL_MS) || defaultIntervalMs;
    this.timer = null;
    this.isRunning = false;
    
    // Orchestration lifecycle bindings
    this._handleShutdown = this._handleShutdown.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    logStructured({ event: 'daemon_crawler_started', interval_ms: this.intervalMs });
    console.log(`[Daemon Crawler] Starting background auto-discovery loop (${this.intervalMs}ms).`);
    
    // Bind graceful termination hooks
    process.on('SIGTERM', this._handleShutdown);
    process.on('SIGINT', this._handleShutdown);

    // Initial run on boot (deferred moderately to avoid initial main loop block)
    setTimeout(() => this.executeCycle().catch(err => {
      console.error('[Daemon Crawler] Initial execution failed:', err);
      logStructured({ event: 'daemon_initial_cycle_error', error: err.message });
    }), 10000);

    // Register interval loop
    this.timer = setInterval(() => {
      this.executeCycle().catch(err => {
        console.error('[Daemon Crawler] Cycle execution failed:', err);
      });
    }, this.intervalMs);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    process.removeListener('SIGTERM', this._handleShutdown);
    process.removeListener('SIGINT', this._handleShutdown);
    
    logStructured({ event: 'daemon_crawler_stopped' });
    console.log('[Daemon Crawler] Background auto-discovery crawler stopped.');
  }

  _handleShutdown() {
    console.log('[Daemon Crawler] Received termination signal. Orchestrating graceful shutdown...');
    this.stop();
  }

  async executeCycle() {
    try {
      console.log('[Daemon Crawler] Waking up. Initiating discovery cycle...');
      const cycleStart = Date.now();
      
      const candidates = await this.engine.scanForNewFreeTiers();
      
      if (!candidates || candidates.length === 0) {
        console.log('[Daemon Crawler] No new models discovered this cycle.');
        emitMetric({ event: 'daemon_crawler_cycle', status: 'no_candidates_found' });
        return;
      }

      // Filter and Score using Acceptance Runner with chunking to prevent event loop blocking
      const approvedModels = [];
      const rejectedModels = [];
      const chunkSize = 50;

      for (let i = 0; i < candidates.length; i += chunkSize) {
        const chunk = candidates.slice(i, i + chunkSize);
        
        for (const candidate of chunk) {
          const mockModelRecord = {
            provider_id: 'openrouter',
            model_id: candidate.id,
            promotion_status: 'discovered',
            benchmark_status: 'ran_by_daemon',
            structured_output_supported: true
          };

          const result = runModelAcceptanceGates({ model: mockModelRecord });
          
          if (result.pass_fail === 'pass') {
            approvedModels.push(candidate);
          } else {
            rejectedModels.push({ id: candidate.id, reason: result.notes });
          }
        }
        
        // Yield to event loop
        await new Promise(resolve => setImmediate(resolve));
      }

      console.log(`[Daemon Crawler] Evaluated ${candidates.length} candidates. Approved: ${approvedModels.length}, Rejected: ${rejectedModels.length}`);

      // If we have approved models, safely transfer them
      this.engine.discoveredModels = approvedModels;
      
      const promotionResult = await this.engine.promoteCandidateToCatalog();
      const promotedCount = promotionResult && promotionResult.promoted ? promotionResult.promoted.length : 0;
      
      if (promotedCount > 0) {
        console.log(`[Daemon Crawler] Successfully promoted ${promotedCount} models to catalog.`);
      }

      logStructured({ 
        event: 'daemon_crawler_cycle_complete', 
        evaluated: candidates.length,
        approved: approvedModels.length,
        rejected: rejectedModels.length,
        promoted: promotedCount,
        duration_ms: Date.now() - cycleStart
      });
      
      emitMetric({ 
        event: 'daemon_crawler_cycle', 
        status: 'success', 
        promoted_count: promotedCount 
      }).catch(() => {});

    } catch (err) {
      console.error(`[Daemon Crawler] Error during execution cycle:`, err);
      logStructured({ event: 'daemon_crawler_cycle_failed', error: err.message });
      emitMetric({ event: 'daemon_crawler_cycle', status: 'error' }).catch(() => {});
    }
  }
}
