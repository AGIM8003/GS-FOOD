import fs from 'fs/promises';
import { join } from 'path';

function detectLanguage(text){ return 'en'; }

function detectTone(text){
  const t = (text||'').trim();
  if (/\bplease\b/i.test(t)) return 'polite';
  if (/\bnow\b|!{1,}/.test(t)) return 'urgent';
  if (/^\s*hi\b|^\s*hello\b/i.test(t)) return 'casual';
  return 'neutral';
}

function detectUrgency(text){
  if (!text) return 0;
  let score = 0;
  if (/[!]{2,}/.test(text)) score += 0.6;
  if (/\bnow\b|\bASAP\b/i.test(text)) score += 0.5;
  if (text.length < 40) score += 0.1;
  return Math.min(1, score);
}

function detectAmbiguity(text){
  if (!text) return 1.0;
  const qs = (text.match(/\?/g)||[]).length;
  const tokens = text.split(/\s+/).length;
  const ambiguity = Math.min(1, (qs===0?0.6:0.2) + Math.max(0, 5 - Math.log(tokens+1))/10);
  return ambiguity;
}

function extractTopics(text, limit = 6) {
  const stopwords = new Set(['the','and','for','that','this','with','from','into','your','have','will','need','user','engine','agent','context','skill','persona','build','response']);
  const counts = new Map();
  for (const token of (text || '').toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) || []) {
    if (stopwords.has(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()].sort((a,b)=> b[1]-a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([token]) => token);
}

function detectDomainSignals(text) {
  const lower = (text || '').toLowerCase();
  const signals = [];
  if (/persona|prompt|skill|tool|agent|routing|orchestrat/.test(lower)) signals.push('ai_systems');
  if (/api|endpoint|http|server|node|javascript|code|repo/.test(lower)) signals.push('software');
  if (/research|study|paper|compare|evidence/.test(lower)) signals.push('research');
  if (/finance|bank|payment|invoice/.test(lower)) signals.push('finance');
  if (/medical|clinical|patient|health/.test(lower)) signals.push('health');
  if (/legal|contract|policy|compliance/.test(lower)) signals.push('legal');
  return [...new Set(signals)];
}

function inferPersonaNeeds({ intent_family, domainSignals, topics, tone }) {
  const needs = [];
  if (domainSignals.includes('ai_systems')) needs.push('technical');
  if (intent_family === 'research') needs.push('researcher');
  if (intent_family === 'debug') needs.push('operator');
  if (tone === 'urgent') needs.push('operator');
  if (topics.includes('teacher') || topics.includes('explain')) needs.push('teacher');
  return [...new Set(needs)];
}

function inferSkillNeeds({ intent_family, domainSignals, topics }) {
  const needs = [];
  if (intent_family === 'research') needs.push('research');
  if (intent_family === 'debug') needs.push('debugging');
  if (intent_family === 'compose') needs.push('planning');
  if (topics.includes('summarize') || topics.includes('summary')) needs.push('summarization');
  if (domainSignals.includes('ai_systems')) needs.push('persona-control');
  return [...new Set(needs)];
}

export async function translateIntent(text, { memory=null, prevContext=null } = {}) {
  const raw = (text||'').trim();
  const normalized = raw.replace(/\s+/g,' ').trim();
  const language = detectLanguage(raw);
  const tone = detectTone(raw);
  const urgency = detectUrgency(raw);
  const ambiguity = detectAmbiguity(raw);
  const topics = extractTopics(raw);
  const domainSignals = detectDomainSignals(raw);

  // intent family heuristics
  let intent_family = 'chat';
  const l = normalized.toLowerCase();
  if (l.endsWith('?')) intent_family = 'question';
  else if (/\bwrite|compose|draft\b/.test(l)) intent_family = 'compose';
  else if (/\brun|execute|start\b/.test(l)) intent_family = 'command';
  else if (/\bfix|bug|error|stack\b/.test(l)) intent_family = 'debug';
  else if (/\bresearch|paper|study|literature\b/.test(l)) intent_family = 'research';

  const entities = [];
  // lightweight entity detection (emails, urls)
  const urlMatch = normalized.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) entities.push({ type:'url', value: urlMatch[0] });

  const out = {
    raw: raw,
    normalized_text: normalized,
    language,
    intent_family,
    task_type: intent_family,
    entities,
    constraints: {},
    output_preferences: {},
    topics,
    domain_signals: domainSignals,
    continuity: prevContext ? (prevContext.continuity_score || 0.5) : 0.5,
    risk_flags: [],
    ambiguity_flags: ambiguity,
    memory_need: (memory && memory.length>0) ? true : false,
    persona_need: inferPersonaNeeds({ intent_family, domainSignals, topics, tone }),
    skill_need: inferSkillNeeds({ intent_family, domainSignals, topics }),
    model_preference_hint: null,
    acquisition_hint: domainSignals.includes('ai_systems') || topics.length >= 4 ? 'dynamic_capability_review' : null,
    tone,
    urgency,
    confidence: 0.6 + (1-ambiguity)*0.2,
    schema_version: 'translator.v1'
  };

  // write translation receipt (best-effort)
  try{
    const evidenceDir = join(process.cwd(),'evidence','translations');
    await fs.mkdir(evidenceDir,{recursive:true});
    const rpath = join(evidenceDir, `translation-${Date.now()}.json`);
    await fs.writeFile(rpath, JSON.stringify(out,null,2),'utf8');
  }catch(e){}

  return out;
}

