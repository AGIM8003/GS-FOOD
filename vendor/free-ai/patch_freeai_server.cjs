const fs = require('fs');

let content = fs.readFileSync('src/server.js', 'utf8');

const webhookInjection = `
  // --- CLAUDE 2.0 INTEGRATION: ROUTINE WEBHOOK DAEMON ---
  if (req.method === 'POST' && req.url === '/admin/routines/webhook') {
    try {
      const body = await readJsonBody(req);
      console.log("[FREE-AI-ROUTINES] Received inbound Swarm trigger payload. Wake-up initiated.");
      
      // Auto-spawning a background instance directly into the persistent FREE-AI core
      const runId = "RTN-" + Date.now();
      
      // We signal GREEN dot, showing active routine spin-up
      emitMetric('agent_state_change', { agent_id: runId, status: 'GREEN' });
      
      // Triggers the actual swarm execution graph async
      runSwarmGraph(runId, body.directive || "System triggered routine evaluation", {});
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'Swarm Task Spawned', run_id: runId }));
    } catch (e) {
      res.writeHead(500); 
      res.end(JSON.stringify({ error: e.message })); 
    }
    return;
  }
  // --- END ROUTINE INTEGRATION ---
`;

// Insert the webhook injection right before the prompt-preview endpoint
const targetStr = `  if (req.method === 'GET' && req.url && req.url.startsWith('/admin/prompt-preview')){`;
content = content.replace(targetStr, webhookInjection + '\\n' + targetStr);

fs.writeFileSync('src/server.js', content);
console.log('Successfully injected routine webhook API into FREE AI server.js');
