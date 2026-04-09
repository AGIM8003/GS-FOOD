import fs from 'fs/promises';
import { join } from 'path';

const REQ_LOG = join(process.cwd(),'data','metrics.log');
const OUT = join(process.cwd(),'out','improvements');

export async function analyzeAndRecommend(){
  try{
    await fs.mkdir(OUT,{ recursive:true });
    const t = await fs.readFile(REQ_LOG,'utf8');
    const lines = t.trim().split('\n').map(l=> JSON.parse(l));
    // naive analysis: count fallback events
    const fallbackCount = lines.filter(l=> l.event==='request_handled' && l.cache_hit===false).length;
    const rec = { timestamp: new Date().toISOString(), fallbackCount, suggestion: fallbackCount>10 ? 'review provider ordering and cache thresholds' : 'no action' };
    const outPath = join(OUT, `recommendation-${Date.now()}.json`);
    await fs.writeFile(outPath, JSON.stringify(rec,null,2),'utf8');
    return rec;
  }catch(e){ return { ok:false, error: e.message }; }
}
