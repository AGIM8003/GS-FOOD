import fs from 'fs';
import path from 'path';

const catalogPath = path.join(process.cwd(), 'skills', 'catalog.json');
if (!fs.existsSync(catalogPath)) {
  console.error('catalog not found:', catalogPath); process.exit(2);
}
const catalog = JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const existing = catalog.skills || [];
const startIdx = existing.length + 1;
const target = 110;
const families = ['planning','coding','debugging','architecture','research','retrieval','summarization','memory','persona_control','metacognition','reasoning','evaluation','routing','safety','reflection','invention','evidence','documentation','prompt','fallback','model_hygiene','observability','testing','kg','obsidian','workflow','quality','translator','continuity','ambiguity','contradiction'];

function makeSkill(i){
  const family = families[i % families.length];
  const id = `gen_${String(i).padStart(3,'0')}`;
  const name = `Generated ${family} skill ${i}`;
  const skill = {
    id,
    name,
    version: 'v1',
    purpose: `Auto-generated ${family} helper ${i}`,
    tags: [family],
    triggers: [family, `${family}_${i}`],
    exclusions: [],
    dependencies: [],
    latency_hint: i % 3 === 0 ? 'low' : (i % 3 === 1 ? 'medium' : 'high'),
    token_budget_hint: 200 + (i%10)*50,
    risk_class: (i%7===0) ? 'high' : (i%5===0 ? 'medium' : 'low'),
    output_contract: { type: 'object', fields: ['result'] },
    prompt_fragments: [`Auto-generated prompt fragment for ${name}`],
    validation_rules: {},
    source_type: 'generated',
    source_reference: 'local-generator',
    source_license: 'bundled',
    imported_at: new Date().toISOString(),
    enabled: true,
    deprecated: false,
    compatibility: { personas: ['general_assistant'], runtime_modes: ['hybrid'] },
    schema_version: 'skillManifest.v1'
  };
  return skill;
}

for (let i = startIdx; i <= target; i++){
  const s = makeSkill(i);
  existing.push(s);
}

catalog.skills = existing;
catalog.count = existing.length;
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log('expanded catalog to', catalog.skills.length);
