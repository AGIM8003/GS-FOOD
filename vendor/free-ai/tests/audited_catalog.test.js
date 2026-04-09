import fs from 'fs';
import path from 'path';

function fail(msg){ console.error(msg); process.exit(2); }

const activePath = path.join(process.cwd(),'skills','active_catalog.json');
if (!fs.existsSync(activePath)) fail('active_catalog.json not found; run scripts/run_import_and_audit.js');
const active = JSON.parse(fs.readFileSync(activePath,'utf8'));
if (!Array.isArray(active.skills)) fail('active_catalog missing skills array');
if (active.skills.length < 100) fail(`active_catalog must have >=100 skills, found ${active.skills.length}`);

// validate required keys
const required = ['id','name','version','purpose','tags','triggers','exclusions','dependencies','latency_hint','token_budget_hint','risk_class','output_contract','prompt_fragments','validation_rules','source_type','source_reference','source_license','imported_at','schema_version','enabled','deprecated'];
const ids = new Set();
for (const s of active.skills){
  for (const k of required){ if (s[k] === undefined) fail(`skill ${s.id||'<no-id>'} missing ${k}`); }
  if (ids.has(s.id)) fail(`duplicate skill id ${s.id}`);
  ids.add(s.id);
}

console.log('audited_catalog test OK -', active.skills.length, 'skills');
process.exit(0);
