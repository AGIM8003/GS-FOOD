import fs from 'fs';
import path from 'path';
import { resolveAdaptiveCapabilities } from '../src/capability/acquisition.js';

const prompt = 'Create an adaptive persona and workflow for insurance claims compliance escalation with audit controls and research-backed response guidance.';
const result = await resolveAdaptiveCapabilities({
  prompt,
  payload: { allow_external_research: false },
  intent: { intent_family: 'compose', topics: ['insurance', 'claims', 'compliance', 'audit'] },
  context: { domain: 'legal', skill_hints: [], persona_hints: [], acquisition_hints: ['dynamic_capability_review'], risk_flags: ['compliance'] },
  reasoning: { acquisition_recommendation: { need_persona: true, need_skills: true }, strategy_type: 'compose' },
  personaResult: { final_persona_id: 'default', confidence: 0.2, source: 'fallback', persona: { id: 'default', version: 'v1' } },
  skills: [],
});

if (!result.report || !result.report.activated_now) {
  console.error('capability acquisition did not activate generated assets');
  process.exit(2);
}
if (!result.personaResult?.final_persona_id?.startsWith('generated_')) {
  console.error('generated persona was not selected');
  process.exit(2);
}
if (!result.skills.some((skill) => skill.id.startsWith('generated_'))) {
  console.error('generated skill was not activated');
  process.exit(2);
}

const personaPath = path.join(process.cwd(), 'personas', `${result.personaResult.final_persona_id}.json`);
if (!fs.existsSync(personaPath)) {
  console.error('generated persona file missing');
  process.exit(2);
}

console.log('capability_acquisition test OK');
