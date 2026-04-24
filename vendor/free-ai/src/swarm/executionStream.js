/**
 * SSE (Server-Sent Events) streaming for swarm execution.
 * Publishes real-time events as nodes execute.
 */

const subscribers = new Map();

export function createExecutionStream(runId) {
  if (!subscribers.has(runId)) subscribers.set(runId, []);
  return {
    subscribe(callback) {
      subscribers.get(runId).push(callback);
      return () => {
        const subs = subscribers.get(runId);
        if (!subs) return;
        const idx = subs.indexOf(callback);
        if (idx >= 0) subs.splice(idx, 1);
        if (subs.length === 0) {
          subscribers.delete(runId);
        }
      };
    },
  };
}

export function emitExecutionEvent(runId, event) {
  const subs = subscribers.get(runId);
  if (!subs || subs.length === 0) return;
  const payload = { ...event, run_id: runId, timestamp: new Date().toISOString() };
  for (const cb of subs) {
    try { cb(payload); } catch { /* ignore subscriber errors */ }
  }
}

export function cleanupStream(runId) {
  subscribers.delete(runId);
}

export function activeStreams() {
  return [...subscribers.keys()];
}
