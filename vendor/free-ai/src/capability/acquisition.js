import fs from 'fs/promises';
import path from 'path';
import { createAcquisitionJob, listAcquisitionJobs } from '../persona/acquisition.js';
import { researchCapabilitySources, extractKeywords } from './research.js';

const PERSONA_DIR = path.join(process.cwd(), 'personas');
const SKILL_DIR = path.join(process.cwd(), 'skills');
const EVIDENCE_DIR = path.join(process.cwd(), 'evidence', 'capabilities');

function slugify(text) {
  return (text || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48);
}

function titleCase(text) {
  return (text || '').split(/[_\s-]+/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf8');
}

function topResearchTerms(research) {
  const labels = [
    ...(research?.keywords || []),
    ...(research?.github || []).flatMap((entry) => [entry.title, ...(entry.tags || [])]),
    ...(research?.web || []).map((entry) => entry.title),
  ].join(' ');
  return extractKeywords(labels, 6);
}

function personaLooksWeak(personaResult, context, reasoning) {
  if (!personaResult?.persona) return true;
  if ((personaResult.confidence ?? 0) < 0.58) return true;
  if (personaResult.source === 'fallback' || personaResult.source === 'requested_but_missing') return true;
  if (personaResult.final_persona_id === 'default' && (context?.domain || 'general') !== 'general') return true;
  if (reasoning?.acquisition_recommendation?.need_persona) return true;
  return false;
}

function skillsLookWeak(skills, context, reasoning) {
  if (!Array.isArray(skills) || skills.length === 0) return true;
  const bestScore = Math.max(...skills.map((skill) => Number(skill.score) || 0));
  const hasHintMatch = (context?.skill_hints || []).some((hint) => skills.some((skill) => skill.id === hint || skill.id.includes(hint)));
  if (bestScore < 0.16 && !hasHintMatch) return true;
  if (reasoning?.acquisition_recommendation?.need_skills) return true;
  return false;
}

function buildPersonaCandidate({ prompt, intent, context, reasoning, research }) {
  const domain = context?.domain || 'general';
  const majorTerms = topResearchTerms(research);
  const subject = majorTerms[0] || domain;
  const id = `generated_${slugify(domain)}_${slugify(subject)}_persona`;
  return {
    id,
    version: 'v1',
    name: `${titleCase(domain)} ${titleCase(subject)} Specialist`,
    system_prompt: [
      `You are a domain-specific specialist for ${domain} requests with emphasis on ${subject}.`,
      `Prioritize context fidelity, explicit assumptions, and precise step-by-step guidance.`,
      `Use the nearest valid existing persona behavior when information is incomplete, but adapt the response to ${domain} and ${intent?.intent_family || 'general'} tasks.`,
      `If confidence is limited, state the gap clearly and propose the next concrete move.`
    ].join(' '),
    description: `Generated specialist persona for ${domain} tasks centered on ${subject}.`,
    tags: [...new Set([intent?.intent_family || 'chat', domain, subject, ...(context?.persona_hints || []), ...(majorTerms.slice(1, 4))])],
    routing_hints: [...new Set([intent?.intent_family || 'chat', domain])],
    source_type: 'generated',
    source_reference: 'heuristic+web+github',
    source_license: 'generated',
    enabled: true,
    deprecated: false,
    specialties: majorTerms,
    generated_from_prompt: prompt.slice(0, 240),
  };
}

function buildSkillCandidates({ prompt, intent, context, reasoning, research, personaCandidate }) {
  const domain = context?.domain || 'general';
  const terms = topResearchTerms(research);
  const lead = terms[0] || domain;
  const baseId = `generated_${slugify(domain)}_${slugify(lead)}_${slugify(intent?.intent_family || 'chat')}`;
  const skill = {
    id: `${baseId}_workflow`,
    name: `${titleCase(domain)} ${titleCase(lead)} Workflow`,
    version: 'v1',
    purpose: `Handle ${domain} ${intent?.intent_family || 'general'} requests when bundled skills are weak or absent.`,
    tags: [...new Set([domain, intent?.intent_family || 'chat', 'generated', ...(context?.skill_hints || []), ...terms.slice(0, 3)])],
    triggers: [...new Set(terms.slice(0, 5))],
    exclusions: [],
    dependencies: [],
    latency_hint: 'medium',
    token_budget_hint: 600,
    risk_class: context?.risk_flags?.length ? 'medium' : 'low',
    output_contract: { type: 'object', fields: ['answer', 'why'] },
    prompt_fragments: [
      `Adapt the response to ${domain} context and emphasize ${lead}.`,
      `Use the strongest available persona, preferably ${personaCandidate.id}, and maintain continuity with the active conversation.`,
      `If the domain remains uncertain, expose assumptions and proceed with the closest practical answer instead of blocking.`,
    ],
    validation_rules: {},
    source_type: 'generated',
    source_reference: 'heuristic+web+github',
    source_license: 'generated',
    imported_at: new Date().toISOString(),
    enabled: true,
    deprecated: false,
    compatibility: {
      personas: [personaCandidate.id, 'technical', 'researcher', 'default'],
      runtime_modes: ['hybrid', 'cloud_only', 'offline_optional'],
    },
    schema_version: 'skillManifest.v1',
    quality_state: 'provisional_active',
    generated_from_prompt: prompt.slice(0, 240),
  };
  if (reasoning?.strategy_type === 'synthesize' || intent?.intent_family === 'research') {
    return [
      skill,
      {
        ...skill,
        id: `${baseId}_research`,
        name: `${titleCase(domain)} Research Scout`,
        purpose: `Gather web and open-source context for ${domain} requests before answering.`,
        tags: [...new Set([...skill.tags, 'research', 'web'])],
        triggers: [...new Set([...skill.triggers, 'research', 'compare'])],
        token_budget_hint: 450,
        prompt_fragments: [
          `Collect external context relevant to ${domain} and ${lead}.`,
          `Prefer concise evidence summaries and then hand off to the main response path.`,
        ],
      },
    ];
  }
  return [skill];
}

async function persistPersonaCandidate(persona) {
  const file = path.join(PERSONA_DIR, `${persona.id}.json`);
  const existing = await readJson(file, null);
  if (existing) return existing;
  await writeJson(file, persona);
  return persona;
}

async function persistSkillCandidate(skill) {
  const file = path.join(SKILL_DIR, `${skill.id}.json`);
  const catalogFile = path.join(SKILL_DIR, 'active_catalog.json');
  const catalog = await readJson(catalogFile, { schema_version: 'skillCatalog.v1', generated_at: new Date().toISOString(), skills: [] });
  const existing = (catalog.skills || []).find((entry) => entry.id === skill.id);
  if (!existing) {
    catalog.generated_at = new Date().toISOString();
    catalog.skills.push(skill);
    await writeJson(catalogFile, catalog);
  }
  await writeJson(file, skill);
  return existing || skill;
}

async function persistAcquisitionReceipt(receipt) {
  await ensureDir(EVIDENCE_DIR);
  const file = path.join(EVIDENCE_DIR, `capability-acquisition-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.json`);
  await fs.writeFile(file, JSON.stringify(receipt, null, 2), 'utf8');
}

function makePersonaResult(persona, previousConfidence) {
  return {
    final_persona_id: persona.id,
    persona_version: persona.version || 'v1',
    blend_weights: null,
    confidence: Math.max(previousConfidence || 0.3, 0.72),
    source: 'generated-acquisition',
    rationale_codes: ['generated_acquisition', 'provisional_activation'],
    persona,
    acquisition_state: 'generated_and_activated',
  };
}

export async function resolveAdaptiveCapabilities({ prompt, payload = {}, intent, context, reasoning, personaResult, skills = [] }) {
  if (payload.disable_capability_acquisition) {
    return { personaResult, skills, report: { skipped: true, reason: 'disabled_by_payload' } };
  }

  const weakPersona = personaLooksWeak(personaResult, context, reasoning);
  const weakSkills = skillsLookWeak(skills, context, reasoning);
  if (!weakPersona && !weakSkills) {
    return { personaResult, skills, report: { skipped: true, reason: 'coverage_sufficient' } };
  }

  const acquisitionJobs = [];
  if (weakPersona) acquisitionJobs.push(await createAcquisitionJob({ type: 'persona', id: slugify(context?.domain || intent?.intent_family || 'general'), reason: 'weak_persona_fit', requested_by: 'adaptive_runtime' }));
  if (weakSkills) acquisitionJobs.push(await createAcquisitionJob({ type: 'skill', id: slugify(context?.domain || intent?.intent_family || 'general'), reason: 'weak_skill_fit', requested_by: 'adaptive_runtime' }));

  const research = payload.allow_external_research === false
    ? { research_id: null, github: [], web: [], keywords: extractKeywords(prompt), queries: [] }
    : await researchCapabilitySources({ prompt, context, intent, type: weakPersona && weakSkills ? 'persona-skill' : weakPersona ? 'persona' : 'skill' });

  const personaCandidate = weakPersona ? await persistPersonaCandidate(buildPersonaCandidate({ prompt, intent, context, reasoning, research })) : null;
  const generatedSkills = weakSkills ? await Promise.all(buildSkillCandidates({ prompt, intent, context, reasoning, research, personaCandidate: personaCandidate || personaResult.persona }).map(persistSkillCandidate)) : [];

  const nextPersonaResult = personaCandidate ? makePersonaResult(personaCandidate, personaResult?.confidence) : personaResult;
  const nextSkills = [...generatedSkills.map((skill) => ({ id: skill.id, version: skill.version || 'v1', purpose: skill.purpose, token_budget_hint: skill.token_budget_hint || 600, score: 0.91, source: 'generated-acquisition' })), ...(skills || [])]
    .filter((skill, index, arr) => arr.findIndex((entry) => entry.id === skill.id) === index)
    .slice(0, 5);

  const report = {
    weak_persona: weakPersona,
    weak_skills: weakSkills,
    acquisition_jobs: acquisitionJobs.map((job) => ({ job_id: job.job_id, type: job.type, target_id: job.target_id, reason: job.reason })),
    generated_persona_id: personaCandidate?.id || null,
    generated_skill_ids: generatedSkills.map((skill) => skill.id),
    research_summary: {
      research_id: research.research_id || null,
      keywords: research.keywords || [],
      github_sources: (research.github || []).map((entry) => ({ title: entry.title, url: entry.url })),
      web_sources: (research.web || []).map((entry) => ({ title: entry.title, url: entry.url })),
    },
    activated_now: Boolean(personaCandidate || generatedSkills.length),
    queue_depth: (await listAcquisitionJobs()).length,
  };
  await persistAcquisitionReceipt({ prompt: prompt.slice(0, 280), intent_family: intent?.intent_family || null, context_domain: context?.domain || null, report, generated_at: new Date().toISOString() });
  return { personaResult: nextPersonaResult, skills: nextSkills, report };
}
