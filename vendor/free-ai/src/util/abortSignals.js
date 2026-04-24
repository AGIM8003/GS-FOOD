/**
 * Merge a wall-clock timeout with an optional client disconnect (upstream fetch) signal.
 * Always call dispose() after the fetch/stream operation completes or throws.
 */
export function mergedTimeoutAndOptionalParent(ms, parent) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  let onParent = null;
  if (parent) {
    if (parent.aborted) {
      clearTimeout(id);
      ctrl.abort();
      return { signal: ctrl.signal, dispose: () => {} };
    }
    onParent = () => {
      clearTimeout(id);
      ctrl.abort();
    };
    parent.addEventListener('abort', onParent);
  }
  const dispose = () => {
    clearTimeout(id);
    if (onParent) parent.removeEventListener('abort', onParent);
  };
  return { signal: ctrl.signal, dispose };
}

export async function fetchWithMergedTimeout(url, init, timeoutMs, externalSignal) {
  const { signal, dispose } = mergedTimeoutAndOptionalParent(timeoutMs, externalSignal);
  const _fetch = globalThis.fetch;
  if (typeof _fetch !== 'function') throw new Error('fetch not available');
  try {
    return await _fetch(url, { ...init, signal });
  } finally {
    dispose();
  }
}
