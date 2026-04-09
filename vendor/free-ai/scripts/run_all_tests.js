import { spawnSync } from 'child_process';
import fs from 'fs';
const tests = fs.readdirSync('tests').filter(f=> f.endsWith('.js'));
const summary = [];
for (const t of tests){
  console.log('\n=== RUN', t, '===');
  const r = spawnSync('node', ['tests/' + t], { stdio: 'inherit' });
  summary.push({ test: t, ok: r.status === 0, status: r.status });
}
console.log('\n=== SUMMARY ===');
console.log(JSON.stringify(summary, null, 2));
if (summary.some(s=> !s.ok)) process.exit(2);
process.exit(0);
