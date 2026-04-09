import fs from 'fs/promises';
import { join } from 'path';

const METRICS_PATH = join(process.cwd(),'data','metrics.log');

export function logStructured(obj){
  const line = JSON.stringify({ ts: new Date().toISOString(), ...obj });
  // append to metrics log (best-effort)
  fs.appendFile(METRICS_PATH, line + '\n').catch(()=>{});
  console.log(line);
}

export function makeTraceId(){ return `t-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
