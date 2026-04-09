export function runMetacognition({ prompt, intent, persona, skills, memoryHits, mode='M0', thresholds={m1:0.6} }){
  // Orchestrator-style metacognition with M0 inline and optional M1 critic
  const plan = { steps: [], strategy_type: 'direct', execution_mode: mode };
  if (intent.intent_family === 'question') { plan.strategy_type = 'retrieve_then_answer'; plan.steps.push('retrieve memory'); plan.steps.push('construct answer'); }
  else if (intent.intent_family === 'compose') { plan.strategy_type = 'synthesize'; plan.steps.push('gather skills'); plan.steps.push('draft'); }
  else { plan.strategy_type = 'chat'; plan.steps.push('engage'); }

  // uncertainty and risk detection
  const short = (prompt||'').length < 12;
  const hasQuestion = (prompt||'').includes('?');
  const uncertainty_score = short || hasQuestion ? 0.6 : 0.2;
  const confidence = Math.max(0, 1 - uncertainty_score);
  const risk_flags = [];
  if (/password|ssn|credit|secret/i.test(prompt)) risk_flags.push('sensitive');

  const rec = {
    plan_summary: plan,
    strategy_type: plan.strategy_type,
    confidence,
    uncertainty_score,
    rationale_codes: [],
    risk_flags,
    memory_write_candidate: null,
    quality_gate_needed: false,
    escalation_needed: false,
    persona_recommendation: null,
    skill_recommendation: null
  };

  if (/remember|save|note/i.test(prompt)) {
    rec.memory_write_candidate = { category: 'user_request', subject: (prompt||'').slice(0,80), summary: (prompt||'').slice(0,200), confidence: 0.9 };
  }

  if (/architect|design|system|api|integration|scale|latency/i.test(prompt)) rec.persona_recommendation = 'technical';
  if (/research|analyze|study|evidence/i.test(prompt)) rec.persona_recommendation = 'researcher';

  // M1 critic pass decision
  if (confidence < thresholds.m1) {
    rec.quality_gate_needed = true;
    rec.rationale_codes.push('low_confidence');
    // make skill recommendation
    rec.skill_recommendation = 'analysis';
  }

  return { ok:true, metacog: rec, version: 'v2', mode };
}
