import fs from 'fs';
import path from 'path';

const TRACE_DIR = path.join(process.cwd(), 'evidence', 'traces');
function ensureDir() { if (!fs.existsSync(TRACE_DIR)) fs.mkdirSync(TRACE_DIR, { recursive: true }); }

export function startSpan(name, meta={}){
  const span = { id: `s-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, name, start: Date.now(), meta, events: [] };
  return span;
}

export function addEvent(span, eventName, data){
  try{ span.events.push({ ts: Date.now(), event: eventName, data }); }catch(e){}
}

export function endSpan(span, outcome={}){
  try{
    span.end = Date.now();
    span.duration_ms = span.end - span.start;
    span.outcome = outcome;
    ensureDir();
    const file = path.join(TRACE_DIR, `${span.id}.json`);
    fs.writeFileSync(file, JSON.stringify(span, null, 2));
    // lightweight console debug
    if (process.env.FREEAI_TRACE_CONSOLE) console.log('[trace]', span.name, span.id, span.duration_ms+'ms');
  }catch(e){ /* noop */ }
}

export function recordEvent(name, data){
  try{ ensureDir(); const rec = { id: `e-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, name, ts: Date.now(), data }; fs.writeFileSync(path.join(TRACE_DIR, `${rec.id}.json`), JSON.stringify(rec, null, 2)); }catch(e){}
}

export default { startSpan, addEvent, endSpan, recordEvent };
