import { loadTrainingConfig, loadTrainingOverlays } from './store.js';

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeDomain(context, intent) {
  return normalize(
    context?.domain ||
    (Array.isArray(intent?.domain_signals) && intent.domain_signals[0]) ||
    intent?.domain ||
    'general'
  );
}

function normalizeTopics(intent, context) {
  return unique([
    ...(Array.isArray(intent?.topics) ? intent.topics : []),
    ...(Array.isArray(context?.skill_hints) ? context.skill_hints : []),
    ...(Array.isArray(context?.persona_hints) ? context.persona_hints : []),
  ].map(normalize));
}

function isUsableStatus(status) {
  return status === 'active' || status === 'guarded';
}

function overlapScore(candidates, topics) {
  const left = new Set((candidates || []).map(normalize).filter(Boolean));
  const hits = topics.filter((topic) => left.has(normalize(topic)));
  return hits.length ? Math.min(0.05, hits.length * 0.015) : 0;
}

function overlayApplies(overlay, domain, topics) {
  if (!overlay || !isUsableStatus(overlay.status)) return false;
  const overlayDomains = (overlay.learned_domains || []).map(normalize);
  if (!overlayDomains.length) return true;
  if (overlayDomains.includes(domain)) return true;
  return topics.some((topic) => overlayDomains.includes(topic));
}

export async function loadLearningRuntime({ context = null, intent = null } = {}) {
  const [config, overlays] = await Promise.all([loadTrainingConfig(), loadTrainingOverlays()]);
  const domain = normalizeDomain(context, intent);
  const topics = normalizeTopics(intent, context);
  return { config, overlays, domain, topics };
}

export function scorePersonaWithLearning(personaManifest, runtime) {
  if (!runtime?.config || runtime.config.enabled === false) return 0;
  const overlay = runtime.overlays?.personas?.[personaManifest?.id];
  if (!overlay || !overlayApplies(overlay, runtime.domain, runtime.topics)) return 0;
  let boost = Number(overlay.selection_boost) || 0.05;
  if ((overlay.learned_domains || []).map(normalize).includes(runtime.domain)) boost += 0.04;
  boost += overlapScore(overlay.learned_topics, runtime.topics);
  if (overlay.status === 'guarded') boost += 0.015;
  return Math.min(0.24, boost);
}

export function scoreSkillWithLearning(skillManifest, runtime, persona) {
  if (!runtime?.config || runtime.config.enabled === false) return 0;
  const overlay = runtime.overlays?.skills?.[skillManifest?.id];
  if (!overlay || !overlayApplies(overlay, runtime.domain, runtime.topics)) return 0;
  let boost = Number(overlay.routing_boost) || 0.04;
  if ((overlay.learned_domains || []).map(normalize).includes(runtime.domain)) boost += 0.035;
  boost += overlapScore(overlay.learned_topics, runtime.topics);
  if (persona?.id && Array.isArray(overlay.compatible_personas) && overlay.compatible_personas.includes(persona.id)) boost += 0.02;
  if (overlay.status === 'guarded') boost += 0.01;
  return Math.min(0.22, boost);
}

export async function buildLearningPromptContext({ context = null, intent = null, persona = null, skills = [] } = {}) {
  const runtime = await loadLearningRuntime({ context, intent });
  const personaOverlay = persona?.id ? runtime.overlays?.personas?.[persona.id] : null;
  const academy = runtime.overlays?.academies?.[runtime.domain] || null;
  const skillOverlays = (skills || [])
    .map((skill) => runtime.overlays?.skills?.[skill.id])
    .filter((overlay) => overlay && isUsableStatus(overlay.status));
  const guidance = unique([
    ...(academy?.curriculum || []),
    ...(personaOverlay?.response_style_hints || []),
    ...skillOverlays.flatMap((overlay) => overlay.execution_hints || []),
  ]).slice(0, 8);
  const complianceNotes = unique([
    ...(academy?.compliance_notes || []),
    ...(personaOverlay?.compliance_notes || []),
    ...skillOverlays.flatMap((overlay) => overlay.compliance_notes || []),
  ]).slice(0, 8);
  return {
    enabled: runtime.config.enabled !== false,
    environment: runtime.config.environment,
    regulatory_mode: runtime.config.compliance_profile?.regulatory_mode || 'baseline',
    domain: runtime.domain,
    persona_overlay: personaOverlay && isUsableStatus(personaOverlay.status) ? personaOverlay : null,
    skill_overlays: skillOverlays,
    academy: academy && isUsableStatus(academy.status) ? academy : null,
    guidance,
    compliance_notes: complianceNotes,
  };
}