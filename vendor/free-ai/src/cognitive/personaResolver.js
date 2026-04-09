import fs from 'fs/promises';
import { join } from 'path';

export async function resolvePersona(id='default'){
  const path = join(process.cwd(), 'personas', `${id}.json`);
  try {
    const t = await fs.readFile(path,'utf8');
    const p = JSON.parse(t);
    return p;
  } catch(e){
    return { id:'default', version:'v1', name:'Default', description:'Default persona' };
  }
}
