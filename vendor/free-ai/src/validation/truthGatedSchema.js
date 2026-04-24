/*
 * Truth-Gated Schema Enforcer
 * Enforces Zero-Trust constraints on Swarm payloads for Clinical (EHR) and Industrial domains.
 * Implements a fail-closed safety posture. 
 */

import fs from 'fs';
import path from 'path';

let schemaCache = null;

function loadSafetySchema() {
  if (schemaCache) return schemaCache;
  try {
    const schemaPath = path.join(process.cwd(), 'src', 'schemas', 'failClosedSafety.schema.json');
    schemaCache = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    return schemaCache;
  } catch (err) {
    console.warn("[TruthGatedSchema] Could not load failClosedSafety schema. Defaulting to strict isolation.");
    return null;
  }
}

/**
 * Validates an industrial or clinical payload.
 * @param {Object} payload 
 * @returns {boolean} pass/fail
 */
export function validateTruthGatedPayload(payload) {
  const schema = loadSafetySchema();
  if (!schema) return false; // Fail-closed

  // Structural sanity check
  if (!payload.domain || !payload.classification || !payload.payload) {
    console.error("[TruthGatedSchema] Missing core structural fields.");
    return false;
  }

  // Clinical Domain: PII check (pseudo VQ-VAE semantic constraint)
  if (payload.domain === 'clinical') {
    if (payload.payload.pii_present) {
      console.error("[TruthGatedSchema] BLOCK: Clinical payload contains PII! Cannot export to cloud nodes.");
      return false;
    }
  }

  // Industrial Domain: Invariant bounds
  if (payload.domain === 'industrial') {
    if (payload.payload.max_temperature_celsius !== undefined) {
      // Invariant bounding
      if (payload.payload.max_temperature_celsius > schema.properties.payload.properties.max_temperature_celsius.maximum) {
        console.error(`[TruthGatedSchema] BLOCK: Thermal invariant breached (${payload.payload.max_temperature_celsius}C).`);
        return false;
      }
    }
    if (payload.payload.max_speed_rpm !== undefined) {
      if (payload.payload.max_speed_rpm > schema.properties.payload.properties.max_speed_rpm.maximum) {
        console.error(`[TruthGatedSchema] BLOCK: RPM invariant breached (${payload.payload.max_speed_rpm} RPM).`);
        return false;
      }
    }
  }

  return true;
}
