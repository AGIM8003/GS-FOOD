import { parseAndValidateOutput } from './contracts.js';

export function enforceQualityGates(rawText, contract, options = {}) {
  // Gate 1: Schema Validity
  const result = parseAndValidateOutput(rawText, contract);
  if (!result.valid) {
    result.gate_failed = 1;
    return result;
  }

  const parsed = result.parsed;
  
  // Gate 4: Repair Budget Acceptance
  if ((options.repair_attempts || 0) >= 3) {
    result.valid = false;
    result.errors.push({ message: 'Gate 4 Violation: Repair budget exceeded' });
    result.gate_failed = 4;
    return result;
  }

  // Gate 3: Provider Trust Acceptance
  if (options.provider_degraded) {
    result.valid = false;
    result.errors.push({ message: 'Gate 3 Violation: Provider trust degraded during generation' });
    result.gate_failed = 3;
    return result;
  }

  // Defect #2 Repair: Dynamic Domain Checks (Gate 2 & 7) applicable generically
  if (parsed.cards && Array.isArray(parsed.cards)) {
    for (const card of parsed.cards) {
      if (card.used_inventory_ingredients) {
        for (const ing of card.used_inventory_ingredients) {
          if (ing.quantity < 0 || ing.quantity > 50000) { 
             result.valid = false;
             result.errors.push({ message: `Gate 2 Violation: Unit sanity failed for ${ing.name}` });
             result.gate_failed = 2;
          }
        }
      }
      // Gate 7: Evidence Completeness for Meal Cards
      if (contract.id === 'meal_card_suggestions' && (!card.ai_explanation_trace || card.ai_explanation_trace.length === 0)) {
         result.valid = false;
         result.errors.push({ message: 'Gate 7 Violation: Missing AI explanation trace evidence' });
         result.gate_failed = 7;
      }
    }
  }

  // Generic Domain Constraints Phase
  if (parsed.steps && parsed.steps.length === 0) {
     result.valid = false;
     result.errors.push({ message: 'Gate 2 Violation: Planner steps array must not be empty.' });
     result.gate_failed = 2;
  }
  
  if (parsed.summary && parsed.summary.trim().length < 5) {
     result.valid = false;
     result.errors.push({ message: 'Gate 2 Violation: Report summary is too short or malformed.' });
     result.gate_failed = 2;
  }

  // Gate 5: Memory Write Safety
  if (options.memory_candidates) {
     for (const mem of options.memory_candidates) {
        if (!mem.confidence || mem.confidence < 0.5) {
           result.valid = false;
           result.errors.push({ message: 'Gate 5 Violation: Low confidence memory write attempted' });
           result.gate_failed = 5;
        }
     }
  }

  // Gate 6: Response Display Approval
  // Check if output contains unsafe formatting for UI
  if (JSON.stringify(parsed).includes("<script>")) {
     result.valid = false;
     result.errors.push({ message: 'Gate 6 Violation: Unsafe output detected' });
     result.gate_failed = 6;
  }

  return result;
}
