import fs from 'fs/promises';
import { join } from 'path';
import { validate } from '../schemaValidator.js';
import { createAcquisitionJob } from './acquisition.js';
import selectionV4 from './selection_v4.js';
import { loadLearningRuntime, scorePersonaWithLearning } from '../training/runtime.js';

const PERSONA_DIR = join(process.cwd(),'personas');

export async function listPersonas(){
  try{
    const files = await fs.readdir(PERSONA_DIR);
    return files.filter(f=>f.endsWith('.json'));
  }catch(e){ return []; }
}

export async function loadPersona(id){
  try{
    const t = await fs.readFile(join(PERSONA_DIR, `${id}.json`),'utf8');
    const j = JSON.parse(t);
    // validate manifest if possible
    try{ const v = validate('personaManifest', j); if (!v.valid) j._manifest_validation = v.errors; }catch(e){}
    return j;
  }catch(e){ return null; }
}

export async function selectPersona({ intent, memoryHits, override, tone=null, urgency=0, context=null, reasoning=null }){
  // prefer v4 selector for heuristic improvements when no override is requested
  if (!override) {
    try{
      const v4 = selectionV4.selectPersonaV4 && typeof selectionV4.selectPersonaV4 === 'function' ? await selectionV4.selectPersonaV4({ intent, memoryHits, override, context, reasoning }) : null;
      if (v4 && v4.persona) {
        // write selection evidence
        try{ const evidenceDir = join(process.cwd(),'evidence','receipts'); await fs.mkdir(evidenceDir,{recursive:true}); await fs.writeFile(join(evidenceDir,`persona-selection-v4-${Date.now()}.json`), JSON.stringify(v4,null,2),'utf8'); }catch(e){}
        return v4;
      }
    }catch(e){ /* fallthrough to legacy selection */ }
  }
  const rationale = [];
  // override takes precedence
  if (override) {
    const p = await loadPersona(override);
    if (p) {
      rationale.push('override');
      const out = {
        final_persona_id: p.id,
        persona_version: p.version || 'v1',
        blend_weights: null,
        confidence: 1.0,
        source: 'override',
        rationale_codes: rationale,
        persona: p
      };
      // write selection evidence (best-effort)
      try{
        const evidenceDir = join(process.cwd(),'evidence','receipts');
        await fs.mkdir(evidenceDir, { recursive: true });
        const path = join(evidenceDir, `persona-selection-${Date.now()}.json`);
        await fs.writeFile(path, JSON.stringify(out,null,2),'utf8');
      }catch(e){}
      return out;
    }
    // persona override requested but not present -> queue acquisition and return substitute
    try{
      await createAcquisitionJob({ type: 'persona', id: override, reason: 'requested_override_missing', requested_by: 'request' });
    }catch(e){}
    const fallback = await loadPersona('default');
    return { final_persona_id: fallback?.id || 'default', persona_version: fallback?.version || 'v1', blend_weights: null, confidence: 0.0, source: 'requested_but_missing', rationale_codes: ['override_missing','queued_for_acquisition'], persona: fallback, acquisition_state: 'queued_for_acquisition' };
  }

  const files = await listPersonas();
  const learningRuntime = await loadLearningRuntime({ context, intent });
  const candidates = [];
  for (const f of files) {
    try{
      const t = await fs.readFile(join(PERSONA_DIR,f),'utf8');
      const p = JSON.parse(t);
      let score = 0.05;
      const tags = (p.tags||[]).map(x=>x.toLowerCase());
      // match intent family and context hints
      if ((intent?.intent_family) && tags.includes((intent.intent_family||'').toLowerCase())){ score += 0.35; rationale.push('intent_match'); }
      if (context?.persona_hints && context.persona_hints.includes(p.id)) { score += 0.25; rationale.push('context_hint'); }
      if (context?.persona_hints && context.persona_hints.some((hint)=> tags.includes(String(hint).toLowerCase()))) { score += 0.18; rationale.push('context_tag_hint'); }
      if (context?.domain && (tags.includes(context.domain) || (p.description || '').toLowerCase().includes(context.domain))) { score += 0.18; rationale.push('domain_match'); }
      if (intent?.topics && intent.topics.some((topic)=> tags.includes(topic) || (p.description || '').toLowerCase().includes(topic))) { score += 0.1; rationale.push('topic_match'); }
      if (reasoning?.persona_recommendation && reasoning.persona_recommendation === p.id) { score += 0.3; rationale.push('reasoning_recommendation'); }
      const learningBoost = scorePersonaWithLearning(p, learningRuntime);
      if (learningBoost > 0) { score += learningBoost; rationale.push('training_overlay'); }
      // routing hints
      if (p.routing_hints && intent?.intent_family && p.routing_hints.includes(intent.intent_family)){ score += 0.15; rationale.push('routing_hint'); }
      // memory continuity
      if (memoryHits && memoryHits.length){ score += 0.08; rationale.push('memory_context'); }
      // urgency bumps operator persona or execute capable personas
      const u = (context && context.urgency!==undefined) ? context.urgency : urgency;
      if (u > 0.7 && p.tags && (p.tags.includes('execute') || p.tags.includes('operator'))){ score += 0.2; rationale.push('urgency_bump'); }
      // tone mapping
      if (intent?.tone === 'formal' && p.tags && p.tags.includes('formal')){ score += 0.08; rationale.push('tone_match'); }
      // risk-based de-prioritization
      if (context && context.risk_flags && context.risk_flags.length && p.tags && p.tags.includes('creative')){ score -= 0.15; rationale.push('risk_adjust'); }
      candidates.push({ persona: p, score, file: f });
    }catch(e){}
  }
  // deterministic sort: score desc then filename asc
  candidates.sort((a,b)=> {
    if (b.score !== a.score) return b.score - a.score;
    return a.file.localeCompare(b.file);
  });
  if (!candidates.length) {
    const fallback = await loadPersona('default');
    const out = { final_persona_id: fallback.id, persona_version: fallback.version||'v1', blend_weights: null, confidence:0.5, source:'fallback', rationale_codes:['no_candidates'], persona:fallback, effectiveness_snapshot: null };
    return out;
  }
  const top = candidates[0];
  // blending: allow blend when second close
  const blendAllowed = candidates[1] && (candidates[1].score > top.score - 0.12);
  if (blendAllowed){
    const pA = top.persona; const pB = candidates[1].persona;
    const weights = { [pA.id]: 0.6, [pB.id]: 0.4 };
    const blended = { id: `blend:${pA.id}+${pB.id}`, version: `${pA.version}+${pB.version}`, system_prompt: `${pA.system_prompt}\n${pB.system_prompt}` };
    const out = { final_persona_id: blended.id, persona_version: blended.version, blend_weights: weights, confidence: top.score, source: 'heuristic+blend', rationale_codes:['blend','close_scores'], persona: blended, effectiveness_snapshot: null };
    try{ const evidenceDir = join(process.cwd(),'evidence','receipts'); await fs.mkdir(evidenceDir,{recursive:true}); await fs.writeFile(join(evidenceDir,`persona-selection-${Date.now()}.json`), JSON.stringify(out,null,2),'utf8'); }catch(e){}
    return out;
  }

  // update effectiveness counters (best-effort)
  try{
    const memDir = join(process.cwd(),'memory','persona_effectiveness.json');
    let cur = {};
    try{ cur = JSON.parse(await fs.readFile(memDir,'utf8')); }catch(e){}
    cur[top.persona.id] = cur[top.persona.id] || { selection_count:0, last_selected: null };
    cur[top.persona.id].selection_count = (cur[top.persona.id].selection_count||0) + 1;
    cur[top.persona.id].last_selected = new Date().toISOString();
    await fs.mkdir(join(process.cwd(),'memory'),{recursive:true});
    await fs.writeFile(memDir, JSON.stringify(cur,null,2),'utf8');
  }catch(e){}

  const effectiveness = await readEffectiveness(top.persona.id).catch(()=>null);
  const out = { final_persona_id: top.persona.id, persona_version: top.persona.version||'v1', blend_weights: null, confidence: top.score, source: 'heuristic', rationale_codes: rationale, persona: top.persona, effectiveness_snapshot: effectiveness };
  try{ const evidenceDir = join(process.cwd(),'evidence','receipts'); await fs.mkdir(evidenceDir,{recursive:true}); await fs.writeFile(join(evidenceDir,`persona-selection-${Date.now()}.json`), JSON.stringify(out,null,2),'utf8'); }catch(e){}

  // validate output against personaSelectionResult schema (best-effort)
  try{ const v = validate('personaSelectionResult', out); if (!v.valid) { out.validation_errors = v.errors; } }catch(e){}

  return out;
}

async function readEffectiveness(pid){
  try{
    const memDir = join(process.cwd(),'memory','persona_effectiveness.json');
    const cur = JSON.parse(await fs.readFile(memDir,'utf8'));
    return cur[pid] || null;
  }catch(e){ return null; }
}
