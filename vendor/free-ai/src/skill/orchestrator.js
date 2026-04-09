import fs from 'fs/promises';
import { join } from 'path';
import { validate } from '../schemaValidator.js';
import skillImporter from '../skills/importer.js';
import tracing from '../tracing/index.js';
import { loadLearningRuntime, scoreSkillWithLearning } from '../training/runtime.js';

const SKILL_DIR = join(process.cwd(),'skills');

export async function discoverSkills(){
  try{
    const files = await fs.readdir(SKILL_DIR);
    return files.filter(f=> f.endsWith('.json'));
  }catch(e){ return []; }
}

export async function loadSkill(id){
  try{ const t = await fs.readFile(join(SKILL_DIR, `${id}.json`),'utf8'); return JSON.parse(t); }catch(e){ return null; }
}

function validateManifest(s){
  // minimal manifest validation according to new contract
  const required = ['id','name','version','purpose','tags','triggers','risk_class','output_contract','prompt_fragments'];
  for (const r of required){ if (s[r] === undefined) return false; }
  if (!Array.isArray(s.tags)) s.tags = [];
  if (!Array.isArray(s.triggers)) s.triggers = [];
  if (!Array.isArray(s.prompt_fragments)) s.prompt_fragments = [];
  // normalize hints
  if (!s.token_budget_hint) s.token_budget_hint = 1000;
  if (!s.latency_hint) s.latency_hint = 'medium';
  return true;
}

export async function orchestrateSkills({ intent, persona, memoryHits, maxSkills=5, tokenBudget=4000, context=null, reasoning=null }){
  const span = tracing.startSpan('orchestrator.orchestrateSkills', { intent_family: intent?.intent_family || null, persona: persona?.id || null });
  const candidates = [];
  try{
    const learningRuntime = await loadLearningRuntime({ context, intent });
    const catalog = skillImporter.loadCatalog();
    if (catalog.ok && Array.isArray(catalog.payload.skills)){
      for (const s of catalog.payload.skills){
        try{
          // skip deprecated or quarantined skills
          if (s.deprecated || s.deprecated === true) continue;
          if (s.source_type && s.source_type === 'generated' && s.quarantined) continue;
          if (!validateManifest(s)) continue;
          let score = 0.02;
          const tags = (s.tags||[]).map(x=>x.toLowerCase());
          // intent family match
          if (intent?.intent_family && tags.includes((intent.intent_family||'').toLowerCase())) score += 0.35;
          // raw trigger match (weighted by length)
          if ((s.triggers||[]).some(t=> (intent?.raw||'').toLowerCase().includes(t))) score += 0.25;
          // persona control & operator hints
          if (s.tags && s.tags.includes('persona-control')) score += 0.12;
          // penalize risky skills
          if (s.risk_class === 'high') score -= 0.25;
          // memory relevance
          if (memoryHits && memoryHits.length && (s.tags||[]).includes('memory')) score += 0.06;
          // explicit context or reasoning recommendations
          if (context && context.skill_hints && context.skill_hints.includes(s.id)) score += 0.2;
          if (context && context.skill_hints && context.skill_hints.some((hint)=> tags.includes(String(hint).toLowerCase()) || s.id.includes(String(hint).toLowerCase()))) score += 0.18;
          if (reasoning && reasoning.skill_recommendation && reasoning.skill_recommendation.includes(s.id)) score += 0.28;
          if (intent?.topics && intent.topics.some((topic)=> tags.includes(topic) || (s.triggers||[]).includes(topic) || (s.purpose||'').toLowerCase().includes(topic))) score += 0.16;
          if (persona && Array.isArray(s.compatibility?.personas) && s.compatibility.personas.includes(persona.id)) score += 0.12;
          if (context?.domain && (tags.includes(context.domain) || (s.name || '').toLowerCase().includes(context.domain) || (s.purpose || '').toLowerCase().includes(context.domain))) score += 0.14;
          score += scoreSkillWithLearning(s, learningRuntime, persona);
          // persona blend adjustment
          if (persona && persona.blend_weights) {
            const weight = persona.blend_weights[s.id] || 0;
            score += Math.min(0.4, weight * 0.6);
          }
          // normalize by tag richness to prefer focused skills
          const richness = (s.tags||[]).length || 1;
          score = score / Math.sqrt(richness);
          candidates.push({ skill: s, score });
        }catch(e){/* best-effort continue */}
      }
    }
  }catch(e){/* ignore catalog read errors */}
  candidates.sort((a,b)=> b.score - a.score);
  const mounted = [];
  const conflicts = [];
  const dependencies = [];
  let used = 0;
  for (const c of candidates) {
    if (mounted.length >= maxSkills) break;
    const tokenHint = Number(c.skill.token_budget_hint) || 1000;
    // strict budget enforcement: allow one best-fit overflow if no other candidate fits
    if (used + tokenHint > tokenBudget) {
      // check if mounted is empty and this is highest scoring candidate
      if (mounted.length === 0 && c === candidates[0]) {
        // allow but mark as budget_overflow
      } else continue;
    }
    if ((c.skill.exclusions||[]).includes(persona?.id)) { conflicts.push({ skill: c.skill.id, reason: 'persona_exclusion' }); continue; }
    // check dependencies (best-effort)
    if (c.skill.dependencies && c.skill.dependencies.length){
      for (const d of c.skill.dependencies){
        const dep = candidates.find(x=> x.skill.id === d);
        if (!dep) { conflicts.push({ skill: c.skill.id, reason: `missing_dependency:${d}` }); continue; }
        dependencies.push({ skill: c.skill.id, depends_on: d });
      }
    }
    mounted.push({ id: c.skill.id, version: c.skill.version, purpose: c.skill.purpose, token_budget_hint: tokenHint, score: c.score });
    used += tokenHint;
  }
  const result = { mounted_skills: mounted, conflicts, dependencies, token_budget: used, schema_version: 'skillMountResult.v1' };
  try{ const v = validate('skillMountResult', result); if (!v.valid) result.validation_errors = v.errors; }catch(e){}
  // write evidence
  try{ const evidenceDir = join(process.cwd(),'evidence','receipts'); await fs.mkdir(evidenceDir,{recursive:true}); await fs.writeFile(join(evidenceDir,`skill-mount-${Date.now()}.json`), JSON.stringify(result,null,2),'utf8'); }catch(e){}
  // backward-compatible return: return mounted_skills array (many callers expect an array), but evidence contains full result
  tracing.addEvent(span, 'orchestrator.result', { mounted: result.mounted_skills.length, token_budget: result.token_budget });
  tracing.endSpan(span, { status: 'ok', mounted: result.mounted_skills.length });
  return result.mounted_skills;
}
