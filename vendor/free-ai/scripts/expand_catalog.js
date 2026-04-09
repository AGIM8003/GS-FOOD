#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const catalogPath = path.join(process.cwd(),'skills','catalog.json');
if (!fs.existsSync(catalogPath)){ console.error('catalog.json missing'); process.exit(2); }
const catalog = JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const base = catalog.skills || [];
const families = ['planning','coding','debugging','research','retrieval','summarization','memory','persona-control','metacognition','reasoning','evaluation','routing','safety','reflection','invention','evidence','documentation','prompt','model-hygiene','observability','testing','workflow','ambiguity','continuity','translator','context','protocol','marketplace'];
let idx = 1;
const existingIds = new Set(base.map(s=> s.id));
while (base.length < 120) {
  const fam = families[base.length % families.length] || 'misc';
  const id = `${fam}_gen_${String(base.length+1).padStart(3,'0')}`;
  if (existingIds.has(id)) { idx++; continue; }
  const skill = {
    id,
    name: `${fam} helper ${base.length+1}`,
    version: 'v1',
    purpose: `Auto-generated helper skill for ${fam}`,
    tags: [fam],
    triggers: [fam, `${fam}_helper`],
    exclusions: [],
    dependencies: [],
    latency_hint: 'low',
    token_budget_hint: 300,
    risk_class: 'low',
    output_contract: { type: 'text' },
    prompt_fragments: [`${fam} helper: produce concise results for ${fam}`],
    validation_rules: {},
    source_type: 'generated',
    source_reference: 'local-generator',
    source_license: 'generated',
    imported_at: new Date().toISOString(),
    enabled: true,
    deprecated: false,
    schema_version: 'skillManifest.v1'
  };
  base.push(skill);
  existingIds.add(id);
}
catalog.skills = base;
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log('Expanded catalog to', catalog.skills.length, 'skills');
