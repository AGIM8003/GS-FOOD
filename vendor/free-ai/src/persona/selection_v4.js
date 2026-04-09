import fs from 'fs/promises';
import { join } from 'path';
import { loadLearningRuntime, scorePersonaWithLearning } from '../training/runtime.js';

// Lightweight Persona Selection v4: uses existing personas with tuned heuristics
export async function selectPersonaV4({ intent, memoryHits, override, context, reasoning }){
  // attempt to load all personas
  const PERSONA_DIR = join(process.cwd(),'personas');
  try{
    const learningRuntime = await loadLearningRuntime({ context, intent });
    const files = await fs.readdir(PERSONA_DIR);
    const candidates = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      try{
        const j = JSON.parse(await fs.readFile(join(PERSONA_DIR,f),'utf8'));
        let score = 0.1;
        const tags = (j.tags||[]).map(t=> t.toLowerCase());
        if (intent?.intent_family && tags.includes((intent.intent_family||'').toLowerCase())) score += 0.4;
        if (context?.persona_hints && context.persona_hints.includes(j.id)) score += 0.25;
        if (context?.persona_hints && context.persona_hints.some((hint)=> tags.includes(String(hint).toLowerCase()))) score += 0.18;
        if (context?.domain && (tags.includes(context.domain) || (j.description || '').toLowerCase().includes(context.domain))) score += 0.18;
        if (intent?.topics && intent.topics.some((topic)=> tags.includes(topic) || (j.description || '').toLowerCase().includes(topic))) score += 0.12;
        if (reasoning?.persona_recommendation && reasoning.persona_recommendation === j.id) score += 0.3;
        if (memoryHits && memoryHits.length) score += 0.05;
        score += scorePersonaWithLearning(j, learningRuntime);
        candidates.push({ persona: j, score, file: f });
      }catch(e){}
    }
    candidates.sort((a,b)=> b.score - a.score);
    if (!candidates.length) return null;
    const top = candidates[0];
    // produce blend if second close
    if (candidates[1] && candidates[1].score > top.score - 0.15){
      const pA = top.persona, pB = candidates[1].persona;
      const weights = { [pA.id]: 0.6, [pB.id]: 0.4 };
      const blended = { id: `blend:${pA.id}+${pB.id}`, version: `${pA.version||'v1'}+${pB.version||'v1'}`, system_prompt: `${pA.system_prompt || ''}\n${pB.system_prompt || ''}` };
      return { final_persona_id: blended.id, persona_version: blended.version, blend_weights: weights, confidence: top.score, source: 'v4-blend', rationale_codes: ['v4:blend'], persona: blended };
    }
    return { final_persona_id: top.persona.id, persona_version: top.persona.version||'v1', blend_weights: null, confidence: top.score, source: 'v4-heuristic', rationale_codes: ['v4:heuristic'], persona: top.persona };
  }catch(e){ return null; }
}

export default { selectPersonaV4 };
