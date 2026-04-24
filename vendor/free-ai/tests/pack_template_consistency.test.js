import fs from 'fs';
import path from 'path';
import assert from 'assert';

const root = process.cwd();
const template = JSON.parse(fs.readFileSync(path.join(root, 'personas', 'packs', '_template', 'manifest.json'), 'utf8'));
const design = JSON.parse(fs.readFileSync(path.join(root, 'personas', 'packs', 'design-interiors', 'manifest.json'), 'utf8'));

const required = ['pack_id', 'version', 'title', 'description', 'persona_ids', 'skill_ids'];
for (const k of required) {
  assert.ok(k in template, `template missing ${k}`);
  assert.ok(k in design, `design-interiors missing ${k}`);
}

assert.ok(Array.isArray(design.persona_ids) && design.persona_ids.includes('neo_design_expert'));
const neoPath = path.join(root, 'personas', 'neo_design_expert.json');
assert.ok(fs.existsSync(neoPath), 'neo_design_expert persona must exist for example pack');

console.log('pack_template_consistency test OK');
