import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const testsDir = 'tests';
const tests = fs.readdirSync(testsDir).filter(f=> f.endsWith('.js'));
const results = [];
for (const t of tests){
  const r = spawnSync('node', [path.join(testsDir,t)], { encoding: 'utf8' });
  results.push({ test: t, ok: r.status === 0, stdout: r.stdout ? r.stdout.slice(0,1000) : '', stderr: r.stderr ? r.stderr.slice(0,1000) : '' });
}

// read latest import summary
const importsDir = path.join('evidence','imports');
const summaries = fs.existsSync(importsDir) ? fs.readdirSync(importsDir).filter(f=> f.startsWith('summary-') && f.endsWith('.json')).sort().reverse() : [];
let importSummary = null;
if (summaries.length){ importSummary = JSON.parse(fs.readFileSync(path.join(importsDir,summaries[0]),'utf8')); }

const out = {
  ts: new Date().toISOString(),
  importSummaryFile: summaries[0] || null,
  importSummary: importSummary,
  tests: results,
  overall_ok: results.every(r=> r.ok) && importSummary !== null
};

const outPath = path.join('evidence','run-summary-' + Date.now() + '.json');
fs.mkdirSync('evidence',{ recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out,null,2));
console.log('WROTE', outPath);
