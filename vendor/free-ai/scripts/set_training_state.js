import { setTrainingEnabled } from '../src/training/engine.js';

const arg = (process.argv[2] || '').toLowerCase();
const enabled = arg === 'on' || arg === 'true' || arg === '1' || arg === 'enable';
const config = await setTrainingEnabled(enabled);
console.log(JSON.stringify({ enabled: config.enabled, environment: config.environment }, null, 2));