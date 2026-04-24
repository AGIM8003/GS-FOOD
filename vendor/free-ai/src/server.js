import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Router } from './server/router.js';
import * as Admin from './server/admin.js';
import { loadConfig } from './config.js';
import { startScheduler } from './server/scheduler.js';

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

  if (req.method === 'POST' && req.url === '/v1/infer/typed') {
    const { handleTypedInference } = await import('./api/internalBridgeRouter.js');
    return handleTypedInference(req, res, router);
  }

  // ALL OTHER INFERENCE ROUTES HAVE BEEN STRIPPED.
  // GS FOOD IS THE ABSOLUTE SINGLE SOURCE OF TRUTH. ALL COGNITION ROUTES MUST PASS THROUGH /v1/infer/typed
  
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
  // Admin endpoints - Stripped off standalone FREE AI interfaces
  // Retaining ONLY the trace extraction endpoint for the GS FOOD Operator integration
  if (req.method === 'GET' && req.url === '/admin/traces') {
    const e = await Admin.listTraceFiles(); 
    res.writeHead(200, { 'Content-Type': 'application/json' }); 
    res.end(JSON.stringify(e)); 
    return;
  }
  
  // ALL OTHER ROUTES BLOCKED TO ENFORCE GS-FOOD OS SUPREMACY
  res.writeHead(404);
  res.end('not found');
});

server.listen(port, '127.0.0.1', () => {
  startupComplete = true;
  console.log(`FREE AI server listening locally on 127.0.0.1:${port}`);
  startScheduler(150000); // Probe every 2.5 minutes
});
