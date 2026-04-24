import fs from 'fs/promises';
import path from 'path';
import { runSwarmGraph } from '../swarm/runSwarmGraph.js'; // Assuming this executes the graph

const DATA_DIR = path.join(process.cwd(), 'data');
const EVAL_DATASET = path.join(DATA_DIR, 'eval_dataset.json');

/**
 * Regression Runner
 * Replays a curated set of inputs through the swarm graph to ensure that prompt 
 * optimizations and scorecard penalties haven't degraded overall reliability.
 */
export async function runRegressionSuite() {
  console.log('[RegressionRunner] Starting regression evaluation...');
  
  let dataset;
  try {
    const raw = await fs.readFile(EVAL_DATASET, 'utf-8');
    dataset = JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn('[RegressionRunner] No eval dataset found. Create data/eval_dataset.json to run regressions.');
      return;
    }
    throw err;
  }

  let total = dataset.length;
  let passed = 0;
  let failed = 0;
  
  const results = [];

  for (const tc of dataset) {
    console.log(`[RegressionRunner] Running test case: ${tc.id} - ${tc.description}`);
    
    // Setup simulated req payload
    const reqBody = {
      prompt: tc.prompt,
      intent_family: tc.intent_family || 'default_chat',
      // Force specific routing for test determinism
      model_selection_policy_mode: 'AUTO_PROMOTE_GOVERNED'
    };

    try {
      // Assuming runSwarmGraph accepts reqBody and contextual args
      const startTime = Date.now();
      
      const result = await runSwarmGraph(reqBody, /* bypass auth/hooks */ {});
      
      const duration = Date.now() - startTime;
      
      // Basic assertion checking
      let isSuccess = true;
      let failReason = '';

      if (result.error) {
        isSuccess = false;
        failReason = `Graph error: ${result.error.message}`;
      } else if (tc.expected_schema && !result.receipt?.extracted_schema) {
        isSuccess = false;
        failReason = 'Did not extract expected schema';
      } else if (tc.must_contain && !JSON.stringify(result).includes(tc.must_contain)) {
        isSuccess = false;
        failReason = `Output did not contain required string: ${tc.must_contain}`;
      }

      if (isSuccess) {
        passed++;
        console.log(`  -> PASS (${duration}ms)`);
      } else {
        failed++;
        console.warn(`  -> FAIL (${duration}ms): ${failReason}`);
      }

      results.push({
        id: tc.id,
        status: isSuccess ? 'pass' : 'fail',
        duration_ms: duration,
        reason: failReason,
        run_id: result.receipt?.run_id
      });
      
    } catch (ex) {
      failed++;
      console.error(`  -> FAIL (Exception): ${ex.message}`);
      results.push({ id: tc.id, status: 'fail', error: ex.message });
    }
  }

  const outReport = path.join(DATA_DIR, `regression_report_${Date.now()}.json`);
  await fs.writeFile(outReport, JSON.stringify({
    timestamp: new Date().toISOString(),
    total,
    passed,
    failed,
    pass_rate: total > 0 ? (passed / total) : 0,
    results
  }, null, 2));

  console.log(`[RegressionRunner] Suite complete. ${passed}/${total} passed. Report saved to ${outReport}`);
}

// Support running from CLI
if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1] === import.meta.filename) {
  runRegressionSuite().catch(console.error);
}
