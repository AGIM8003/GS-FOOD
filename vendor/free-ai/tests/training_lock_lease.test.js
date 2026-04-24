import fs from 'fs/promises';
import { dirname } from 'path';
import { getMetricsJsonlPath } from '../src/observability/metrics.js';
import {
  TRAINING_PATHS,
  acquireTrainingCycleLease,
  releaseTrainingCycleLease,
  readTrainingCycleLease,
  isTrainingLeaseActive,
} from '../src/training/store.js';

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

const backupLock = await backup(TRAINING_PATHS.cycleLock);
const metricsPath = getMetricsJsonlPath();
const backupMetrics = await backup(metricsPath);

try {
  await fs.rm(TRAINING_PATHS.cycleLock, { force: true });
  await fs.rm(metricsPath, { force: true });

  const first = await acquireTrainingCycleLease({ holder: 'test-holder-a', ttl_ms: 15_000, force: false });
  if (!first.ok) {
    console.error('expected first lease acquire to succeed', first);
    process.exit(2);
  }

  const second = await acquireTrainingCycleLease({ holder: 'test-holder-b', ttl_ms: 15_000, force: false });
  if (second.ok || second.reason !== 'cycle_already_running') {
    console.error('expected second lease acquire to be blocked', second);
    process.exit(3);
  }

  // Seed an expired lease so force-acquire performs stale recovery path.
  await fs.writeFile(
    TRAINING_PATHS.cycleLock,
    JSON.stringify(
      {
        holder: 'stale-holder',
        acquired_at: new Date(Date.now() - 60_000).toISOString(),
        expires_at_ms: Date.now() - 1_000,
        expires_at: new Date(Date.now() - 1_000).toISOString(),
        pid: 99999,
      },
      null,
      2,
    ),
    'utf8',
  );

  const forced = await acquireTrainingCycleLease({ holder: 'test-holder-c', ttl_ms: 15_000, force: true });
  if (!forced.ok) {
    console.error('expected force lease acquire to succeed', forced);
    process.exit(4);
  }

  const active = await readTrainingCycleLease();
  if (!active || !isTrainingLeaseActive(active) || active.holder !== 'test-holder-c') {
    console.error('expected active lease holder c', active);
    process.exit(5);
  }
  if (!Number.isFinite(Number(active.lease_version)) || Number(active.lease_version) <= 0) {
    console.error('expected monotonic lease_version', active);
    process.exit(51);
  }

  const releaseWrong = await releaseTrainingCycleLease({ holder: 'test-holder-a', force: false });
  if (releaseWrong.ok !== false || releaseWrong.reason !== 'lease_not_owned') {
    console.error('expected non-owner release to fail', releaseWrong);
    process.exit(6);
  }

  const releaseOk = await releaseTrainingCycleLease({ holder: 'test-holder-c', force: false });
  if (!releaseOk.ok) {
    console.error('expected owner release to succeed', releaseOk);
    process.exit(7);
  }
  await new Promise((resolve) => setTimeout(resolve, 80));

  const post = await readTrainingCycleLease();
  if (post) {
    console.error('expected lease to be cleared', post);
    process.exit(8);
  }

  const metricsRaw = await fs.readFile(metricsPath, 'utf8');
  const rows = metricsRaw.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const events = rows.filter((r) => r.subsystem === 'training_cycle_lock').map((r) => r.event);
  const required = ['lock_acquired', 'lock_contended', 'lock_stale_recovered', 'lock_released'];
  for (const e of required) {
    if (!events.includes(e)) {
      console.error(`expected telemetry event ${e}`, events);
      process.exit(9);
    }
  }

  console.log('training_lock_lease test OK');
} finally {
  await restore(TRAINING_PATHS.cycleLock, backupLock);
  await restore(metricsPath, backupMetrics);
}

