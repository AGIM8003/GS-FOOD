import fs from 'fs/promises';
import { join } from 'path';
import { readLastDecision } from '../providers/ladder.js';
import { summarizeHealthMatrix } from '../providers/healthMatrix.js';
import { snapshotAll } from '../providers/budgetGuardian.js';
import { listCooldowns } from '../providers/cooldownManager.js';
import { summarizeDecisionGraphs } from '../control/decisionGraph.js';
import { readGovernanceState } from '../providers/governance.js';
import { listPromotionReceipts } from '../prompt/promotion.js';
import { summarizeGraph } from '../memory/graph.js';
import { listAcquisitionJobs } from '../persona/acquisition.js';
import { applyTrainingReviewDecision, getTrainingReviewQueue, getTrainingStatus, runTrainingCycle, setTrainingEnabled, updateTrainingProfile } from '../training/engine.js';
import { loadTrainingInsights, loadTrainingOverlays } from '../training/store.js';
import { verifyReceiptLedger } from '../receipts.js';

const IMPORTS_DIR = join(process.cwd(),'evidence','imports');

export async function latestImportSummary(){
  try{
    const files = await fs.readdir(IMPORTS_DIR);
    const summaries = files.filter(f=> f.startsWith('summary-') && f.endsWith('.json')).sort().reverse();
    if (!summaries.length) return null;
    const path = join(IMPORTS_DIR, summaries[0]);
    const txt = await fs.readFile(path,'utf8');
    return JSON.parse(txt);
  }catch(e){ return null; }
}

export async function listQuarantine(){
  try{
    const qdir = join(IMPORTS_DIR,'quarantine');
    const files = await fs.readdir(qdir);
    return files.filter(f=> f.endsWith('.json'));
  }catch(e){ return []; }
}

export async function readEvidence(kind='imports'){ try{ const dir = join(process.cwd(),'evidence', kind); const files = await fs.readdir(dir); return files.filter(f=> f.endsWith('.json')); }catch(e){ return []; } }

export async function listPromptReceipts(){ try{ const dir = join(process.cwd(),'evidence','prompts'); const files = await fs.readdir(dir); return files.filter(f=> f.endsWith('.json')).sort().reverse(); }catch(e){ return []; } }

export async function listValidationReceipts(){ try{ const dir = join(process.cwd(),'evidence','validation'); const files = await fs.readdir(dir); return files.filter(f=> f.endsWith('.json')).sort().reverse(); }catch(e){ return []; } }

export async function listTraceFiles(){ try{ const dir = join(process.cwd(),'evidence','traces'); const files = await fs.readdir(dir); return files.filter(f=> f.endsWith('.json')).sort().reverse(); }catch(e){ return []; } }

export async function readJsonEvidence(kind, file){
  try {
    const dir = join(process.cwd(),'evidence', kind);
    const txt = await fs.readFile(join(dir, file), 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

export function getProviderLadderStatus(){ return readLastDecision(); }
export function getProviderHealthMatrix(){ return summarizeHealthMatrix(); }
export function getQuotaSnapshots(){ return snapshotAll(); }
export function getCooldownStatus(){ return listCooldowns(); }
export function getDecisionGraphs(){ return summarizeDecisionGraphs(); }
export function getProviderGovernance(){ return readGovernanceState(); }
export function getPromptPromotions(){ return listPromotionReceipts(); }
export async function getMemoryGraphSummary(){ return summarizeGraph(); }
export async function getAcquisitionJobs(){ return listAcquisitionJobs(); }
export async function getTrainingEngineStatus(){ return getTrainingStatus(); }
export async function getTrainingInsights(){ return loadTrainingInsights(); }
export async function getTrainingOverlays(){ return loadTrainingOverlays(); }
export async function getTrainingReviewItems(){ return getTrainingReviewQueue(); }
export function getReceiptLedgerStatus(){ return verifyReceiptLedger(); }
export async function runTrainingNow(){ return runTrainingCycle({ force: true, reason: 'admin_manual_run' }); }
export async function setTrainingControl(enabled){ return setTrainingEnabled(enabled); }
export async function updateTrainingEnvironmentProfile(patch){ return updateTrainingProfile(patch); }
export async function reviewTrainingItem(payload){ return applyTrainingReviewDecision(payload || {}); }

export default { latestImportSummary, listQuarantine, readEvidence };
