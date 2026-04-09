import { listModelCatalog, loadModel, requestModelInstall } from '../src/models/registry.js';

async function run(){
  const catalog = await listModelCatalog();
  console.log('model catalog count=', catalog.length);
  if (catalog.length < 1) { console.error('expected at least 1 model in catalog'); process.exit(2); }
  const m = await loadModel(catalog[0].id);
  if (!m) { console.error('failed to load model from catalog'); process.exit(2); }
  const job = await requestModelInstall(catalog[0].id,'test');
  console.log('install job queued=', job.job_id);
  console.log('model_catalog.test OK');
}

run().catch(e=>{ console.error(e); process.exit(2); });
