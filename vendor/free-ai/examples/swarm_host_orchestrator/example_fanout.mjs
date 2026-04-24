/**
 * Illustrative host client: not production merge logic.
 * Usage: BASE_URL=http://127.0.0.1:3000 node example_fanout.mjs
 */
import { runSwarmFanoutDemo } from './lib.mjs';

const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const taskId = process.env.SWARM_TASK_ID || `demo-task-${Date.now()}`;
const out = await runSwarmFanoutDemo(base, taskId);
console.log(JSON.stringify(out, null, 2));
