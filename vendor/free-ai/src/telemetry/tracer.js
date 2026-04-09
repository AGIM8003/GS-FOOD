import fs from 'fs/promises';
import fsSync from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const TRACES_FILE = join(DATA_DIR, 'traces.jsonl');

try { fsSync.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}

function makeSpanId() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class Span {
  constructor({ name, traceId, parentId = null, attributes = {}, tracer }) {
    this.spanId = makeSpanId();
    this.name = name;
    this.traceId = traceId;
    this.parentId = parentId;
    this.startTime = Date.now();
    this.endTime = null;
    this.status = 'ok';
    this.attributes = { ...attributes };
    this.events = [];
    this._tracer = tracer;
  }

  setAttribute(key, value) {
    this.attributes[key] = value;
    return this;
  }

  addEvent(name, attributes = {}) {
    this.events.push({ name, time: Date.now(), attributes });
    return this;
  }

  setError(message) {
    this.status = 'error';
    this.attributes['error.message'] = String(message);
    return this;
  }

  /** End the span, optionally merging extra attributes. Idempotent. */
  end(attrs = {}) {
    if (this.endTime !== null) return this;
    this.endTime = Date.now();
    if (attrs && Object.keys(attrs).length) Object.assign(this.attributes, attrs);
    this._tracer._flush(this);
    return this;
  }
}

export class Tracer {
  startSpan(name, { traceId = null, parentId = null, attributes = {} } = {}) {
    return new Span({ name, traceId, parentId, attributes, tracer: this });
  }

  _flush(span) {
    const record = {
      trace_id: span.traceId,
      span_id: span.spanId,
      parent_id: span.parentId,
      name: span.name,
      start_time: span.startTime,
      end_time: span.endTime,
      duration_ms: span.endTime - span.startTime,
      status: span.status,
      attributes: span.attributes,
    };
    if (span.events.length) record.events = span.events;
    const line = JSON.stringify(record);
    fs.appendFile(TRACES_FILE, line + '\n').catch(() => {
      try { fsSync.appendFileSync(TRACES_FILE, line + '\n'); } catch (_) {}
    });
  }
}

export const tracer = new Tracer();
