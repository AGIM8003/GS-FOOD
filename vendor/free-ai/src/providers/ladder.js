import fs from 'fs';
import path from 'path';
import { snapshotFor } from './budgetGuardian.js';
import { getProviderCapability } from './healthMatrix.js';
import { getProviderGovernance } from './governance.js';

const storePath = path.join(process.cwd(),'data','provider_ladder.json');
function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }

export function computeProviderLadder(providers, { persona, intent, skills, outputContractId = null } = {}){
  const ladder = { primary_free: [], burst_free: [], starter_credit: [], low_cost_fallback: [], local_only: [] };
  for (const p of providers || []){
    const tag = p.free_tier_class || (p.free ? 'primary_free' : (p.low_cost ? 'low_cost_fallback' : 'starter_credit'));
    if (tag === 'primary_free') ladder.primary_free.push(p);
    else if (tag === 'burst_free') ladder.burst_free.push(p);
    else if (tag === 'starter_credit') ladder.starter_credit.push(p);
    else if (tag === 'low_cost_fallback') ladder.low_cost_fallback.push(p);
    else ladder.low_cost_fallback.push(p);
  }
  const capability = outputContractId && outputContractId !== 'plain_text' ? 'structured_output' : 'plain_chat';
  const isCulinary = intent?.task_type === 'culinary_generation' || intent?.intent_family === 'culinary_generation';
  const rank = (p) => {
    const quota = snapshotFor(p.id);
    const health = getProviderCapability(p.id, capability);
    const governance = getProviderGovernance(p.id);
    const healthBonus = health.healthy ? 0.2 : -0.4;
    const reliability = quota.free_reliability_score || 0;
    const latencyPenalty = Math.min(0.25, (quota.average_latency || 0) / 80000);
    
    let bonus = 0;
    if (isCulinary) {
      if (p.id === 'openrouter') bonus += 1000;
      else if (p.id === 'openai') bonus += 500;
    }
    
    return (p.weight || 0) + (reliability * 10) + healthBonus - latencyPenalty + (governance.route_bonus || 0) + (governance.route_penalty || 0) + bonus;
  };
  for (const key of Object.keys(ladder)) ladder[key].sort((a,b)=> rank(b) - rank(a));
  const chosen = ladder.primary_free[0] || ladder.burst_free[0] || ladder.starter_credit[0] || ladder.low_cost_fallback[0] || ladder.local_only[0] || null;
  const decision = {
    chosen_provider: chosen ? chosen.id : null,
    chosen_tag: chosen ? (chosen.free_tier_class||'primary_free') : null,
    capability,
    timestamp: new Date().toISOString(),
    counts: { primary_free: ladder.primary_free.length, burst_free: ladder.burst_free.length, local_only: ladder.local_only.length },
    ranked: Object.fromEntries(Object.entries(ladder).map(([k, arr]) => [k, arr.map(p => ({ id: p.id, score: rank(p) }))])),
    governance: Object.fromEntries((providers || []).map((p) => [p.id, getProviderGovernance(p.id)])),
  };
  try{ ensureDir(path.dirname(storePath)); fs.writeFileSync(storePath, JSON.stringify({ decision, ladder, providers: providers||[] }, null, 2)); }catch(e){}
  return decision;
}

export function readLastDecision(){ if (fs.existsSync(storePath)) return JSON.parse(fs.readFileSync(storePath,'utf8')); return null; }
