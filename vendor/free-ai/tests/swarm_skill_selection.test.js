import assert from 'assert';
import { orchestrateSkills } from '../src/skill/orchestrator.js';
import { loadPersona } from '../src/persona/registry.js';
import { writeSwarmRollupReceipt } from '../src/swarm/receiptAggregate.js';
import { validate } from '../src/schemaValidator.js';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

async function assertReviewerPrefersAdversarialOrMerge() {
  const persona = await loadPersona('swarm_role_reviewer');
  assert.ok(persona, 'swarm_role_reviewer persona must load');
  const intent = {
    raw: 'swarm fan-in merge review',
    intent_family: 'swarm_task',
    swarm_role: 'reviewer',
    topics: [],
    domain_signals: [],
  };
  const mounted = await orchestrateSkills({
    intent,
    persona,
    memoryHits: [],
    maxSkills: 8,
    context: null,
    reasoning: null,
  });
  const ids = mounted.map((s) => s.id);
  const hasSwarmSkill = ids.some((id) => id.startsWith('swarm_'));
  assert.ok(hasSwarmSkill, `expected at least one swarm_* skill in mount order, got ${ids.join(',')}`);
  const hit = ids.find((id) => id === 'swarm_adversarial_review_01' || id === 'swarm_merge_reports_01');
  assert.ok(hit, `expected adversarial or merge swarm skill near top, got ${ids.slice(0, 5).join(',')}`);
}

async function assertCoderPrefersScoping() {
  const persona = await loadPersona('swarm_role_coder');
  assert.ok(persona);
  const intent = {
    raw: 'scope subtask boundary handoff',
    intent_family: 'swarm_task',
    swarm_role: 'coder',
    topics: [],
    domain_signals: [],
  };
  const mounted = await orchestrateSkills({ intent, persona, memoryHits: [], maxSkills: 8, context: null, reasoning: null });
  const ids = mounted.map((s) => s.id);
  assert.ok(ids.includes('swarm_subtask_scoping_01'), `expected swarm_subtask_scoping_01 in ${ids.join(',')}`);
}

async function rollupWritesToCustomDir() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'freeai-swarm-'));
  const rec = await writeSwarmRollupReceipt(
    {
      swarm_task_id: 'task-correlation-1',
      child_trace_ids: ['t-child-a', 't-child-b'],
      merge_strategy: 'primary_wins',
      engine_trace_id: 't-merge',
    },
    { evidenceRoot: tmp },
  );
  assert.strictEqual(rec.schema_version, 'swarmReceiptAggregate.v1');
  const files = await fs.readdir(tmp);
  const rollupName = files.find((f) => f.startsWith('swarm-rollup-'));
  assert.ok(rollupName, 'rollup file should exist');
  const disk = JSON.parse(await fs.readFile(path.join(tmp, rollupName), 'utf8'));
  assert.deepStrictEqual(disk.child_trace_ids, ['t-child-a', 't-child-b']);
  assert.strictEqual(disk.swarm_task_id, 'task-correlation-1');
}

async function assertAssignmentContextSchema() {
  const doc = {
    schema_version: 'assignmentContext.v1',
    assignment_id: 'asg-1',
    persona_id: 'swarm_role_reviewer',
    skill_ids: ['swarm_adversarial_review_01'],
    swarm_task_id: 'st-1',
    swarm_agent_id: 'w2',
  };
  const v = validate('assignmentContext', doc);
  assert.ok(v.valid, JSON.stringify(v.errors));
}

async function run() {
  await assertAssignmentContextSchema();
  await assertReviewerPrefersAdversarialOrMerge();
  await assertCoderPrefersScoping();
  await rollupWritesToCustomDir();
  console.log('swarm_skill_selection.test OK');
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
