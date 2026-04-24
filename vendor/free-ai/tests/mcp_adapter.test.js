import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerMcpTool, getMcpTool, listMcpTools, registerA2AAgent, listA2AAgents, __resetMcpForTests } from '../src/swarm/mcpAdapter.js';

describe('mcpAdapter', () => {
  beforeEach(() => __resetMcpForTests());

  it('registers and retrieves MCP tool', () => {
    registerMcpTool({ name: 'calculator', description: 'math', server_url: 'http://example.com' });
    const t = getMcpTool('calculator');
    assert.ok(t);
    assert.equal(t.name, 'calculator');
  });

  it('lists MCP tools', () => {
    registerMcpTool({ name: 'a' });
    registerMcpTool({ name: 'b' });
    assert.equal(listMcpTools().length, 2);
  });

  it('rejects tool without name', () => {
    assert.throws(() => registerMcpTool({}));
  });

  it('returns null for unknown tool', () => {
    assert.equal(getMcpTool('missing'), null);
  });

  it('registers A2A agent', () => {
    registerA2AAgent({ agent_id: 'agent1', name: 'Agent One', capabilities: ['research'] });
    const agents = listA2AAgents();
    assert.equal(agents.length, 1);
    assert.equal(agents[0].agent_id, 'agent1');
  });

  it('rejects A2A agent without id', () => {
    assert.throws(() => registerA2AAgent({}));
  });
});
