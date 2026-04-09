import fs from 'fs/promises';
import { dirname } from 'path';
import { applyTrainingReviewDecision, getTrainingReviewQueue, runTrainingCycle, setTrainingEnabled, updateTrainingProfile } from '../src/training/engine.js';
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

const files = [
  TRAINING_PATHS.config,
  TRAINING_PATHS.observations,
  TRAINING_PATHS.overlays,
  TRAINING_PATHS.state,
  TRAINING_PATHS.insights,
  TRAINING_PATHS.reviewQueue,
];
const backups = new Map();
for (const file of files) backups.set(file, await backup(file));

try {
  await setTrainingEnabled(true);
  await updateTrainingProfile({
    environment: 'general',
    retention: {
      overlay_max_age_days: 5,
      academy_max_age_days: 5,
      min_success_rate_to_remain_active: 0.5,
    },
    review_queue: {
      enabled: true,
      min_observations_for_review: 4,
      min_success_rate_for_review: 0.7,
      max_open_items: 10,
    },
  });

  const staleTimestamp = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
  await fs.mkdir(dirname(TRAINING_PATHS.overlays), { recursive: true });
  await fs.writeFile(TRAINING_PATHS.overlays, JSON.stringify({
    personas: {
      technical: {
        id: 'technical',
        status: 'active',
        usage_count: 3,
        success_rate: 0.4,
        updated_at: staleTimestamp,
        created_at: staleTimestamp,
      },
    },
    skills: {},
    academies: {},
  }, null, 2), 'utf8');

  const observations = [
    { observation_id: '1', created_at: new Date().toISOString(), domain: 'general', topics: ['analysis'], persona_id: 'technical', skill_ids: ['skill_summarize'], validation_valid: true, fallback_used: false, preview_only: false },
    { observation_id: '2', created_at: new Date().toISOString(), domain: 'general', topics: ['analysis'], persona_id: 'technical', skill_ids: ['skill_summarize'], validation_valid: true, fallback_used: false, preview_only: false },
    { observation_id: '3', created_at: new Date().toISOString(), domain: 'general', topics: ['analysis'], persona_id: 'technical', skill_ids: ['skill_summarize'], validation_valid: true, fallback_used: false, preview_only: false },
    { observation_id: '4', created_at: new Date().toISOString(), domain: 'general', topics: ['analysis'], persona_id: 'technical', skill_ids: ['skill_summarize'], validation_valid: true, fallback_used: false, preview_only: false },
  ];
  await fs.writeFile(TRAINING_PATHS.observations, JSON.stringify(observations, null, 2), 'utf8');

  const report = await runTrainingCycle({ force: true, reason: 'test_lifecycle', maxSamples: 10 });
  if (!Array.isArray(report.retired_overlays) || report.retired_overlays.length === 0) {
    console.error('expected retired overlays', report);
    process.exit(2);
  }
  const queue = await getTrainingReviewQueue();
  const pending = (queue.items || []).filter((item) => item.state === 'pending');
  if (pending.length === 0) {
    console.error('expected review queue items', queue);
    process.exit(3);
  }
  const reviewed = await applyTrainingReviewDecision({ reviewId: pending[0].review_id, action: 'approve', note: 'looks good' });
  if (reviewed.state !== 'approved') {
    console.error('expected approved review item', reviewed);
    process.exit(4);
  }
  console.log('training_lifecycle test OK');
} finally {
  for (const file of files) {
    await restore(file, backups.get(file));
  }
}