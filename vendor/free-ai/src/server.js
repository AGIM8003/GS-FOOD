import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Router } from './server/router.js';
import * as Admin from './server/admin.js';
import { loadConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cfg = await loadConfig();
const port = process.env.PORT || cfg.port || 3000;
const startedAt = Date.now();
let startupComplete = false;

const router = new Router(cfg);
import { logStructured } from './telemetry/logger.js';
import { emitMetric } from './observability/metrics.js';

const { readFile } = await import('fs/promises');

async function readJsonBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return JSON.parse(body || '{}');
}

function getHealthReport() {
  const readiness = !!router && !!cfg && startupComplete;
  return {
    status: readiness ? 'ok' : 'starting',
    started_at: new Date(startedAt).toISOString(),
    uptime_s: Math.floor((Date.now() - startedAt) / 1000),
    version: process.env.npm_package_version || '0.1.0',
    probes: {
      live: true,
      ready: readiness,
      startup: startupComplete,
    },
    runtime: {
      provider_count: Array.isArray(router?.registry?.providers) ? router.registry.providers.length : 0,
    },
  };
}

const server = http.createServer(async (req, res) => {
  // Serve admin UI
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    try {
      const html = await readFile(new URL('../web/index.html', import.meta.url));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    } catch (e) {
      // fallthrough to 404
    }
  }

  // Simple EventSource streaming proxy: /v1/stream?prompt=...&persona=...
  if (req.method === 'GET' && req.url && req.url.startsWith('/v1/stream')) {
    // parse query
    try{
      const url = new URL(req.url, `http://localhost:${port}`);
      const prompt = url.searchParams.get('prompt') || '';
      const persona = url.searchParams.get('persona') || undefined;
      // set headers for SSE
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      // call stream handler
      await router.handleRequestStream({ prompt, persona, streaming:true }, res);
      return;
    } catch (e) { res.writeHead(500); res.end('stream error'); return; }
  }

  if (req.method === 'POST' && req.url === '/v1/infer') {
    try {
      const payload = await readJsonBody(req);
      if (payload.streaming) {
        // streaming mode uses router handleRequestStream which writes direct to res
        await router.handleRequestStream(payload, res);
        return;
      }
      const response = await router.handleRequest(payload);
      logStructured({ event: 'request_handled', trace_id: response?.receipt?.trace_id || null, persona: payload.persona || null, cache_hit: !!(response?.receipt && response.receipt && response.receipt.provider_id==='local-cache') });
      emitMetric({ event: 'request_handled', trace_id: response?.receipt?.trace_id || null, cache_hit: !!(response?.receipt && response.receipt && response.receipt.provider_id==='local-cache'), status: response.status || 200 }).catch(()=>{});
      res.writeHead(response.status || 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  if (req.method === 'GET' && req.url === '/health/live') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  if (req.method === 'GET' && req.url === '/health/startup') {
    const status = startupComplete ? 200 : 503;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: startupComplete ? 'started' : 'starting' }));
    return;
  }
  if (req.method === 'GET' && req.url === '/health/ready') {
    const readiness = !!router && !!cfg && startupComplete;
    res.writeHead(readiness ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: readiness ? 'ready' : 'not_ready' }));
    return;
  }
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getHealthReport()));
    return;
  }
  // Admin endpoints
  if (req.method === 'GET' && req.url === '/admin/imports'){
    const s = await Admin.latestImportSummary();
    res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(s||{})); return;
  }
  if (req.method === 'GET' && req.url === '/admin/quarantine'){
    const q = await Admin.listQuarantine(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(q)); return;
  }
  if (req.method === 'GET' && req.url === '/admin/evidence'){
    const e = await Admin.readEvidence('imports'); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e)); return;
  }
  if (req.method === 'GET' && req.url === '/admin/prompts'){
    const e = await Admin.listPromptReceipts(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e)); return;
  }
  if (req.method === 'GET' && req.url === '/admin/validation'){
    const e = await Admin.listValidationReceipts(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e)); return;
  }
  if (req.method === 'GET' && req.url === '/admin/traces'){
    const e = await Admin.listTraceFiles(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e)); return;
  }
  if (req.method === 'GET' && req.url === '/admin/provider-ladder'){
    const e = Admin.getProviderLadderStatus(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
  }
  if (req.method === 'GET' && req.url === '/admin/provider-health'){
    const e = Admin.getProviderHealthMatrix(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
  }
  if (req.method === 'GET' && req.url === '/admin/quota-snapshots'){
    const e = Admin.getQuotaSnapshots(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
  }
  if (req.method === 'GET' && req.url === '/admin/cooldowns'){
    const e = Admin.getCooldownStatus(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
  }
  if (req.method === 'GET' && req.url === '/admin/provider-governance'){
    const e = Admin.getProviderGovernance(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
  }
  if (req.method === 'GET' && req.url === '/admin/decision-graphs'){
    const e = Admin.getDecisionGraphs(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || [])); return;
  }
  if (req.method === 'GET' && req.url === '/admin/prompt-promotions'){
    const e = Admin.getPromptPromotions(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || [])); return;
  }
  if (req.method === 'GET' && req.url === '/admin/receipt-chain'){
    const e = Admin.getReceiptLedgerStatus(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
  }
  if (req.method === 'GET' && req.url === '/admin/memory-graph'){
    const e = await Admin.getMemoryGraphSummary(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
  }
  if (req.method === 'GET' && req.url === '/admin/acquisition'){
    const e = await Admin.getAcquisitionJobs(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || [])); return;
  }
  if (req.method === 'GET' && req.url === '/admin/training'){
    const e = await Admin.getTrainingEngineStatus(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
  }
  if (req.method === 'GET' && req.url === '/admin/training/insights'){
    const e = await Admin.getTrainingInsights(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
  }
  if (req.method === 'GET' && req.url === '/admin/training/overlays'){
    const e = await Admin.getTrainingOverlays(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
  }
  if (req.method === 'GET' && req.url === '/admin/training/review-queue'){
    const e = await Admin.getTrainingReviewItems(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
  }
  if (req.method === 'POST' && req.url === '/admin/training/run'){
    try {
      const e = await Admin.runTrainingNow(); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
    } catch (error) {
      res.writeHead(500,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: error.message })); return;
    }
  }
  if (req.method === 'POST' && req.url === '/admin/training/control'){
    try {
      const payload = await readJsonBody(req);
      const e = await Admin.setTrainingControl(payload.enabled !== false); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
    } catch (error) {
      res.writeHead(500,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: error.message })); return;
    }
  }
  if (req.method === 'POST' && req.url === '/admin/training/profile'){
    try {
      const payload = await readJsonBody(req);
      const e = await Admin.updateTrainingEnvironmentProfile(payload || {}); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
    } catch (error) {
      res.writeHead(500,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: error.message })); return;
    }
  }
  if (req.method === 'POST' && req.url === '/admin/training/review'){
    try {
      const payload = await readJsonBody(req);
      const e = await Admin.reviewTrainingItem(payload || {}); res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(e || {})); return;
    } catch (error) {
      res.writeHead(500,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: error.message })); return;
    }
  }
  if (req.method === 'GET' && req.url && req.url.startsWith('/admin/prompt-preview')){
    try {
      const url = new URL(req.url, `http://localhost:${port}`);
      const prompt = url.searchParams.get('prompt') || '';
      const payload = { prompt, output_contract: url.searchParams.get('output_contract') || undefined, prompt_variant: url.searchParams.get('prompt_variant') || undefined };
      const preview = await router.handleRequest({ ...payload, preview_only: true, timeout: 1000 }).catch(() => null);
      res.writeHead(200,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify(preview || { error: 'preview_failed' })); return;
    } catch (e) {
      res.writeHead(500,{ 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); return;
    }
  }
  res.writeHead(404);
  res.end('not found');
});

server.listen(port, '127.0.0.1', () => {
  startupComplete = true;
  console.log(`FREE AI server listening locally on 127.0.0.1:${port}`);
});
