#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const reportsDir = path.join(root, 'evidence', 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const providers = JSON.parse(fs.readFileSync(path.join(root, 'providers.json'), 'utf8')).providers || [];
const skillsActive = JSON.parse(fs.readFileSync(path.join(root, 'skills', 'active_catalog.json'), 'utf8')).skills?.length || 0;

const strengths = [
  'Audited active skill catalog is authoritative',
  'Translator/context/reasoning/persona/skill pipeline is wired',
  'Prompt runtime now has prompt metadata and output contract selection',
  'Tracing, receipts, and evidence artifacts are produced locally',
  'Provider ladder and budget guardian exist with explicit free-tier classes',
];

const weaknesses = [
  'Provider probes and capability health are still local-file based, not scheduled',
  'Prompt validation repair path is bounded but still simple extraction-first',
  'Admin inspection is endpoint-based, without a richer UI',
  'Decision graph and eval-gated promotion are not yet deeply integrated',
  'Memory graph remains partially implemented',
];

const nextImprovements = [
  { title: 'Add scheduled provider probes', category: 'reliability' },
  { title: 'Persist decision graph records for prompt/runtime/provider decisions', category: 'integration' },
  { title: 'Add promotion/rollback receipts for prompt variants and routing policies', category: 'evaluation' },
  { title: 'Upgrade output repair to single retry with constrained repair prompt family', category: 'reliability' },
  { title: 'Expand admin inspection for prompts, traces, and validation evidence', category: 'operational' },
];

const evidenceBasis = [
  'Official Gemini structured outputs docs: response_json_schema and JSON output support',
  'Official Groq structured outputs docs: strict vs best-effort JSON schema modes',
  'Official Hugging Face Inference Providers docs: fastest/cheapest/preferred policies',
  'Official Groq models docs: GPT-OSS 20B/120B and model listing endpoint',
  'Official Fireworks pricing docs: starter credits and serverless text pricing',
  'Local KB routing and improvement notes from 0.KB intent router and KB current-state docs',
];

const projectEval = {
  generated_at: new Date().toISOString(),
  repo: root,
  strengths,
  weaknesses,
  highest_value_next_improvements: nextImprovements,
  evidence_basis: evidenceBasis,
  summary: {
    provider_count: providers.length,
    active_skills: skillsActive,
    report_scope: 'project-wide architecture, reliability, prompt runtime, observability',
  },
};

const gapAnalysis = {
  generated_at: new Date().toISOString(),
  gaps: [
    { id: 'gap_provider_probes', category: 'reliability', severity: 'high', description: 'No scheduled reliability probe runner yet' },
    { id: 'gap_decision_graph', category: 'integration', severity: 'high', description: 'Decision graph records are incomplete' },
    { id: 'gap_marketplace_governance', category: 'supply-chain', severity: 'medium', description: 'Marketplace approval/rollback flow is incomplete' },
    { id: 'gap_memory_graph', category: 'design-only', severity: 'medium', description: 'Memory graph queries and entity linking need deeper implementation' },
  ],
};

const improvementPlan = {
  generated_at: new Date().toISOString(),
  order: ['provider probes', 'decision graph', 'eval gates', 'memory graph', 'admin inspection'],
  risks: ['provider API drift', 'schema mismatch in structured outputs', 'overly permissive fallback masking failures'],
};

const architectureRisks = {
  generated_at: new Date().toISOString(),
  risks: [
    { category: 'reliability', risk: 'Free-tier providers can throttle or deprecate models without warning' },
    { category: 'observability', risk: 'Receipts are strong but decision graph correlation is still partial' },
    { category: 'evaluation', risk: 'Prompt/runtime changes can regress without promotion gates' },
  ],
};

for (const [prefix, data] of Object.entries({ project_eval: projectEval, project_gap_analysis: gapAnalysis, improvement_plan: improvementPlan, architecture_risks: architectureRisks })) {
  const file = path.join(reportsDir, `${prefix}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log('wrote', file);
}
