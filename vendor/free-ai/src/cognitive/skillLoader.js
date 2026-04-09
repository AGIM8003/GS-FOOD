import fs from 'fs/promises';
import { join } from 'path';

export async function loadSkillsForRequest(ids=[]) {
  const out = [];
  const base = join(process.cwd(), 'skills');
  for (const id of ids) {
    const p = join(base, `${id}.json`);
    try {
      const t = await fs.readFile(p,'utf8');
      const s = JSON.parse(t);
      // enforce max size for demo
      if ((s.content||'').length > 10000) continue;
      out.push(s);
    } catch(e) {}
  }
  return out;
}
