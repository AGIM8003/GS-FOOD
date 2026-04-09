import { runTrainingCycle } from '../src/training/engine.js';

const report = await runTrainingCycle({ force: true, reason: 'script_manual_run' });
console.log(JSON.stringify(report, null, 2));