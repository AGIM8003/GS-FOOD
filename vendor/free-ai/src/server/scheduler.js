import { runGovernanceCycle } from '../providers/governance.js';
import { summarizeHealthMatrix, recordProviderCapability } from '../providers/healthMatrix.js';
import { snapshotAll } from '../providers/budgetGuardian.js';
import { computeProviderLadder } from '../providers/ladder.js';

let intervalTimer = null;

// Mock list or we could import registries, but keeping it simple for the architectural proxy:
const VENDOR_PROBES = [
  { id: 'openrouter', url: 'https://openrouter.ai/api/v1/models' },
  { id: 'openai', url: 'https://api.openai.com/v1/models' },
  { id: 'gemini', url: 'https://api.openrouter.ai/bridge/google/models' }
];

async function executeScheduledProbe() {
  console.log('[Scheduler] Executing scheduled provider probe cycle...');
  const probeResults = { probes: [] };
  
  for (const v of VENDOR_PROBES) {
    let ok = false;
    let failure_class = null;
    const start = Date.now();
    try {
      const resp = await fetch(v.url, { timeout: 10000 });
      if (resp.ok) {
        ok = true;
      } else {
        failure_class = resp.status === 429 ? 'throttling' : 'http_error';
      }
    } catch (e) {
      failure_class = 'network_error';
    }
    const latency_ms = Date.now() - start;
    
    probeResults.probes.push({
      provider_id: v.id,
      ok,
      latency_ms,
      failure_class
    });
    
    // Auto-update health matrix to reflect network availability
    recordProviderCapability(v.id, 'plain_chat', { ok, latency_ms, failure_class });
  }

  // Reload snapshots globally in engine logic
  const quotaSnapshots = snapshotAll() || {};
  const healthMatrix = summarizeHealthMatrix() || {};
  
  // Actually shift the penalty weights!
  const governanceUpdates = runGovernanceCycle({
    providers: VENDOR_PROBES.map(v => ({ id: v.id })),
    latestProbe: probeResults,
    quotaSnapshots,
    healthMatrix
  });

  console.log('[Scheduler] Governance cycle complete. Updating provider ladder...');
  // Force a re-computation of the ladder globally
  computeProviderLadder(VENDOR_PROBES);
}

export function startScheduler(intervalMs = 300000) { // Default exactly 5 mins
  if (intervalTimer) clearInterval(intervalTimer);
  
  console.log(`[Scheduler] Armed scheduled probe interval every ${intervalMs}ms`);
  
  // Kick off first one immediately
  executeScheduledProbe().catch(e => console.error('[Scheduler] Initial probe error:', e));
  
  intervalTimer = setInterval(() => {
    executeScheduledProbe().catch(e => console.error('[Scheduler] Loop error:', e));
  }, intervalMs);
}

export function stopScheduler() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
    console.log('[Scheduler] Stopped scheduled probe interval.');
  }
}
