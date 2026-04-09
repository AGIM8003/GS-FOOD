import fs from 'fs/promises';
import { join } from 'path';

export async function validateSkill(path) {
  try{
    const t = await fs.readFile(path,'utf8');
    const j = JSON.parse(t);
    if (!j.id || !j.version) throw new Error('skill missing id/version');
    if ((j.content||'').length > 20000) throw new Error('skill content too large');
    return { ok:true, id: j.id };
  }catch(e){ return { ok:false, error: e.message } }
}

export async function validatePersona(path) {
  try{ const t = await fs.readFile(path,'utf8'); const j = JSON.parse(t); if (!j.id || !j.version) throw new Error('persona missing id/version'); return { ok:true, id:j.id }; }catch(e){ return { ok:false, error: e.message } }
}
