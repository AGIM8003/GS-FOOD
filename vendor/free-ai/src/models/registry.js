import fs from 'fs/promises';
import { join } from 'path';
import { validate } from '../schemaValidator.js';
import { createAcquisitionJob } from '../persona/acquisition.js';

const MODELS_DIR = join(process.cwd(),'src','models');
const INSTALLED_DIR = join(process.cwd(),'models','installed');

export async function listModelCatalog(){
  try{
    const t = await fs.readFile(join(MODELS_DIR,'catalog.json'),'utf8');
    const j = JSON.parse(t);
    return j.models || [];
  }catch(e){ return []; }
}

export async function loadModel(id){
  // first check installed folder
  try{
    const t = await fs.readFile(join(INSTALLED_DIR, `${id}.json`),'utf8');
    const j = JSON.parse(t);
    try{ const v = validate('modelManifest', j); if (!v.valid) j._manifest_validation = v.errors; }catch(e){}
    return j;
  }catch(e){}
  // fallback to catalog
  const catalog = await listModelCatalog();
  return catalog.find(m=> m.id === id) || null;
}

export async function requestModelInstall(id, requested_by='operator'){
  // create acquisition job for model install
  const job = await createAcquisitionJob({ type: 'model', id, reason: 'model_install_requested', requested_by });
  return job;
}

export async function listInstalledModels(){
  try{
    const files = await fs.readdir(INSTALLED_DIR);
    const models = [];
    for (const f of files){ if (!f.endsWith('.json')) continue; const t = await fs.readFile(join(INSTALLED_DIR,f),'utf8'); models.push(JSON.parse(t)); }
    return models;
  }catch(e){ return []; }
}
