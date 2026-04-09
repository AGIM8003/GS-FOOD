import fs from 'fs';
import path from 'path';

const SCHEMA_DIR = path.join(process.cwd(),'src','schemas');

function loadSchema(name){
  const file = path.join(SCHEMA_DIR, `${name}.v1.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file,'utf8'));
}

let ajv = null;
let compiled = {};
try{
  // try dynamic import of Ajv if available
  // eslint-disable-next-line no-eval
  const Ajv = eval("require")('ajv');
  ajv = new Ajv({allErrors:true, strict:false});
}catch(e){
  ajv = null;
}

export function validate(schemaBaseName, obj){
  const schemaFileBase = schemaBaseName.replace(/\.v1$/,'');
  const schemaName = `${schemaFileBase}.v1`;
  if (ajv){
    if (!compiled[schemaName]){
      const schema = loadSchema(schemaFileBase);
      if (!schema) return { valid: false, errors: [{message:'schema-not-found', schema: schemaFileBase}] };
      compiled[schemaName] = ajv.compile(schema);
    }
    const valid = compiled[schemaName](obj);
    return { valid: !!valid, errors: compiled[schemaName].errors || [] };
  }
  // fallback: basic required field check
  const schema = loadSchema(schemaFileBase);
  if (!schema) return { valid: false, errors: [{message:'schema-not-found', schema: schemaFileBase}] };
  const errors = [];
  if (Array.isArray(schema.required)){
    for (const r of schema.required){
      if (obj[r] === undefined) errors.push({message:`missing-required-${r}`, field:r});
    }
  }
  return { valid: errors.length===0, errors };
}

export function listSchemas(){
  return fs.readdirSync(SCHEMA_DIR).filter(f=>f.endsWith('.json'));
}
