import fs from 'fs/promises';
import { dirname } from 'path';
import { buildLearningPromptContext } from '../src/training/runtime.js';
import { runTrainingCycle, setTrainingEnabled, updateTrainingProfile } from '../src/training/engine.js';
import { TRAINING_PATHS } from '../src/training/store.js';

async function backup(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function restore(filePath, content) {
  if (content === null) {
    await fs.rm(filePath, { force: true });
    return;
  }
  await fs.mkdir(dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

const files = [TRAINING_PATHS.config, TRAINING_PATHS.observations, TRAINING_PATHS.overlays, TRAINING_PATHS.state, TRAINING_PATHS.insights];
const backups = new Map();
for (const file of files) backups.set(file, await backup(file));

try {
  await setTrainingEnabled(true);
  await updateTrainingProfile({
    environment: 'doctor-office',
    environment_tags: ['medical', 'doctor-office'],
    compliance_profile: { regulatory_mode: 'clinical', sensitive_domains: ['medical', 'legal', 'finance'] },
  });
  const observations = [
    {
      observation_id: 'obs-1',
      created_at: new Date().toISOString(),
      domain: 'medical',
      topics: ['triage', 'symptoms'],
      persona_id: 'technical',
      skill_ids: ['skill_summarize'],
      validation_valid: true,
      fallback_used: false,
      preview_only: false,
      acquisition_used: false,
      generated_capability_used: false,
    },
    {
      observation_id: 'obs-2',
      created_at: new Date().toISOString(),
      domain: 'medical',
      topics: ['triage', 'patient-intake'],
      persona_id: 'technical',
      skill_ids: ['skill_summarize'],
      validation_valid: true,
      fallback_used: false,
      preview_only: false,
      acquisition_used: true,
      generated_capability_used: true,
    },
    {
      observation_id: 'obs-3',
      created_at: new Date().toISOString(),
      domain: 'medical',
      topics: ['symptoms', 'risk'],
      persona_id: 'technical',
      skill_ids: ['skill_summarize', 'skill_memory'],
      validation_valid: false,
      fallback_used: false,
      preview_only: false,
      acquisition_used: false,
      generated_capability_used: false,
    },
  ];
  await fs.mkdir(dirname(TRAINING_PATHS.observations), { recursive: true });
  await fs.writeFile(TRAINING_PATHS.observations, JSON.stringify(observations, null, 2), 'utf8');

  const report = await runTrainingCycle({ force: true, reason: 'test_training_cycle', maxSamples: 10 });
  if (report.status !== 'completed') {
    console.error('training cycle did not complete', report);
    process.exit(2);
  }
  const learning = await buildLearningPromptContext({
    context: { domain: 'medical' },
    intent: { topics: ['triage'] },
    persona: { id: 'technical' },
    skills: [{ id: 'skill_summarize' }],
  });
  if (!learning.academy || learning.academy.status !== 'guarded') {
    console.error('expected guarded medical academy', learning);
    process.exit(3);
  }
  if (!learning.compliance_notes.some((note) => note.toLowerCase().includes('professional review'))) {
    console.error('expected compliance note for medical training', learning.compliance_notes);
    process.exit(4);
  }
  if (!learning.guidance.some((item) => item.toLowerCase().includes('triage'))) {
    console.error('expected learned triage guidance', learning.guidance);
    process.exit(5);
  }
  console.log('training_cycle test OK');
} finally {
  for (const file of files) {
    await restore(file, backups.get(file));
  }
}