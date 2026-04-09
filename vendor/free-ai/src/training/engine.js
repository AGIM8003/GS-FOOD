import { addGraphEdge, upsertGraphNode } from '../memory/graph.js';
import { researchCapabilitySources } from '../capability/research.js';
import {
  loadTrainingConfig,
  loadTrainingInsights,
  loadTrainingObservations,
  loadTrainingOverlays,
  loadTrainingReviewQueue,
  loadTrainingState,
  saveTrainingConfig,
  saveTrainingInsights,
  saveTrainingOverlays,
  saveTrainingReviewQueue,
  saveTrainingState,
  writeTrainingEvidence,
} from './store.js';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function topEntries(values, limit = 5) {
  const counts = new Map();
  for (const value of values || []) {
    const key = normalize(value);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function successRate(observations) {
  if (!observations.length) return 0;
  const successes = observations.filter((item) => item.validation_valid !== false && item.fallback_used !== true).length;
  return successes / observations.length;
}

function guardStatus(domain, config) {
  const sensitive = (config.compliance_profile?.sensitive_domains || []).map(normalize);
  if (sensitive.includes(normalize(domain)) && config.compliance_profile?.require_guarded_mode_for_sensitive_domains !== false) {
    return 'guarded';
  }
  return 'active';
}

function deriveComplianceNotes(domain, config) {
  const notes = [];
  const status = guardStatus(domain, config);
  if (status === 'guarded') {
    notes.push(`Operate in guarded mode for ${domain} requests and prefer conservative, non-final language.`);
    notes.push(`Surface uncertainty, applicable regulations, and suggest professional review for ${domain} output.`);
  }
  if ((config.compliance_profile?.blocked_domains || []).map(normalize).includes(normalize(domain))) {
    notes.push(`Do not expand capability learning for blocked domain ${domain}.`);
  }
  return notes;
}

function deriveCurriculum(domain, observations, config) {
  const topics = topEntries(observations.flatMap((item) => item.topics || []), config.curriculum?.max_topics || 8).map((item) => item.value);
  const acquisitionRatio = observations.length
    ? observations.filter((item) => item.acquisition_used || item.generated_capability_used).length / observations.length
    : 0;
  const fallbackRatio = observations.length
    ? observations.filter((item) => item.fallback_used).length / observations.length
    : 0;
  const validationRate = successRate(observations);
  const curriculum = [];
  if (guardStatus(domain, config) === 'guarded') curriculum.push(`Use high-caution ${domain} response framing and keep claims bounded.`);
  if (validationRate < 0.8) curriculum.push('Ask clarifying questions earlier and narrow the answer scope before finalizing.');
  if (fallbackRatio > 0.2) curriculum.push('Prefer lower-latency, better-supported skills and keep provider requirements simpler.');
  if (acquisitionRatio > 0.25) curriculum.push(`Invest in domain-specific persona and skill overlays for repeated ${domain} work.`);
  if (topics.length) curriculum.push(`Focus practice on: ${topics.join(', ')}.`);
  curriculum.push('Keep evidence, rationale, and compliance notes explicit in the final answer.');
  return unique(curriculum).slice(0, 6);
}

function derivePersonaOverlay(personaId, observations, domain, config) {
  const topics = topEntries(observations.flatMap((item) => item.topics || []), config.curriculum?.max_topics || 8).map((item) => item.value);
  const rate = successRate(observations);
  const usage = observations.length;
  const hints = [];
  if (guardStatus(domain, config) === 'guarded') hints.push(`State limits clearly when acting as ${personaId} in ${domain} contexts.`);
  if (rate < 0.8) hints.push('Prefer verification and clarification over confident extrapolation.');
  if (rate >= 0.8) hints.push('Lead with concise synthesis, then provide evidence and rationale.');
  if (topics.length) hints.push(`Lean into learned topics: ${topics.join(', ')}.`);
  return {
    id: personaId,
    status: guardStatus(domain, config),
    usage_count: usage,
    success_rate: Number(rate.toFixed(3)),
    learned_domains: unique(observations.map((item) => item.domain || domain)).slice(0, config.curriculum?.max_domains || 3),
    learned_topics: topics,
    response_style_hints: unique(hints).slice(0, 6),
    compliance_notes: deriveComplianceNotes(domain, config),
    selection_boost: Number(Math.min(0.22, 0.05 + usage * 0.01 + rate * 0.06).toFixed(3)),
    environment_tags: config.environment_tags || [config.environment || 'general'],
    updated_at: new Date().toISOString(),
    schema_version: 'trainingPersonaOverlay.v1',
  };
}

function deriveSkillOverlay(skillId, observations, domain, config) {
  const topics = topEntries(observations.flatMap((item) => item.topics || []), config.curriculum?.max_topics || 8).map((item) => item.value);
  const personas = topEntries(observations.map((item) => item.persona_id), config.curriculum?.max_personas || 5).map((item) => item.value);
  const rate = successRate(observations);
  const executionHints = [];
  if (guardStatus(domain, config) === 'guarded') executionHints.push(`Keep ${skillId} outputs auditable and conservative in ${domain} contexts.`);
  if (rate < 0.8) executionHints.push('Prefer smaller steps and explicit validation checkpoints.');
  if (topics.length) executionHints.push(`Optimize ${skillId} for: ${topics.join(', ')}.`);
  return {
    id: skillId,
    status: guardStatus(domain, config),
    usage_count: observations.length,
    success_rate: Number(rate.toFixed(3)),
    learned_domains: unique(observations.map((item) => item.domain || domain)).slice(0, config.curriculum?.max_domains || 3),
    learned_topics: topics,
    compatible_personas: personas,
    execution_hints: unique(executionHints).slice(0, 6),
    compliance_notes: deriveComplianceNotes(domain, config),
    routing_boost: Number(Math.min(0.2, 0.04 + observations.length * 0.008 + rate * 0.05).toFixed(3)),
    environment_tags: config.environment_tags || [config.environment || 'general'],
    updated_at: new Date().toISOString(),
    schema_version: 'trainingSkillOverlay.v1',
  };
}

async function maybeResearchDomain(domain, observations, config) {
  if (!config.compliance_profile?.web_research_allowed) return [];
  if (observations.length < Math.max(3, config.min_observations_to_learn || 3)) return [];
  try {
    const research = await researchCapabilitySources({
      prompt: `training curriculum for ${domain}`,
      context: { domain },
      intent: { raw: domain, intent_family: 'research', task_type: 'training_curriculum' },
      type: 'training',
      maxQueries: 1,
    });
    return Array.isArray(research?.sources) ? research.sources.slice(0, 3) : [];
  } catch {
    return [];
  }
}

function mergeOverlay(existing, next) {
  const prior = existing || {};
  return {
    ...prior,
    ...next,
    learned_domains: unique([...(prior.learned_domains || []), ...(next.learned_domains || [])]),
    learned_topics: unique([...(prior.learned_topics || []), ...(next.learned_topics || [])]),
    response_style_hints: unique([...(prior.response_style_hints || []), ...(next.response_style_hints || [])]),
    execution_hints: unique([...(prior.execution_hints || []), ...(next.execution_hints || [])]),
    compliance_notes: unique([...(prior.compliance_notes || []), ...(next.compliance_notes || [])]),
    compatible_personas: unique([...(prior.compatible_personas || []), ...(next.compatible_personas || [])]),
    environment_tags: unique([...(prior.environment_tags || []), ...(next.environment_tags || [])]),
    created_at: prior.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function daysSince(timestamp) {
  if (!timestamp) return Number.POSITIVE_INFINITY;
  const delta = Date.now() - Date.parse(timestamp);
  return delta / (24 * 60 * 60 * 1000);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function pruneOverlayGroup(group, maxAgeDays, config, bucketName) {
  const next = {};
  const retired = [];
  for (const [id, overlay] of Object.entries(group || {})) {
    const updatedAge = daysSince(overlay.updated_at || overlay.created_at);
    const shouldRetireForAge = Number.isFinite(maxAgeDays) && updatedAge > maxAgeDays;
    const shouldRetireForQuality = config.retention?.retire_low_confidence_overlays !== false
      && typeof overlay.success_rate === 'number'
      && overlay.success_rate < Number(config.retention?.min_success_rate_to_remain_active ?? 0.45)
      && (overlay.usage_count || 0) >= 2;
    if (shouldRetireForAge || shouldRetireForQuality) {
      retired.push({
        bucket: bucketName,
        id,
        prior_status: overlay.status || 'active',
        reason: shouldRetireForAge ? 'stale' : 'low_success_rate',
        age_days: Number(updatedAge.toFixed(2)),
      });
      next[id] = {
        ...overlay,
        status: 'retired',
        retired_at: new Date().toISOString(),
        retirement_reason: shouldRetireForAge ? 'stale' : 'low_success_rate',
      };
      continue;
    }
    next[id] = overlay;
  }
  return { next, retired };
}

function pruneOverlays(overlays, config) {
  const personaResult = pruneOverlayGroup(overlays.personas || {}, Number(config.retention?.overlay_max_age_days || 30), config, 'persona');
  const skillResult = pruneOverlayGroup(overlays.skills || {}, Number(config.retention?.overlay_max_age_days || 30), config, 'skill');
  const academyResult = pruneOverlayGroup(overlays.academies || {}, Number(config.retention?.academy_max_age_days || 45), config, 'academy');
  return {
    overlays: {
      ...overlays,
      personas: personaResult.next,
      skills: skillResult.next,
      academies: academyResult.next,
    },
    retired: [...personaResult.retired, ...skillResult.retired, ...academyResult.retired],
  };
}

function queueKey(item) {
  return `${item.overlay_type}:${item.target_id}:${item.domain || 'general'}`;
}

function buildReviewCandidates({ personaReports, skillReports, academyReports, config, cycleId }) {
  if (config.review_queue?.enabled === false) return [];
  const minObs = Number(config.review_queue?.min_observations_for_review || 6);
  const minSuccess = Number(config.review_queue?.min_success_rate_for_review || 0.72);
  const candidates = [];
  for (const overlay of personaReports || []) {
    if ((overlay.usage_count || 0) < minObs || (overlay.success_rate || 0) < minSuccess) continue;
    candidates.push({
      review_id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cycle_id: cycleId,
      overlay_type: 'persona',
      target_id: overlay.id,
      domain: (overlay.learned_domains || [])[0] || 'general',
      state: 'pending',
      proposed_action: 'strengthen_overlay',
      proposed_changes: {
        selection_boost: overlay.selection_boost,
        response_style_hints: overlay.response_style_hints || [],
      },
      evidence: {
        usage_count: overlay.usage_count,
        success_rate: overlay.success_rate,
      },
      created_at: new Date().toISOString(),
      schema_version: 'trainingReviewItem.v1',
    });
  }
  for (const overlay of skillReports || []) {
    if ((overlay.usage_count || 0) < minObs || (overlay.success_rate || 0) < minSuccess) continue;
    candidates.push({
      review_id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cycle_id: cycleId,
      overlay_type: 'skill',
      target_id: overlay.id,
      domain: (overlay.learned_domains || [])[0] || 'general',
      state: 'pending',
      proposed_action: 'strengthen_overlay',
      proposed_changes: {
        routing_boost: overlay.routing_boost,
        execution_hints: overlay.execution_hints || [],
      },
      evidence: {
        usage_count: overlay.usage_count,
        success_rate: overlay.success_rate,
      },
      created_at: new Date().toISOString(),
      schema_version: 'trainingReviewItem.v1',
    });
  }
  for (const academy of academyReports || []) {
    if ((academy.observation_count || 0) < minObs || (academy.success_rate || 0) < minSuccess) continue;
    candidates.push({
      review_id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cycle_id: cycleId,
      overlay_type: 'academy',
      target_id: academy.id,
      domain: academy.domain || 'general',
      state: 'pending',
      proposed_action: 'approve_curriculum',
      proposed_changes: {
        curriculum: academy.curriculum || [],
        compliance_notes: academy.compliance_notes || [],
      },
      evidence: {
        observation_count: academy.observation_count,
        success_rate: academy.success_rate,
      },
      created_at: new Date().toISOString(),
      schema_version: 'trainingReviewItem.v1',
    });
  }
  return candidates;
}

function mergeReviewQueue(existingQueue, candidates, config) {
  const queue = clone(existingQueue || { items: [] });
  const existingKeys = new Set(queue.items.filter((item) => item.state === 'pending').map(queueKey));
  for (const candidate of candidates) {
    const key = queueKey(candidate);
    if (existingKeys.has(key)) continue;
    queue.items.push(candidate);
    existingKeys.add(key);
  }
  const maxOpen = Number(config.review_queue?.max_open_items || 50);
  const pending = queue.items.filter((item) => item.state === 'pending');
  const resolved = queue.items.filter((item) => item.state !== 'pending');
  queue.items = [...pending.slice(-maxOpen), ...resolved.slice(-maxOpen)];
  return queue;
}

async function writeAcademyGraph(academy) {
  const academyNode = await upsertGraphNode({
    type: 'academy',
    key: academy.domain,
    label: `${academy.domain} academy`,
    tags: academy.topics || [],
    importance: 0.7,
    meta: { status: academy.status, observation_count: academy.observation_count },
  });
  for (const personaId of academy.dominant_personas || []) {
    const personaNode = await upsertGraphNode({
      type: 'persona-learning',
      key: personaId,
      label: personaId,
      tags: academy.topics || [],
      importance: 0.65,
      meta: { academy: academy.domain },
    });
    await addGraphEdge({ from: academyNode.node_id, to: personaNode.node_id, relation: 'trains_persona', confidence: 0.72 });
  }
  for (const skillId of academy.dominant_skills || []) {
    const skillNode = await upsertGraphNode({
      type: 'skill-learning',
      key: skillId,
      label: skillId,
      tags: academy.topics || [],
      importance: 0.62,
      meta: { academy: academy.domain },
    });
    await addGraphEdge({ from: academyNode.node_id, to: skillNode.node_id, relation: 'trains_skill', confidence: 0.7 });
  }
}

export async function runTrainingCycle({ force = false, reason = 'manual', maxSamples = null } = {}) {
  const [config, state, observations, overlays, reviewQueue] = await Promise.all([
    loadTrainingConfig(),
    loadTrainingState(),
    loadTrainingObservations(),
    loadTrainingOverlays(),
    loadTrainingReviewQueue(),
  ]);
  const now = Date.now();
  if (config.enabled === false && !force) {
    const skipped = { status: 'skipped', reason: 'training_disabled', generated_at: new Date().toISOString() };
    await saveTrainingInsights(skipped);
    return skipped;
  }
  if (state.running) {
    return { status: 'skipped', reason: 'cycle_already_running', generated_at: new Date().toISOString() };
  }
  if (!force && state.last_run_at && now - Date.parse(state.last_run_at) < Number(config.auto_run_interval_ms || 0)) {
    return { status: 'skipped', reason: 'cooldown_active', generated_at: new Date().toISOString(), last_run_at: state.last_run_at };
  }
  const usable = observations
    .filter((item) => item && item.preview_only !== true)
    .slice(-Math.max(1, maxSamples || Number(config.max_observations_per_cycle) || 80));
  if (usable.length < Math.max(1, Number(config.min_observations_to_learn) || 3)) {
    const skipped = {
      status: 'skipped',
      reason: 'insufficient_observations',
      generated_at: new Date().toISOString(),
      observation_count: usable.length,
    };
    await saveTrainingInsights(skipped);
    return skipped;
  }

  const cycleId = `cycle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await saveTrainingState({ ...state, running: true, last_status: 'running', last_cycle_id: cycleId, last_error: null });

  try {
    const topDomains = topEntries(usable.map((item) => item.domain || 'general'), config.curriculum?.max_domains || 3);
    const topPersonas = topEntries(usable.map((item) => item.persona_id), config.curriculum?.max_personas || 5);
    const topSkills = topEntries(usable.flatMap((item) => item.skill_ids || []), config.curriculum?.max_skills || 8);
    const pruned = pruneOverlays(overlays, config);
    const nextOverlays = { ...pruned.overlays, personas: { ...(pruned.overlays.personas || {}) }, skills: { ...(pruned.overlays.skills || {}) }, academies: { ...(pruned.overlays.academies || {}) } };
    const academyReports = [];
    const personaReports = [];
    const skillReports = [];

    for (const domainEntry of topDomains) {
      const domain = domainEntry.value;
      const scoped = usable.filter((item) => normalize(item.domain || 'general') === domain);
      const researchSources = await maybeResearchDomain(domain, scoped, config);
      const academy = {
        id: domain,
        domain,
        status: guardStatus(domain, config),
        observation_count: scoped.length,
        success_rate: Number(successRate(scoped).toFixed(3)),
        dominant_personas: topEntries(scoped.map((item) => item.persona_id), 3).map((item) => item.value),
        dominant_skills: topEntries(scoped.flatMap((item) => item.skill_ids || []), 5).map((item) => item.value),
        topics: topEntries(scoped.flatMap((item) => item.topics || []), config.curriculum?.max_topics || 8).map((item) => item.value),
        curriculum: deriveCurriculum(domain, scoped, config),
        compliance_notes: deriveComplianceNotes(domain, config),
        research_sources: researchSources.map((source) => ({ title: source.title, url: source.url, source: source.source })),
        environment_tags: config.environment_tags || [config.environment || 'general'],
        updated_at: new Date().toISOString(),
        schema_version: 'trainingAcademy.v1',
      };
      nextOverlays.academies[domain] = mergeOverlay(nextOverlays.academies[domain], academy);
      academyReports.push(nextOverlays.academies[domain]);
      await writeAcademyGraph(academy);
    }

    for (const personaEntry of topPersonas) {
      const personaId = personaEntry.value;
      const scoped = usable.filter((item) => normalize(item.persona_id) === personaId);
      const dominantDomain = topEntries(scoped.map((item) => item.domain || 'general'), 1)[0]?.value || 'general';
      const overlay = derivePersonaOverlay(personaId, scoped, dominantDomain, config);
      nextOverlays.personas[personaId] = mergeOverlay(nextOverlays.personas[personaId], overlay);
      personaReports.push(nextOverlays.personas[personaId]);
    }

    for (const skillEntry of topSkills) {
      const skillId = skillEntry.value;
      const scoped = usable.filter((item) => (item.skill_ids || []).map(normalize).includes(skillId));
      const dominantDomain = topEntries(scoped.map((item) => item.domain || 'general'), 1)[0]?.value || 'general';
      const overlay = deriveSkillOverlay(skillId, scoped, dominantDomain, config);
      nextOverlays.skills[skillId] = mergeOverlay(nextOverlays.skills[skillId], overlay);
      skillReports.push(nextOverlays.skills[skillId]);
    }

    const acquisitionSignals = topEntries(
      usable.filter((item) => item.acquisition_used || item.generated_capability_used).map((item) => item.domain || 'general'),
      5
    ).map((entry) => ({ domain: entry.value, count: entry.count }));
    const reviewCandidates = buildReviewCandidates({ personaReports, skillReports, academyReports, config, cycleId });
    const nextReviewQueue = mergeReviewQueue(reviewQueue, reviewCandidates, config);

    const report = {
      cycle_id: cycleId,
      generated_at: new Date().toISOString(),
      status: 'completed',
      reason,
      observation_count: usable.length,
      summary: {
        top_domains: topDomains,
        top_personas: topPersonas,
        top_skills: topSkills,
      },
      academies: academyReports,
      persona_overlays: personaReports,
      skill_overlays: skillReports,
      acquisition_signals: acquisitionSignals,
      retired_overlays: pruned.retired,
      review_candidates: reviewCandidates.map((item) => ({ review_id: item.review_id, overlay_type: item.overlay_type, target_id: item.target_id, domain: item.domain })),
      schema_version: 'trainingInsights.v1',
    };

    await Promise.all([
      saveTrainingOverlays(nextOverlays),
      saveTrainingInsights(report),
      saveTrainingReviewQueue(nextReviewQueue),
      saveTrainingState({
        ...state,
        running: false,
        last_run_at: report.generated_at,
        last_cycle_id: cycleId,
        last_status: 'completed',
        last_error: null,
        retired_overlay_count: pruned.retired.length,
      }),
      writeTrainingEvidence('cycle', report),
    ]);
    return report;
  } catch (error) {
    await saveTrainingState({
      ...state,
      running: false,
      last_status: 'failed',
      last_error: error.message,
      last_run_at: new Date().toISOString(),
    });
    await saveTrainingInsights({
      ...(await loadTrainingInsights()),
      generated_at: new Date().toISOString(),
      status: 'failed',
      summary: { error: error.message },
    });
    throw error;
  }
}

export async function getTrainingStatus() {
  const [config, state, insights, overlays, observations, reviewQueue] = await Promise.all([
    loadTrainingConfig(),
    loadTrainingState(),
    loadTrainingInsights(),
    loadTrainingOverlays(),
    loadTrainingObservations(),
    loadTrainingReviewQueue(),
  ]);
  return {
    enabled: config.enabled !== false,
    environment: config.environment,
    regulatory_mode: config.compliance_profile?.regulatory_mode || 'baseline',
    observation_count: observations.length,
    overlay_counts: {
      personas: Object.keys(overlays.personas || {}).length,
      skills: Object.keys(overlays.skills || {}).length,
      academies: Object.keys(overlays.academies || {}).length,
    },
    last_run_at: state.last_run_at,
    last_cycle_id: state.last_cycle_id,
    last_status: state.last_status,
    last_error: state.last_error,
    retired_overlay_count: state.retired_overlay_count || 0,
    review_queue: {
      open_items: (reviewQueue.items || []).filter((item) => item.state === 'pending').length,
      resolved_items: (reviewQueue.items || []).filter((item) => item.state !== 'pending').length,
    },
    latest_summary: insights.summary || null,
  };
}

export async function setTrainingEnabled(enabled) {
  const nextConfig = await saveTrainingConfig({ ...(await loadTrainingConfig()), enabled: !!enabled });
  await saveTrainingState({ ...(await loadTrainingState()), last_control_action: { enabled: !!enabled, at: new Date().toISOString() } });
  return nextConfig;
}

export async function updateTrainingProfile(patch) {
  const next = await saveTrainingConfig({ ...(await loadTrainingConfig()), ...(patch || {}) });
  await writeTrainingEvidence('profile', { updated_at: new Date().toISOString(), patch, environment: next.environment });
  return next;
}

export async function getTrainingReviewQueue() {
  return loadTrainingReviewQueue();
}

export async function applyTrainingReviewDecision({ reviewId, action = 'approve', note = null }) {
  const queue = await loadTrainingReviewQueue();
  const item = (queue.items || []).find((entry) => entry.review_id === reviewId);
  if (!item) {
    throw new Error(`review item not found: ${reviewId}`);
  }
  if (item.state !== 'pending') {
    return item;
  }
  item.state = action === 'reject' ? 'rejected' : 'approved';
  item.reviewed_at = new Date().toISOString();
  item.review_note = note || null;
  await saveTrainingReviewQueue(queue);
  await writeTrainingEvidence('review', { review_id: reviewId, action: item.state, note, reviewed_at: item.reviewed_at });
  return item;
}