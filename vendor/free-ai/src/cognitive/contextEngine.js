import fs from 'fs/promises';
import { join } from 'path';
import { validate } from '../schemaValidator.js';

export async function buildContext({ translatorOutput, memoryHits=[], prevContext=null }){
  const context = {
    context_id: `c-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    intent_family: translatorOutput.intent_family,
    domain: inferDomain(translatorOutput),
    task_type: translatorOutput.task_type,
    tone: translatorOutput.tone,
    urgency: translatorOutput.urgency,
    risk_flags: translatorOutput.risk_flags || [],
    ambiguity_score: typeof translatorOutput.ambiguity_flags === 'number' ? translatorOutput.ambiguity_flags : 0.5,
    continuity_score: computeContinuity(memoryHits, prevContext),
    missing_info_flags: [],
    conversation_phase: inferPhase(translatorOutput),
    requested_output_form: inferOutputForm(translatorOutput),
    memory_retrieval_needed: translatorOutput.memory_need || false,
    persona_hints: [],
    skill_hints: [],
    provider_hints: [],
    model_hints: [],
    acquisition_hints: [],
    confidence: translatorOutput.confidence || 0.6,
    schema_version: 'contextSnapshot.v1'
  };

  // quick persona and skill hints from intent family
  if (translatorOutput.intent_family === 'debug') { context.persona_hints.push('debugger'); context.skill_hints.push('debugging'); }
  if (translatorOutput.intent_family === 'research') { context.persona_hints.push('researcher'); context.skill_hints.push('research'); }
  if (translatorOutput.intent_family === 'compose') { context.persona_hints.push('writer'); context.skill_hints.push('summarization'); }
  if (translatorOutput.tone === 'urgent') context.persona_hints.push('operator');
  for (const hint of translatorOutput.persona_need || []) context.persona_hints.push(hint);
  for (const hint of translatorOutput.skill_need || []) context.skill_hints.push(hint);
  for (const signal of translatorOutput.domain_signals || []) {
    context.provider_hints.push(signal);
    context.model_hints.push(signal);
  }
  if (translatorOutput.acquisition_hint) context.acquisition_hints.push(translatorOutput.acquisition_hint);
  if ((translatorOutput.topics || []).length >= 4) context.acquisition_hints.push('topic_dense_request');
  context.persona_hints = [...new Set(context.persona_hints)];
  context.skill_hints = [...new Set(context.skill_hints)];
  context.provider_hints = [...new Set(context.provider_hints)];
  context.model_hints = [...new Set(context.model_hints)];
  context.acquisition_hints = [...new Set(context.acquisition_hints)];

  // write context snapshot evidence
  try{
    const ev = join(process.cwd(),'evidence','context');
    await fs.mkdir(ev,{recursive:true});
    await fs.writeFile(join(ev,`${context.context_id}.json`), JSON.stringify(context,null,2),'utf8');
  }catch(e){}

  // validate against schema if available
  try{ const v = validate('contextSnapshot', context); if (!v.valid) context.validation_errors = v.errors; }catch(e){}

  return context;
}

function inferDomain(translatorOutput){
  const t = translatorOutput.normalized_text || '';
  if ((translatorOutput.domain_signals || []).includes('ai_systems')) return 'ai_systems';
  if (/\bapi|endpoint|http\b/i.test(t)) return 'api';
  if (/\bdeploy|docker|k8s|kubernetes\b/i.test(t)) return 'devops';
  if (/\bpolicy|compliance|contract|legal\b/i.test(t)) return 'legal';
  if (/\bpayment|invoice|finance|claims\b/i.test(t)) return 'finance';
  if (/\bbug|stack|trace|error\b/i.test(t)) return 'engineering';
  return 'general';
}

function computeContinuity(memoryHits, prevContext){
  let base = prevContext ? (prevContext.continuity_score||0.5) : 0.5;
  if (memoryHits && memoryHits.length) base = Math.min(1, base + 0.2);
  return base;
}

function inferPhase(translatorOutput){
  if (translatorOutput.intent_family === 'compose') return 'composition';
  if (translatorOutput.intent_family === 'command') return 'execution';
  if (translatorOutput.intent_family === 'question') return 'inquiry';
  return 'interaction';
}

function inferOutputForm(translatorOutput){
  if (/\bjson|yaml|csv\b/i.test(translatorOutput.normalized_text||'')) return 'structured';
  return 'text';
}
