import fs from 'fs/promises';
import { join } from 'path';

export async function runReasoning({ translatorOutput, contextSnapshot, memoryHits=[] }){
  const strategy = pickStrategy(contextSnapshot);
  const confidence = Math.max(0.2, Math.min(0.95, 0.7 + (1 - contextSnapshot.ambiguity_score) * 0.2));
  const acquisitionRecommendation = buildAcquisitionRecommendation(translatorOutput, contextSnapshot, confidence);
  const recs = {
    reasoning_mode: 'heuristic.v1',
    strategy_type: strategy,
    decomposition_level: strategy === 'decompose' ? 2 : 1,
    confidence,
    uncertainty_score: contextSnapshot.ambiguity_score || 0.5,
    rationale_codes: [],
    quality_gate_needed: confidence < 0.5,
    escalation_needed: contextSnapshot.urgency > 0.8 && confidence < 0.6,
    persona_recommendation: recommendPersona(contextSnapshot),
    skill_recommendation: recommendSkills(contextSnapshot),
    provider_routing_recommendation: [],
    model_selection_recommendation: [],
    memory_write_candidate: null,
    acquisition_recommendation: acquisitionRecommendation,
    schema_version: 'reasoning.v1'
  };

  // write reasoning evidence
  try{
    const ev = join(process.cwd(),'evidence','reasoning');
    await fs.mkdir(ev,{recursive:true});
    await fs.writeFile(join(ev,`reasoning-${Date.now()}.json`), JSON.stringify(recs,null,2),'utf8');
  }catch(e){}

  return recs;
}

function pickStrategy(ctx){
  if (ctx.intent_family === 'research') return 'synthesize';
  if (ctx.intent_family === 'debug') return 'diagnose';
  if (ctx.urgency > 0.7) return 'execute';
  return 'compose';
}

function recommendPersona(ctx){
  if (ctx.persona_hints && ctx.persona_hints.length) return ctx.persona_hints[0];
  if (ctx.intent_family === 'research') return 'researcher';
  if (ctx.intent_family === 'debug') return 'debugger';
  return 'general';
}

function recommendSkills(ctx){
  const s = [];
  if (ctx.intent_family === 'debug') s.push('debugging_01');
  if (ctx.intent_family === 'research') s.push('research_01');
  if (ctx.memory_retrieval_needed) s.push('retrieval_01');
  if (ctx.tone === 'urgent') s.push('workflow_01');
  return s;
}

function buildAcquisitionRecommendation(translatorOutput, contextSnapshot, confidence) {
  const needPersona = confidence < 0.62 || (contextSnapshot?.acquisition_hints || []).includes('dynamic_capability_review');
  const needSkills = confidence < 0.66 || (contextSnapshot?.skill_hints || []).length === 0;
  return {
    need_persona: needPersona,
    need_skills: needSkills,
    suggested_topics: translatorOutput?.topics || [],
    rationale: [
      confidence < 0.62 ? 'low_confidence' : null,
      (contextSnapshot?.acquisition_hints || []).includes('dynamic_capability_review') ? 'capability_review_hint' : null,
      (contextSnapshot?.skill_hints || []).length === 0 ? 'no_skill_hints' : null,
    ].filter(Boolean),
  };
}
