import fs from 'fs/promises';
import { dirname } from 'path';
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

const files = [TRAINING_PATHS.config, TRAINING_PATHS.insights, TRAINING_PATHS.state];
const backups = new Map();
for (const file of files) backups.set(file, await backup(file));

try {
  await updateTrainingProfile({ environment: 'law-office', environment_tags: ['legal', 'law-office'] });
  await setTrainingEnabled(false);
  const report = await runTrainingCycle({ force: false, reason: 'disabled_test' });
  if (report.reason !== 'training_disabled') {
    console.error('expected disabled training skip', report);
    process.exit(2);
  }
  const config = await setTrainingEnabled(true);
  if (config.enabled !== true || config.environment !== 'law-office') {
    console.error('expected control toggle to preserve environment', config);
    process.exit(3);
  }
  console.log('training_controls test OK');
} finally {
  for (const file of files) {
    await restore(file, backups.get(file));
  }
}