import fs from 'fs/promises';
import { join } from 'path';

const ACQ_DIR = join(process.cwd(),'acquisition','jobs');
const EVIDENCE_DIR = join(process.cwd(),'evidence','models');

export async function queueModelInstall({ model_id, source, checksum=null, requested_by='system' }){
  try{
    await fs.mkdir(ACQ_DIR,{recursive:true});
    const job = { job_id: `model-install-${Date.now()}` , model_id, source, checksum, requested_by, queued_at: new Date().toISOString(), status: 'queued' };
    await fs.writeFile(join(ACQ_DIR, job.job_id + '.json'), JSON.stringify(job,null,2),'utf8');
    // write evidence
    await fs.mkdir(EVIDENCE_DIR,{recursive:true});
    await fs.writeFile(join(EVIDENCE_DIR, `install-${model_id}-${Date.now()}.json`), JSON.stringify({ job, note: 'queued for manual/install pipeline' },null,2),'utf8');
    return { ok: true, job };
  }catch(e){ return { ok: false, error: e.message }; }
}

export default { queueModelInstall };
