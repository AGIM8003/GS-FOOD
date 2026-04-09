import { compilePrompt } from '../src/prompt/compiler.js';

const persona = { id: 'tester', name: 'Tester', system_prompt: 'You are a precise tester assistant.' };
const skills = [ { id: 'summarization_01', name: 'Summarize', purpose: 'Summarize text', prompt_fragments: ['Summarize concisely.'], risk_class: 'low' } ];
const intent = { intent_family: 'summarization', task_type: 'summarize', output_preferences: { format: 'text' } };

const out = compilePrompt('Please summarize the following design notes.', persona, skills, intent, { contextSnapshot: { domain: 'design', continuity_score: 0.6, persona_hints: ['tester'], skill_hints: ['summarization_01'] } });
if (!out.includes('System Persona: Tester')) { console.error('missing persona header'); process.exit(2); }
if (!out.includes('-- Active Skills')) { console.error('missing skills section'); process.exit(2); }
if (!out.includes('EXPLAIN:')) { console.error('missing why panel template'); process.exit(2); }
console.log('prompt_compiler test OK');
process.exit(0);
