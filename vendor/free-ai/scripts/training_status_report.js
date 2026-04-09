import { getTrainingStatus } from '../src/training/engine.js';
import { loadTrainingInsights } from '../src/training/store.js';

const [status, insights] = await Promise.all([getTrainingStatus(), loadTrainingInsights()]);
console.log(JSON.stringify({ status, insights }, null, 2));