import fs from 'fs/promises';
import { join } from 'path';

const LOG = join(process.cwd(),'data','self_evolution.log');

export async function recordEvent(evt){
  try{
    const line = JSON.stringify({ ts: new Date().toISOString(), ...evt });
    await fs.appendFile(LOG, line + '\n');
  }catch(e){}
}

export default { recordEvent };
