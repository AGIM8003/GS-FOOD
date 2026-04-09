import { getTrainingReviewQueue } from '../src/training/engine.js';

const queue = await getTrainingReviewQueue();
console.log(JSON.stringify(queue, null, 2));