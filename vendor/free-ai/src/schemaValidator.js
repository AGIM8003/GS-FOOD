import fs from 'fs';
import path from 'path';

const SCHEMA_DIR = path.join(process.cwd(),'src','schemas');

function loadSchema(name){
  const file = path.join(SCHEMA_DIR, `${name}.v1.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file,'utf8'));
}

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let ajv = null;
let compiled = {};
try {
  // Use standard secure module require instead of dynamic eval
  const Ajv = require('ajv');
  ajv = new Ajv({allErrors:true, strict:false});
} catch(e) {
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
    let finalValid = !!valid;
    let finalErrors = compiled[schemaName].errors || [];
    
    // Culinary domain specific rules
    if (finalValid && schemaFileBase.includes('recipe')) {
        if (!obj.ingredients || !Array.isArray(obj.ingredients) || obj.ingredients.length === 0) {
            finalValid = false;
            finalErrors.push({ message: "domain-error-missing-ingredients" });
        }
        if (!obj.instructions || obj.instructions.length < 2) {
            finalValid = false;
            finalErrors.push({ message: "domain-error-too-few-instructions" });
        }
    }
    
    return { valid: finalValid, errors: finalErrors };
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

  // Culinary domain fallback rules
  if (errors.length === 0 && schemaFileBase.includes('recipe')) {
      if (!obj.ingredients || !Array.isArray(obj.ingredients) || obj.ingredients.length === 0) errors.push({ message: "domain-error-missing-ingredients" });
      if (!obj.instructions || obj.instructions.length < 2) errors.push({ message: "domain-error-too-few-instructions" });
  }

  return { valid: errors.length===0, errors };
}

export function listSchemas(){
  return fs.readdirSync(SCHEMA_DIR).filter(f=>f.endsWith('.json'));
}
