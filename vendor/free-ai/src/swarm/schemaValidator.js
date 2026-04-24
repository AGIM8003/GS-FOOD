/**
 * JSON Schema output validation for swarm nodes.
 *
 * Enforces structured output contracts between nodes using JSON Schema (draft-07 subset).
 * Supports: type checking, required fields, enum, pattern, min/max for numbers/strings/arrays,
 * properties, additionalProperties, and nested schemas.
 *
 * Node config can declare:
 *   config.output_schema: { type, properties, required, ... }
 *   config.input_schema: { type, properties, required, ... }
 */

function validateType(value, expected) {
  if (expected === 'string') return typeof value === 'string';
  if (expected === 'number' || expected === 'integer') {
    if (typeof value !== 'number') return false;
    if (expected === 'integer' && !Number.isInteger(value)) return false;
    return true;
  }
  if (expected === 'boolean') return typeof value === 'boolean';
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (expected === 'null') return value === null;
  return true;
}

function validateSchema(value, schema, path) {
  const errors = [];
  const currentPath = path || '$';

  if (!schema || typeof schema !== 'object') return errors;

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const matchesAny = types.some((t) => validateType(value, t));
    if (!matchesAny) {
      errors.push(`${currentPath}: expected type ${schema.type}, got ${typeof value}`);
      return errors;
    }
  }

  if (schema.enum && Array.isArray(schema.enum)) {
    if (!schema.enum.includes(value)) {
      errors.push(`${currentPath}: value must be one of [${schema.enum.join(', ')}]`);
    }
  }

  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${currentPath}: value must be ${JSON.stringify(schema.const)}`);
  }

  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errors.push(`${currentPath}: string length ${value.length} < minLength ${schema.minLength}`);
    }
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
      errors.push(`${currentPath}: string length ${value.length} > maxLength ${schema.maxLength}`);
    }
    if (schema.pattern) {
      try {
        if (!new RegExp(schema.pattern).test(value)) {
          errors.push(`${currentPath}: string does not match pattern ${schema.pattern}`);
        }
      } catch { /* invalid regex, skip */ }
    }
  }

  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      errors.push(`${currentPath}: ${value} < minimum ${schema.minimum}`);
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      errors.push(`${currentPath}: ${value} > maximum ${schema.maximum}`);
    }
    if (typeof schema.exclusiveMinimum === 'number' && value <= schema.exclusiveMinimum) {
      errors.push(`${currentPath}: ${value} <= exclusiveMinimum ${schema.exclusiveMinimum}`);
    }
    if (typeof schema.exclusiveMaximum === 'number' && value >= schema.exclusiveMaximum) {
      errors.push(`${currentPath}: ${value} >= exclusiveMaximum ${schema.exclusiveMaximum}`);
    }
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      errors.push(`${currentPath}: array length ${value.length} < minItems ${schema.minItems}`);
    }
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
      errors.push(`${currentPath}: array length ${value.length} > maxItems ${schema.maxItems}`);
    }
    if (schema.items) {
      for (let i = 0; i < value.length; i++) {
        errors.push(...validateSchema(value[i], schema.items, `${currentPath}[${i}]`));
      }
    }
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (value[key] === undefined) {
          errors.push(`${currentPath}: missing required property '${key}'`);
        }
      }
    }
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (value[key] !== undefined) {
          errors.push(...validateSchema(value[key], propSchema, `${currentPath}.${key}`));
        }
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      const allowed = new Set(Object.keys(schema.properties));
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) {
          errors.push(`${currentPath}: additional property '${key}' not allowed`);
        }
      }
    }
  }

  return errors;
}

/**
 * Validate a value against a JSON Schema.
 *
 * @param {any} value - the value to validate (if string, attempts JSON.parse first)
 * @param {object} schema - JSON Schema object
 * @returns {{ ok: boolean, errors: string[], parsed?: any }}
 */
function validateAgainstSchema(value, schema) {
  if (!schema || typeof schema !== 'object') return { ok: true, errors: [], parsed: value };

  let parsed = value;
  if (typeof value === 'string' && schema.type && schema.type !== 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (e) {
      return { ok: false, errors: [`failed to parse output as JSON: ${e.message}`] };
    }
  }

  const errors = validateSchema(parsed, schema, '$');
  return { ok: errors.length === 0, errors, parsed };
}

/**
 * Validate node input against config.input_schema.
 */
function validateNodeInputSchema(input, nodeConfig) {
  if (!nodeConfig?.input_schema) return { ok: true, errors: [] };
  return validateAgainstSchema(input, nodeConfig.input_schema);
}

/**
 * Validate node output against config.output_schema.
 */
function validateNodeOutputSchema(output, nodeConfig) {
  if (!nodeConfig?.output_schema) return { ok: true, errors: [] };
  return validateAgainstSchema(output, nodeConfig.output_schema);
}

export {
  validateSchema,
  validateAgainstSchema,
  validateNodeInputSchema,
  validateNodeOutputSchema,
};
