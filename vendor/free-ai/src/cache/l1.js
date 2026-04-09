import fs from 'fs/promises';
import { join } from 'path';

export function loadL1(root) {
  const path = join(root, 'data', 'cache.json');
  let mem = new Map();

  async function persist() {
    try { await fs.mkdir(join(root, 'data'), { recursive: true }); await fs.writeFile(path, JSON.stringify(Object.fromEntries(mem)), 'utf8'); } catch(e){}
  }

  (async()=>{
    try {
      const t = await fs.readFile(path, 'utf8');
      const obj = JSON.parse(t||'{}');
      mem = new Map(Object.entries(obj));
    } catch(e){}
  })();

  return {
    get(k) { return mem.has(k) ? mem.get(k) : null; },
    set(k,v) { mem.set(k,v); persist(); }
  };
}
