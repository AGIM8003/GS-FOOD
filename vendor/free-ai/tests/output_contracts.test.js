import { parseAndValidateOutput, outputContracts } from '../src/prompt/contracts.js';

let result = parseAndValidateOutput('{"why":{"route_reason":"test"}}', outputContracts.receipt_augmented_answer);
if (result.valid) {
  console.error('receipt_augmented_answer should fail due to missing answer');
  process.exit(2);
}

result = parseAndValidateOutput('{"final_persona_id":"p1","skills_used":["s1"],"route_reason":"ladder_choice","confidence":0.8,"notes":"ok"}', outputContracts.explanation_panel);
if (!result.valid) {
  console.error('explanation_panel should validate');
  process.exit(2);
}

const repaired = parseAndValidateOutput('```json\n{"steps":["a","b"]}\n```', outputContracts.plan_output);
if (!repaired.valid || !repaired.repaired) {
  console.error('plan_output repair path should succeed');
  process.exit(2);
}

console.log('output_contracts test OK');
