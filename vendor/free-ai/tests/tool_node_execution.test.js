import assert from 'assert';
import { executeToolNodeV1 } from '../src/swarm/executeToolNode.js';
import { listTools } from '../src/swarm/toolRegistry.js';

const tools = listTools();
assert.ok(tools.length >= 4, 'Registry should have at least 4 default tools');
assert.ok(tools.some((t) => t.tool_id === 'identity_transform'));
assert.ok(tools.some((t) => t.tool_id === 'json_extract_field'));
assert.ok(tools.some((t) => t.tool_id === 'template_render'));
assert.ok(tools.some((t) => t.tool_id === 'lookup_registry'));

{
  const r = await executeToolNodeV1({
    node: { node_id: 't1', node_type: 'tool_node', config: { tool_id: 'identity_transform' } },
    predecessorOutputs: { test: 'hello' },
  });
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.output, { test: 'hello' });
}

{
  const r = await executeToolNodeV1({
    node: { node_id: 't2', node_type: 'tool_node', config: { tool_id: 'json_extract_field', tool_input: { data: '{"name":"test"}', field: 'name' } } },
    predecessorOutputs: {},
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.output.value, 'test');
}

{
  const r = await executeToolNodeV1({
    node: { node_id: 't3', node_type: 'tool_node', config: { tool_id: 'template_render', tool_input: { template: 'Hello {{name}}!', variables: { name: 'World' } } } },
    predecessorOutputs: {},
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.output.rendered, 'Hello World!');
}

{
  const r = await executeToolNodeV1({
    node: { node_id: 't4', node_type: 'tool_node', config: { tool_id: 'lookup_registry', tool_input: { key: 'a', map: { a: 42 } } } },
    predecessorOutputs: {},
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.output.value, 42);
}

{
  const r = await executeToolNodeV1({
    node: { node_id: 't5', node_type: 'tool_node', config: { tool_id: 'nonexistent_tool' } },
    predecessorOutputs: {},
  });
  assert.strictEqual(r.ok, false);
  assert.ok(r.error.includes('tool_not_found'));
}

{
  const r = await executeToolNodeV1({
    node: { node_id: 't6', node_type: 'tool_node', config: { tool_id: 'identity_transform', timeout_ms: 50, expected_output_contract: { required_fields: ['missing_field'] } } },
    predecessorOutputs: { hello: 'world' },
  });
  assert.strictEqual(r.ok, false);
  assert.ok(r.error.includes('output_contract_violation'));
}

console.log('tool_node_execution test OK');
