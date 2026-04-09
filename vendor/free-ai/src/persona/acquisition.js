import fs from 'fs/promises';
import { join } from 'path';

const QUEUE_DIR = join(process.cwd(),'acquisition','jobs');

export async function createAcquisitionJob({type, id, reason, requested_by='system'}){
  await fs.mkdir(QUEUE_DIR, { recursive: true });
  const job = {
    job_id: `job-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    type, // 'persona' or 'skill'
    target_id: id,
    reason,
    state: 'queued_for_acquisition',
    requested_by,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    schema_version: 'AcquisitionJob.v1'
  };
  const p = join(QUEUE_DIR, `${job.job_id}.json`);
  await fs.writeFile(p, JSON.stringify(job,null,2),'utf8');
  // also write a receipt
  const receiptPath = join(process.cwd(),'evidence','acquisition', `${job.job_id}.json`);
  try{ await fs.mkdir(join(process.cwd(),'evidence','acquisition'), { recursive:true }); await fs.writeFile(receiptPath, JSON.stringify(job,null,2),'utf8'); }catch(e){}
  return job;
}

export async function listAcquisitionJobs(){
  try{
    const files = await fs.readdir(QUEUE_DIR);
    const jobs = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const t = await fs.readFile(join(QUEUE_DIR,f),'utf8');
      jobs.push(JSON.parse(t));
    }
    return jobs;
  }catch(e){ return []; }
}
