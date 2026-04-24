/**
 * Single 0–100 score from recent metrics JSONL + provider health matrix (admin summary; not an SLA contract).
 */

export function computeCompositeHealthScore(metricRows, healthMatrix) {
  let recentHandled = 0;
  let recentErrors = 0;
  let swarmHandled = 0;
  let swarmErrors = 0;
  for (const row of metricRows || []) {
    if (row.event === 'request_handled') {
      recentHandled += 1;
      const st = Number(row.status);
      if (st >= 400 || row.error) recentErrors += 1;
    }
    if (row.event === 'swarm_run_handled') {
      swarmHandled += 1;
      if (!row.ok) swarmErrors += 1;
    }
  }
  const httpScore =
    recentHandled === 0 ? null : Math.round(((recentHandled - recentErrors) / recentHandled) * 100);

  const swarmScore =
    swarmHandled === 0 ? null : Math.round(((swarmHandled - swarmErrors) / swarmHandled) * 100);

  let att = 0;
  let suc = 0;
  for (const caps of Object.values(healthMatrix || {})) {
    const pc = caps?.plain_chat;
    if (pc) {
      att += pc.attempts || 0;
      suc += pc.successes || 0;
    }
  }
  const matrixScore = att === 0 ? null : Math.round((suc / Math.max(1, att)) * 100);

  const parts = [httpScore, matrixScore, swarmScore].filter((x) => x !== null);
  const health_score = parts.length
    ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
    : 72;

  return {
    health_score,
    components: {
      request_handled_ratio_0_100: httpScore,
      provider_matrix_plain_chat_ratio_0_100: matrixScore,
      swarm_run_ratio_0_100: swarmScore,
      request_handled_sample: recentHandled,
      swarm_handled_sample: swarmHandled,
      matrix_attempts: att,
    },
    generated_at: new Date().toISOString(),
  };
}
