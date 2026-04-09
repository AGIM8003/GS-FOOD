import fs from 'fs/promises';
import { join } from 'path';

const METRICS_FILE = join(process.cwd(),'data','metrics.jsonl');

export async function emitMetric(obj){
  const line = JSON.stringify({ ts: new Date().toISOString(), ...obj });
  try{ await fs.appendFile(METRICS_FILE, line + '\n'); }catch(e){}
}

export async function summarizeMetrics(){
  try{
    const t = await fs.readFile(METRICS_FILE,'utf8');
    const lines = t.trim().split('\n').map(l=> JSON.parse(l));
    const total = lines.length;
    const errors = lines.filter(l=> l.event==='request_handled' && l.error).length;
    return { total, errors };
  }catch(e){ return { total:0, errors:0 }; }
}
