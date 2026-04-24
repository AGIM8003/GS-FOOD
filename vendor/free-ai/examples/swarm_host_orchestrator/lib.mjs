/**
 * Minimal host-side client: traceparent, timeout, bounded retries.
 * Copy-only; not published as an npm package.
 */
import crypto from 'crypto';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** W3C traceparent 00-{32 hex trace}-{16 hex span}-01 */
export function makeTraceparent() {
  const traceId = crypto.randomBytes(16).toString('hex');
  const spanId = crypto.randomBytes(8).toString('hex');
  return { traceparent: `00-${traceId}-${spanId}-01`, traceId, spanId };
}

/**
 * POST /v1/infer with optional traceparent and retries on 429 / 5xx / network abort.
 * @param {string} baseUrl e.g. http://127.0.0.1:3311
 * @param {object} body JSON body
 * @param {{ timeoutMs?: number, maxRetries?: number, traceparent?: string }} [opts]
 */
export async function inferWithRetry(baseUrl, body, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 45_000;
  const maxRetries = opts.maxRetries ?? 2;
  const traceparent = opts.traceparent ?? makeTraceparent().traceparent;
  let last = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const r = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/infer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          traceparent,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      clearTimeout(timer);
      const json = await r.json().catch(() => ({}));
      if (r.status === 429 || (r.status >= 500 && r.status < 600)) {
        last = { ok: r.ok, status: r.status, json, traceparent };
        await sleep(Math.min(2000, 200 * 2 ** attempt));
        continue;
      }
      return { ok: r.ok, status: r.status, json, traceparent };
    } catch (e) {
      clearTimeout(timer);
      last = e;
      if (attempt < maxRetries) await sleep(Math.min(2000, 200 * 2 ** attempt));
    }
  }
  if (last && typeof last.status === 'number') return last;
  throw last;
}

/**
 * Three-step fan-out + fan-in (preview merge). Returns structured result for demos/tests.
 * @param {string} baseUrl
 * @param {string} [taskId] defaults to time-based id
 */
export async function runSwarmFanoutDemo(baseUrl, taskId = `demo-task-${Date.now()}`) {
  const w1 = await inferWithRetry(baseUrl, {
    prompt: 'Researcher: list two unknowns about topic X.',
    intent_family: 'swarm_task',
    swarm: { task_id: taskId, agent_id: 'a1', role: 'researcher' },
  });
  const w2 = await inferWithRetry(baseUrl, {
    prompt: 'Coder: propose minimal API shape for merging two text blobs.',
    intent_family: 'swarm_task',
    swarm: { task_id: taskId, agent_id: 'a2', role: 'coder' },
  });
  const traceA = w1.json?.receipt?.trace_id;
  const traceB = w2.json?.receipt?.trace_id;
  const merge = await inferWithRetry(baseUrl, {
    prompt: 'Fan-in placeholder: prior workers produced partial outputs; summarize conflicts only.',
    intent_family: 'swarm_task',
    preview_only: true,
    swarm: {
      task_id: taskId,
      agent_id: 'merge',
      role: 'reviewer',
      fan_in: true,
      child_trace_ids: [traceA, traceB].filter(Boolean),
      merge_strategy: 'primary_wins',
    },
  });
  return {
    taskId,
    workerA: { ok: w1.ok, status: w1.status, trace_id: traceA, traceparent: w1.traceparent },
    workerB: { ok: w2.ok, status: w2.status, trace_id: traceB, traceparent: w2.traceparent },
    merge: {
      ok: merge.ok,
      status: merge.status,
      trace_id: merge.json?.receipt?.trace_id,
      receipt_swarm: merge.json?.receipt?.swarm ?? null,
    },
  };
}
