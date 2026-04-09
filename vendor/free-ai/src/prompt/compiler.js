export function compilePrompt(prompt, persona = {}, skills = [], intent = {}, options = {}) {
  // Build a more structured system prompt that includes:
  // - persona system instructions
  // - translator and context summary hints
  // - mounted skills with short usage hints
  // - response requirements (format, length, citations, safety)
  // - explanation / why panel template that the runtime will attach to the receipt

  const lines = [];

  // Persona instructions (system role)
  if (persona.system_prompt) {
    lines.push(`System Persona: ${persona.name || persona.id || 'assistant'}`);
    lines.push(persona.system_prompt);
  } else {
    lines.push('System Persona: assistant');
    lines.push('Be helpful, concise, and follow user instructions. Prefer evidence and cite sources when available.');
  }

  // Translator / intent hint
  if (intent && Object.keys(intent).length) {
    lines.push(`-- Translator Summary --`);
    if (intent.intent_family) lines.push(`Intent Family: ${intent.intent_family}`);
    if (intent.task_type) lines.push(`Task Type: ${intent.task_type}`);
    if (intent.constraints) lines.push(`Constraints: ${JSON.stringify(intent.constraints)}`);
    if (intent.output_preferences) lines.push(`Output Preferences: ${JSON.stringify(intent.output_preferences)}`);
  }

  // Context hint (compact)
  if (options.contextSnapshot) {
    lines.push(`-- Context Snapshot --`);
    const ctx = options.contextSnapshot;
    if (ctx.domain) lines.push(`Domain: ${ctx.domain}`);
    if (ctx.continuity_score !== undefined) lines.push(`Continuity: ${ctx.continuity_score}`);
    if (ctx.persona_hints) lines.push(`Persona Hints: ${ctx.persona_hints.join(', ')}`);
    if (ctx.skill_hints) lines.push(`Skill Hints: ${ctx.skill_hints.join(', ')}`);
  }

  if (options.learningContext && options.learningContext.enabled) {
    const learning = options.learningContext;
    lines.push(`-- Learning Academy --`);
    if (learning.environment) lines.push(`Environment: ${learning.environment}`);
    if (learning.domain) lines.push(`Learning Domain: ${learning.domain}`);
    if (learning.regulatory_mode) lines.push(`Regulatory Mode: ${learning.regulatory_mode}`);
    if (learning.guidance && learning.guidance.length) lines.push(`Guidance: ${learning.guidance.join(' | ')}`);
    if (learning.compliance_notes && learning.compliance_notes.length) lines.push(`Compliance Notes: ${learning.compliance_notes.join(' | ')}`);
  }

  // Skills section: short actionable instruction for each mounted skill
  if (Array.isArray(skills) && skills.length) {
    lines.push(`-- Active Skills (${skills.length}) --`);
    for (const s of skills) {
      const id = s.id || s.skill_id || 'unknown';
      const name = s.name || id;
      const purpose = s.purpose || (s.description || 'Assist with task');
      const hint = s.prompt_fragments && s.prompt_fragments.length ? s.prompt_fragments[0] : '';
      lines.push(`# Skill: ${id} — ${name}`);
      lines.push(`Purpose: ${purpose}`);
      if (hint) lines.push(`Usage hint: ${hint}`);
      // compact compatibility note
      if (s.risk_class) lines.push(`Risk: ${s.risk_class}`);
    }
  }

  // Response requirements and safety
  lines.push('-- Response Requirements --');
  lines.push('1) Provide a concise answer first (3-5 sentences) followed by an evidence section.');
  lines.push('2) If structured output is requested, return only the requested contract in JSON under a top-level `result` field.');
  lines.push('3) Always include a `why` block listing: selected persona, selected skills, provider route class, and brief rationale (2-3 bullets).');
  lines.push('4) If unsure or lacking information, ask a clarifying question rather than guessing.');
  lines.push('5) Enforce safety: remove PII, do not provide disallowed content.');

  // Prompt itself
  lines.push('-- User Prompt --');
  lines.push(prompt);

  // Minimal metadata guidance for receipts / explainability
  lines.push('-- Evidence / Why Panel Template --');
  lines.push('EXPLAIN: Provide JSON with keys: `final_persona_id`, `skills_used`, `route_reason`, `confidence` and `notes` (short).');

  return lines.join('\n') + '\n';
}
