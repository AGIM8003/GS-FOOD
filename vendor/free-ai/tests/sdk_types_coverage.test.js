import assert from 'assert';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const sdkPath = resolve('sdk/freeai-client.ts');
const sdkContent = readFileSync(sdkPath, 'utf-8');

const requiredExports = [
  'FreeAIClient',
  'FreeAIClientOptions',
  'InferRequest',
  'InferResponse',
  'SwarmGraphBody',
  'SwarmRunResult',
  'SwarmNode',
  'SwarmEdge',
  'SwarmNodeConfig',
  'NodeType',
  'EdgeType',
  'RunState',
  'NodeState',
  'ReceiptType',
  'MergeStrategy',
  'ReceiptMode',
  'SchemaVersion',
  'SwarmRunDetail',
  'SwarmSnapshot',
  'RewindResult',
  'ResumeOptions',
  'ToolRegistryEntry',
  'HealthReport',
];

for (const name of requiredExports) {
  assert.ok(sdkContent.includes(name), `SDK should export/define ${name}`);
}

const requiredMethods = [
  'infer', 'swarmRun',
  'listSwarmRuns', 'getSwarmRun', 'resumeSwarmRun',
  'getSwarmSnapshots', 'rewindSwarmRun',
  'listSwarmReviews', 'getSwarmReview', 'approveSwarmReview', 'rejectSwarmReview',
  'getSwarmPolicySummary', 'getSwarmToolRegistry',
  'getSwarmGraphSummary', 'getSwarmCheckpoints', 'getSwarmTraceSummary',
  'health', 'healthLive', 'healthReady',
];

for (const method of requiredMethods) {
  assert.ok(sdkContent.includes(method), `SDK should have method ${method}`);
}

assert.ok(sdkContent.includes('subgraph_node'), 'SDK should include subgraph_node type');
assert.ok(sdkContent.includes('router_node'), 'SDK should include router_node type');
assert.ok(sdkContent.includes('conditional'), 'SDK should include conditional edge type');
assert.ok(sdkContent.includes('max_fan_out'), 'SDK should include max_fan_out field');
assert.ok(sdkContent.includes('allow_cycles'), 'SDK should include allow_cycles field');
assert.ok(sdkContent.includes('max_iterations'), 'SDK should include max_iterations field');

// JS runtime SDK
const jsPath = resolve('sdk/index.js');
const jsContent = readFileSync(jsPath, 'utf-8');
assert.ok(jsContent.includes('class FreeAIClient'), 'JS SDK should export FreeAIClient class');
assert.ok(jsContent.includes('swarmRun'), 'JS SDK should have swarmRun method');
assert.ok(jsContent.includes('rewindSwarmRun'), 'JS SDK should have rewindSwarmRun method');
assert.ok(jsContent.includes('getSwarmToolRegistry'), 'JS SDK should have getSwarmToolRegistry method');

console.log(`PASS: sdk_types_coverage (${requiredExports.length} types, ${requiredMethods.length} methods)`);
