import fs from 'fs';
import path from 'path';

const store = path.join(process.cwd(),'data','provider_quota.json');
function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }

export function snapshotFor(providerId){
  try{ if (fs.existsSync(store)){
    const j = JSON.parse(fs.readFileSync(store,'utf8'));
    return j[providerId] || { requests_per_day:0, tokens_per_day:0, recent_429_count:0, recent_timeout_count:0, success_count:0, failure_count:0, success_rate:1.0, average_latency:0, free_reliability_score:1.0 };
  }}catch(e){}
  return { requests_per_day:0, tokens_per_day:0, recent_429_count:0, recent_timeout_count:0, success_count:0, failure_count:0, success_rate:1.0, average_latency:0, free_reliability_score:1.0 };
}

export function recordUsage(providerId, { requests=1, tokens=0, status=200, latency=0, failure_class=null }={}){
  ensureDir(path.dirname(store));
  let state = {};
  try{ if (fs.existsSync(store)) state = JSON.parse(fs.readFileSync(store,'utf8')); }catch(e){}
  state[providerId] = state[providerId] || { requests_per_day:0, tokens_per_day:0, recent_429_count:0, recent_timeout_count:0, success_count:0, failure_count:0, success_rate:1.0, average_latency:0, free_reliability_score:1.0 };
  const cur = state[providerId];
  cur.requests_per_day += requests;
  cur.tokens_per_day += tokens;
  cur.average_latency = cur.average_latency === 0 ? latency : Math.round((cur.average_latency + latency) / 2);
  if (status >= 200 && status < 400) cur.success_count++;
  else cur.failure_count++;
  if (status === 429 || failure_class === 'rate_limited' || failure_class === 'quota_exhausted') cur.recent_429_count++;
  if (failure_class === 'timeout') cur.recent_timeout_count++;
  const total = Math.max(1, cur.success_count + cur.failure_count);
  cur.success_rate = Number((cur.success_count / total).toFixed(3));
  cur.free_reliability_score = Number(Math.max(0, Math.min(1,
    cur.success_rate - (cur.recent_429_count * 0.05) - (cur.recent_timeout_count * 0.05) - Math.min(0.2, cur.average_latency / 100000)
  )).toFixed(3));
  try{ fs.writeFileSync(store, JSON.stringify(state, null, 2)); }catch(e){}
}

export function snapshotAll(){
  try{ if (fs.existsSync(store)) return JSON.parse(fs.readFileSync(store,'utf8')); }catch(e){}
  return {};
}
