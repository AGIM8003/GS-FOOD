import { selectPersona } from '../src/persona/registry.js';
import { orchestrateSkills } from '../src/skill/orchestrator.js';
import { writeMemory, queryMemory } from '../src/memory/vault.js';

async function testPersonaSelection(){
  const intent = { raw: 'Design an API for a scalable service', intent_family: 'compose' };
  const r = await selectPersona({ intent, memoryHits: [] });
  console.assert(r.persona && (r.persona.id || r.persona.name), 'persona selected');
  console.log('persona selection test OK', r.persona.id || r.persona.name, r.confidence);
}

async function testSkillOrchestration(){
  const intent = { raw: 'Please summarize this report', intent_family: 'question' };
  const persona = { id: 'researcher' };
  const skills = await orchestrateSkills({ intent, persona });
  console.assert(Array.isArray(skills), 'skills array');
  console.log('skill orchestration returned', skills.map(s=>s.id));
}

async function testMemoryWrite(){
  const mem = await writeMemory({ category:'test', subject:'unittest', summary:'a test', structured_payload:{}, source_trace_id:'t-1', confidence:0.9, importance:0.5 });
  console.assert(mem.memory_id, 'memory written');
  const q = await queryMemory({ subject:'unittest' });
  console.assert(q.length>0, 'memory retrievable');
  console.log('memory write and query OK');
}

await testPersonaSelection();
await testSkillOrchestration();
await testMemoryWrite();
