/**
 * MCP (Model Context Protocol) & A2A (Agent-to-Agent) Adapter.
 *
 * Bridges external MCP tools into the swarm tool registry and provides
 * a typed protocol for remote agent communication.
 */

const mcpTools = new Map();
const a2aAgents = new Map();

function registerMcpTool(descriptor) {
  if (!descriptor || !descriptor.name || typeof descriptor.name !== 'string') {
    throw new Error('MCP tool requires name');
  }
  const entry = {
    name: descriptor.name,
    description: descriptor.description || '',
    input_schema: descriptor.input_schema || null,
    server_url: descriptor.server_url || null,
    timeout_ms: descriptor.timeout_ms || 10000,
    registered_at: new Date().toISOString(),
    invocation_count: 0,
    last_error: null,
  };
  mcpTools.set(descriptor.name, entry);
  return entry;
}

function getMcpTool(name) {
  return mcpTools.get(name) || null;
}

function listMcpTools() {
  return [...mcpTools.values()].map((t) => ({
    name: t.name,
    description: t.description,
    server_url: t.server_url,
    invocation_count: t.invocation_count,
  }));
}

async function invokeMcpTool(name, input) {
  const tool = mcpTools.get(name);
  if (!tool) return { ok: false, error: `mcp_tool_not_found: ${name}` };

  tool.invocation_count++;
  const t0 = Date.now();

  try {
    if (!tool.server_url) {
      return { ok: false, error: 'mcp_tool_no_server_url', duration_ms: Date.now() - t0 };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), tool.timeout_ms);

    const resp = await fetch(tool.server_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: name, input }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      tool.last_error = `HTTP ${resp.status}`;
      return { ok: false, error: `mcp_http_${resp.status}`, duration_ms: Date.now() - t0 };
    }

    const result = await resp.json();
    return { ok: true, output: result, duration_ms: Date.now() - t0 };
  } catch (err) {
    tool.last_error = err?.message || String(err);
    return { ok: false, error: err?.message || String(err), duration_ms: Date.now() - t0 };
  }
}

function registerA2AAgent(descriptor) {
  if (!descriptor || !descriptor.agent_id) throw new Error('A2A agent requires agent_id');
  const entry = {
    agent_id: descriptor.agent_id,
    name: descriptor.name || descriptor.agent_id,
    capabilities: descriptor.capabilities || [],
    endpoint: descriptor.endpoint || null,
    protocol_version: descriptor.protocol_version || 'a2a/1.0',
    registered_at: new Date().toISOString(),
  };
  a2aAgents.set(descriptor.agent_id, entry);
  return entry;
}

function listA2AAgents() {
  return [...a2aAgents.values()];
}

async function sendA2AMessage(agentId, message) {
  const agent = a2aAgents.get(agentId);
  if (!agent) return { ok: false, error: `a2a_agent_not_found: ${agentId}` };
  if (!agent.endpoint) return { ok: false, error: 'a2a_no_endpoint' };

  try {
    const resp = await fetch(agent.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-A2A-Protocol': agent.protocol_version },
      body: JSON.stringify({ from: 'freeai', to: agentId, message }),
    });
    if (!resp.ok) return { ok: false, error: `a2a_http_${resp.status}` };
    return { ok: true, response: await resp.json() };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

function __resetMcpForTests() {
  mcpTools.clear();
  a2aAgents.clear();
}

export {
  registerMcpTool, getMcpTool, listMcpTools, invokeMcpTool,
  registerA2AAgent, listA2AAgents, sendA2AMessage,
  __resetMcpForTests,
};
