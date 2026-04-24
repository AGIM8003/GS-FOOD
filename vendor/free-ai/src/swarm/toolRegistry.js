import crypto from 'crypto';

const registry = new Map();

function registerTool(def) {
  if (!def || !def.tool_id || !def.tool_class || typeof def.execute !== 'function') {
    throw new Error('invalid_tool_definition: requires tool_id, tool_class, execute');
  }
  registry.set(def.tool_id, def);
}

function getTool(toolId) {
  return registry.get(toolId) || null;
}

function listTools() {
  return [...registry.values()].map((t) => ({
    tool_id: t.tool_id,
    tool_class: t.tool_class,
    description: t.description || '',
  }));
}

function clearRegistry() {
  registry.clear();
}

registerTool({
  tool_id: 'identity_transform',
  tool_class: 'local_transform',
  description: 'Returns input unchanged',
  execute: (input) => input,
});

registerTool({
  tool_id: 'json_extract_field',
  tool_class: 'json_extract',
  description: 'Extracts a field from JSON input',
  execute: (input) => {
    const { data, field } = input || {};
    if (!data || !field) return { error: 'missing data or field' };
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return { value: parsed[field] ?? null };
    } catch {
      return { error: 'invalid_json' };
    }
  },
});

registerTool({
  tool_id: 'template_render',
  tool_class: 'deterministic_template_render',
  description: 'Renders a template string with variable substitution',
  execute: (input) => {
    const { template, variables } = input || {};
    if (typeof template !== 'string') return { error: 'template must be string' };
    let result = template;
    for (const [k, v] of Object.entries(variables || {})) {
      result = result.replaceAll(`{{${k}}}`, String(v ?? ''));
    }
    return { rendered: result };
  },
});

registerTool({
  tool_id: 'lookup_registry',
  tool_class: 'internal_readonly_lookup',
  description: 'Looks up a value from a static map',
  execute: (input) => {
    const { key, map } = input || {};
    if (!map || typeof map !== 'object') return { error: 'map must be object' };
    return { value: map[key] ?? null };
  },
});

registerTool({
  tool_id: 'string_uppercase',
  tool_class: 'local_transform',
  description: 'Converts string to uppercase',
  execute: (input) => {
    const { text } = input || {};
    if (typeof text !== 'string') return { error: 'text must be string' };
    return { value: text.toUpperCase() };
  },
});

registerTool({
  tool_id: 'string_lowercase',
  tool_class: 'local_transform',
  description: 'Converts string to lowercase',
  execute: (input) => {
    const { text } = input || {};
    if (typeof text !== 'string') return { error: 'text must be string' };
    return { value: text.toLowerCase() };
  },
});

registerTool({
  tool_id: 'string_trim',
  tool_class: 'local_transform',
  description: 'Trims whitespace from string',
  execute: (input) => {
    const { text } = input || {};
    if (typeof text !== 'string') return { error: 'text must be string' };
    return { value: text.trim() };
  },
});

registerTool({
  tool_id: 'string_split',
  tool_class: 'local_transform',
  description: 'Splits string by delimiter',
  execute: (input) => {
    const { text, delimiter } = input || {};
    if (typeof text !== 'string') return { error: 'text must be string' };
    return { value: text.split(delimiter || ',') };
  },
});

registerTool({
  tool_id: 'string_join',
  tool_class: 'local_transform',
  description: 'Joins array elements with separator',
  execute: (input) => {
    const { items, separator } = input || {};
    if (!Array.isArray(items)) return { error: 'items must be array' };
    return { value: items.join(separator ?? ',') };
  },
});

registerTool({
  tool_id: 'string_replace',
  tool_class: 'local_transform',
  description: 'Replaces occurrences in a string',
  execute: (input) => {
    const { text, search, replacement } = input || {};
    if (typeof text !== 'string') return { error: 'text must be string' };
    return { value: text.replaceAll(String(search ?? ''), String(replacement ?? '')) };
  },
});

registerTool({
  tool_id: 'string_length',
  tool_class: 'local_transform',
  description: 'Returns the length of a string',
  execute: (input) => {
    const { text } = input || {};
    if (typeof text !== 'string') return { error: 'text must be string' };
    return { value: text.length };
  },
});

registerTool({
  tool_id: 'string_slice',
  tool_class: 'local_transform',
  description: 'Extracts a substring by start/end index',
  execute: (input) => {
    const { text, start, end } = input || {};
    if (typeof text !== 'string') return { error: 'text must be string' };
    return { value: text.slice(start || 0, end) };
  },
});

registerTool({
  tool_id: 'array_sort',
  tool_class: 'local_transform',
  description: 'Sorts an array (lexicographic or numeric)',
  execute: (input) => {
    const { items, numeric } = input || {};
    if (!Array.isArray(items)) return { error: 'items must be array' };
    const sorted = [...items].sort(numeric ? (a, b) => Number(a) - Number(b) : undefined);
    return { value: sorted };
  },
});

registerTool({
  tool_id: 'array_filter_truthy',
  tool_class: 'local_transform',
  description: 'Filters out falsy values from array',
  execute: (input) => {
    const { items } = input || {};
    if (!Array.isArray(items)) return { error: 'items must be array' };
    return { value: items.filter(Boolean) };
  },
});

registerTool({
  tool_id: 'array_unique',
  tool_class: 'local_transform',
  description: 'Returns unique values from array',
  execute: (input) => {
    const { items } = input || {};
    if (!Array.isArray(items)) return { error: 'items must be array' };
    return { value: [...new Set(items)] };
  },
});

registerTool({
  tool_id: 'array_flatten',
  tool_class: 'local_transform',
  description: 'Flattens nested arrays one level deep',
  execute: (input) => {
    const { items } = input || {};
    if (!Array.isArray(items)) return { error: 'items must be array' };
    return { value: items.flat() };
  },
});

registerTool({
  tool_id: 'array_length',
  tool_class: 'local_transform',
  description: 'Returns the length of an array',
  execute: (input) => {
    const { items } = input || {};
    if (!Array.isArray(items)) return { error: 'items must be array' };
    return { value: items.length };
  },
});

registerTool({
  tool_id: 'math_sum',
  tool_class: 'deterministic_compute',
  description: 'Sums an array of numbers',
  execute: (input) => {
    const { numbers } = input || {};
    if (!Array.isArray(numbers)) return { error: 'numbers must be array' };
    return { value: numbers.reduce((a, b) => Number(a) + Number(b), 0) };
  },
});

registerTool({
  tool_id: 'math_average',
  tool_class: 'deterministic_compute',
  description: 'Computes the average of an array of numbers',
  execute: (input) => {
    const { numbers } = input || {};
    if (!Array.isArray(numbers) || numbers.length === 0) return { error: 'numbers must be non-empty array' };
    const sum = numbers.reduce((a, b) => Number(a) + Number(b), 0);
    return { value: sum / numbers.length };
  },
});

registerTool({
  tool_id: 'math_round',
  tool_class: 'deterministic_compute',
  description: 'Rounds a number to specified decimal places',
  execute: (input) => {
    const { number, decimals } = input || {};
    if (typeof number !== 'number') return { error: 'number must be number' };
    const factor = Math.pow(10, decimals || 0);
    return { value: Math.round(number * factor) / factor };
  },
});

registerTool({
  tool_id: 'math_min_max',
  tool_class: 'deterministic_compute',
  description: 'Returns min and max from an array of numbers',
  execute: (input) => {
    const { numbers } = input || {};
    if (!Array.isArray(numbers) || numbers.length === 0) return { error: 'numbers must be non-empty array' };
    return { min: Math.min(...numbers), max: Math.max(...numbers) };
  },
});

registerTool({
  tool_id: 'math_clamp',
  tool_class: 'deterministic_compute',
  description: 'Clamps a number between min and max',
  execute: (input) => {
    const { number, min, max } = input || {};
    if (typeof number !== 'number') return { error: 'number must be number' };
    return { value: Math.min(Math.max(number, min ?? -Infinity), max ?? Infinity) };
  },
});

registerTool({
  tool_id: 'date_iso_now',
  tool_class: 'deterministic_compute',
  description: 'Returns the current ISO timestamp',
  execute: () => ({ value: new Date().toISOString() }),
});

registerTool({
  tool_id: 'date_parse',
  tool_class: 'deterministic_compute',
  description: 'Parses a date string and returns ISO + epoch',
  execute: (input) => {
    const { date_string } = input || {};
    if (typeof date_string !== 'string') return { error: 'date_string must be string' };
    const d = new Date(date_string);
    if (isNaN(d.getTime())) return { error: 'invalid_date' };
    return { iso: d.toISOString(), epoch_ms: d.getTime() };
  },
});

registerTool({
  tool_id: 'hash_sha256',
  tool_class: 'deterministic_compute',
  description: 'SHA-256 hash of input string',
  execute: (input) => {
    const { text } = input || {};
    if (typeof text !== 'string') return { error: 'text must be string' };
    return { value: crypto.createHash('sha256').update(text).digest('hex') };
  },
});

registerTool({
  tool_id: 'base64_encode',
  tool_class: 'local_transform',
  description: 'Base64 encodes a string',
  execute: (input) => {
    const { text } = input || {};
    if (typeof text !== 'string') return { error: 'text must be string' };
    return { value: Buffer.from(text).toString('base64') };
  },
});

registerTool({
  tool_id: 'base64_decode',
  tool_class: 'local_transform',
  description: 'Base64 decodes a string',
  execute: (input) => {
    const { text } = input || {};
    if (typeof text !== 'string') return { error: 'text must be string' };
    try {
      return { value: Buffer.from(text, 'base64').toString('utf8') };
    } catch {
      return { error: 'invalid_base64' };
    }
  },
});

registerTool({
  tool_id: 'json_stringify',
  tool_class: 'local_transform',
  description: 'JSON.stringify with optional pretty printing',
  execute: (input) => {
    const { data, pretty } = input || {};
    try {
      return { value: JSON.stringify(data, null, pretty ? 2 : undefined) };
    } catch {
      return { error: 'cannot_stringify' };
    }
  },
});

registerTool({
  tool_id: 'json_parse',
  tool_class: 'local_transform',
  description: 'Parses a JSON string into an object',
  execute: (input) => {
    const { text } = input || {};
    if (typeof text !== 'string') return { error: 'text must be string' };
    try {
      return { value: JSON.parse(text) };
    } catch {
      return { error: 'invalid_json' };
    }
  },
});

registerTool({
  tool_id: 'regex_match',
  tool_class: 'local_transform',
  description: 'Tests a regex pattern against text, returns matches',
  execute: (input) => {
    const { text, pattern, flags } = input || {};
    if (typeof text !== 'string' || typeof pattern !== 'string') return { error: 'text and pattern must be strings' };
    try {
      const re = new RegExp(pattern, flags || '');
      const match = text.match(re);
      return { matched: !!match, groups: match ? [...match] : [] };
    } catch {
      return { error: 'invalid_regex' };
    }
  },
});

registerTool({
  tool_id: 'regex_replace',
  tool_class: 'local_transform',
  description: 'Replaces regex matches in text',
  execute: (input) => {
    const { text, pattern, replacement, flags } = input || {};
    if (typeof text !== 'string' || typeof pattern !== 'string') return { error: 'text and pattern must be strings' };
    try {
      const re = new RegExp(pattern, flags || 'g');
      return { value: text.replace(re, replacement || '') };
    } catch {
      return { error: 'invalid_regex' };
    }
  },
});

registerTool({
  tool_id: 'object_keys',
  tool_class: 'local_transform',
  description: 'Returns the keys of an object',
  execute: (input) => {
    const { data } = input || {};
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: 'data must be object' };
    return { value: Object.keys(data) };
  },
});

registerTool({
  tool_id: 'object_values',
  tool_class: 'local_transform',
  description: 'Returns the values of an object',
  execute: (input) => {
    const { data } = input || {};
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: 'data must be object' };
    return { value: Object.values(data) };
  },
});

registerTool({
  tool_id: 'object_merge',
  tool_class: 'local_transform',
  description: 'Shallow-merges multiple objects',
  execute: (input) => {
    const { objects } = input || {};
    if (!Array.isArray(objects)) return { error: 'objects must be array' };
    return { value: Object.assign({}, ...objects) };
  },
});

registerTool({
  tool_id: 'object_pick',
  tool_class: 'local_transform',
  description: 'Picks specified keys from an object',
  execute: (input) => {
    const { data, keys } = input || {};
    if (!data || typeof data !== 'object') return { error: 'data must be object' };
    if (!Array.isArray(keys)) return { error: 'keys must be array' };
    const result = {};
    for (const k of keys) if (k in data) result[k] = data[k];
    return { value: result };
  },
});

registerTool({
  tool_id: 'conditional_select',
  tool_class: 'deterministic_compute',
  description: 'Returns value_if_true or value_if_false based on condition evaluation',
  execute: (input) => {
    const { condition, value_if_true, value_if_false } = input || {};
    return { value: condition ? value_if_true : value_if_false };
  },
});

registerTool({
  tool_id: 'counter',
  tool_class: 'deterministic_compute',
  description: 'Returns a sequential counter value (for iteration tracking)',
  execute: (input) => {
    const { current, increment } = input || {};
    return { value: (Number(current) || 0) + (Number(increment) || 1) };
  },
});

export { registerTool, getTool, listTools, clearRegistry };
