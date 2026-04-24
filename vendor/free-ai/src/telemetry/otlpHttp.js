/**
 * Best-effort OTLP/HTTP JSON export (no @opentelemetry deps).
 * When OTEL_EXPORTER_OTLP_ENDPOINT is unset, no-op.
 * Dev default remains jsonl in data/traces.jsonl (see tracer.js).
 */

function toHexTraceId(traceId) {
  const s = String(traceId || 'unknown');
  let hex = '';
  for (let i = 0; i < 32; i++) {
    const c = s.charCodeAt(i % s.length) ^ (i * 17);
    hex += (c % 16).toString(16);
  }
  return hex.slice(0, 32).padEnd(32, '0');
}

function toHexSpanId(spanId) {
  const s = String(spanId || 'span');
  let hex = '';
  for (let i = 0; i < 16; i++) {
    const c = s.charCodeAt(i % s.length) ^ (i * 31);
    hex += (c % 16).toString(16);
  }
  return hex.slice(0, 16).padEnd(16, '0');
}

function attrsToOtlp(attrs) {
  const out = [];
  if (!attrs || typeof attrs !== 'object') return out;
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'number' && Number.isFinite(value)) {
      out.push({ key, value: { doubleValue: value } });
    } else {
      out.push({ key, value: { stringValue: String(value) } });
    }
  }
  return out;
}

export async function maybeExportOtlpSpan(spanRecord) {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint || typeof fetch !== 'function') return;

  const serviceName = process.env.OTEL_SERVICE_NAME || 'free-ai';
  const traceId = toHexTraceId(spanRecord.trace_id);
  const spanId = toHexSpanId(spanRecord.span_id);
  const startNs = BigInt(spanRecord.start_time || Date.now()) * 1_000_000n;
  const endNs = BigInt(spanRecord.end_time || Date.now()) * 1_000_000n;

  const body = {
    resourceSpans: [
      {
        resource: {
          attributes: [{ key: 'service.name', value: { stringValue: serviceName } }],
        },
        scopeSpans: [
          {
            scope: { name: 'freeai', version: '0.1.0' },
            spans: [
              {
                traceId,
                spanId,
                name: spanRecord.name || 'span',
                kind: 1,
                startTimeUnixNano: startNs.toString(),
                endTimeUnixNano: endNs.toString(),
                attributes: attrsToOtlp(spanRecord.attributes),
              },
            ],
          },
        ],
      },
    ],
  };

  const url = endpoint.includes('/v1/traces') ? endpoint : `${endpoint.replace(/\/$/, '')}/v1/traces`;
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.OTEL_EXPORTER_OTLP_HEADERS) {
      const [k, v] = process.env.OTEL_EXPORTER_OTLP_HEADERS.split('=');
      if (k && v) headers[k.trim()] = v.trim();
    }
    await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    // non-fatal
  }
}
