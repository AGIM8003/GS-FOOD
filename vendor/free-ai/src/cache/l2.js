import fs from 'fs/promises';
import { join } from 'path';

const PATH = join(process.cwd(),'data','l2.json');

let store = [];
(async()=>{ try{ const t = await fs.readFile(PATH,'utf8'); store = JSON.parse(t||'[]'); }catch(e){} })();

export function L2Cache(enabled=false){
  return {
    async findSimilar(prompt, persona, skills, threshold=0.9){
      if (!enabled) return null;
      // safe no-op: we don't have embeddings; return null in no-op mode
      return null;
    },
    async upsert(keyMeta, text, embedding){
      if (!enabled) return;
      store.push({ meta:keyMeta, text, embedding, created: new Date().toISOString() });
      try{ await fs.writeFile(PATH, JSON.stringify(store,null,2),'utf8'); }catch(e){}
    }
  };
}
