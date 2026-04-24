/**
 * FREE AI — JavaScript SDK Client (runtime version of the typed SDK)
 *
 * Usage:
 *   import { FreeAIClient } from '@freeai/sdk';
 *   const client = new FreeAIClient({ baseUrl: 'http://localhost:3000' });
 */

export class FreeAIClient {
  constructor(opts) {
    this.baseUrl = String(opts.baseUrl || 'http://localhost:3000').replace(/\/+$/, '');
    this.adminKey = opts.adminKey || null;
    this.inferKey = opts.inferKey || null;
    this.tenantId = opts.tenantId || null;
    this.timeout = opts.timeout ?? 30000;
  }

  _headers(admin = false) {
    const h = { 'Content-Type': 'application/json' };
    if (admin && this.adminKey) h['X-Admin-Key'] = this.adminKey;
    if (!admin && this.inferKey) h['Authorization'] = `Bearer ${this.inferKey}`;
    if (this.tenantId) h['X-Tenant-Id'] = this.tenantId;
    return h;
  }

  async _req(method, path, body, admin = false) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this._headers(admin),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      return res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  infer(req) { return this._req('POST', '/v1/infer', req); }
  swarmRun(graph) { return this._req('POST', '/v1/swarm/run', graph); }

  listSwarmRuns() { return this._req('GET', '/admin/swarm-runs', undefined, true); }
  getSwarmRun(runId) { return this._req('GET', `/admin/swarm-runs/${runId}`, undefined, true); }
  resumeSwarmRun(runId, opts) { return this._req('POST', `/admin/swarm-runs/${runId}/resume`, opts || {}, true); }

  getSwarmSnapshots(runId) { return this._req('GET', `/admin/swarm-runs/${runId}/snapshots`, undefined, true); }
  rewindSwarmRun(runId, snapshotIndex) { return this._req('POST', `/admin/swarm-runs/${runId}/rewind`, { snapshot_index: snapshotIndex }, true); }

  listSwarmReviews() { return this._req('GET', '/admin/swarm-reviews', undefined, true); }
  getSwarmReview(id) { return this._req('GET', `/admin/swarm-reviews/${id}`, undefined, true); }
  approveSwarmReview(id, opts) { return this._req('POST', `/admin/swarm-reviews/${id}/approve`, opts || {}, true); }
  rejectSwarmReview(id, opts) { return this._req('POST', `/admin/swarm-reviews/${id}/reject`, opts || {}, true); }

  getSwarmPolicySummary() { return this._req('GET', '/admin/swarm-policy-summary', undefined, true); }
  getSwarmToolRegistry() { return this._req('GET', '/admin/swarm-tool-registry', undefined, true); }
  getSwarmGraphSummary() { return this._req('GET', '/admin/swarm-graph-summary', undefined, true); }
  getSwarmCheckpoints() { return this._req('GET', '/admin/swarm-checkpoints', undefined, true); }
  getSwarmTraceSummary() { return this._req('GET', '/admin/swarm-trace-summary', undefined, true); }

  health() { return this._req('GET', '/health'); }
  healthLive() { return this._req('GET', '/health/live'); }
  healthReady() { return this._req('GET', '/health/ready'); }
}

export default FreeAIClient;
