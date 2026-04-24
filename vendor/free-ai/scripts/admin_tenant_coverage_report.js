#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function route(pathPattern, method, scope, notes) {
  return { path_pattern: pathPattern, method, tenant_scope: scope, notes };
}

function buildCoverageReport() {
  const globalSafe = [
    route('/admin/imports', 'GET', 'global_safe', 'import pipeline metadata only'),
    route('/admin/quarantine', 'GET', 'global_safe', 'quarantine file listing only'),
    route('/admin/evidence', 'GET', 'global_safe', 'evidence listing only'),
    route('/admin/prompts', 'GET', 'global_safe', 'prompt receipt listing'),
    route('/admin/validation', 'GET', 'global_safe', 'validation receipt listing'),
    route('/admin/traces', 'GET', 'global_safe', 'trace file listing only'),
    route('/admin/provider-ladder', 'GET', 'global_safe', 'provider health/governance metadata'),
    route('/admin/provider-health', 'GET', 'global_safe', 'provider health matrix'),
    route('/admin/quota-snapshots', 'GET', 'global_safe', 'provider quota snapshot metadata'),
    route('/admin/cooldowns', 'GET', 'global_safe', 'provider cooldown metadata'),
    route('/admin/provider-governance', 'GET', 'global_safe', 'provider governance status'),
    route('/admin/health-composite', 'GET', 'global_safe', 'aggregate service health summary'),
    route('/admin/metrics-summary', 'GET', 'global_safe', 'aggregate metrics summary'),
    route('/admin/model-catalog-summary', 'GET', 'global_safe', 'catalog-level aggregate metadata'),
    route('/admin/model-pins', 'GET', 'global_safe', 'lane/model pin configuration'),
    route('/admin/model-refresh-status', 'GET', 'global_safe', 'catalog refresh status'),
    route('/admin/model-promotion-history', 'GET', 'global_safe', 'promotion history metadata'),
    route('/admin/packs', 'GET', 'global_safe', 'pack status metadata'),
    route('/admin/decision-graphs', 'GET', 'global_safe', 'decision graph metadata'),
    route('/admin/prompt-promotions', 'GET', 'global_safe', 'prompt promotion receipts'),
    route('/admin/receipt-chain', 'GET', 'global_safe', 'receipt chain status metadata'),
    route('/admin/memory-graph', 'GET', 'global_safe', 'memory graph summary'),
    route('/admin/acquisition', 'GET', 'global_safe', 'acquisition job metadata'),
    route('/admin/training', 'GET', 'global_safe', 'training status metadata'),
    route('/admin/training/insights', 'GET', 'global_safe', 'training insights aggregate'),
    route('/admin/training/overlays', 'GET', 'global_safe', 'training overlay aggregate'),
    route('/admin/training/review-queue', 'GET', 'global_safe', 'training review queue aggregate'),
    route('/admin/swarm-policy-summary', 'GET', 'global_safe', 'policy zone metadata'),
    route('/admin/swarm-tool-registry', 'GET', 'global_safe', 'tool registry metadata'),
    route('/admin/swarm-circuit-breakers', 'GET', 'global_safe', 'circuit breaker metadata'),
    route('/admin/swarm-lifecycle-hooks', 'GET', 'global_safe', 'lifecycle hook metadata'),
    route('/admin/swarm-injection-scan', 'GET', 'global_safe', 'security scanner utility endpoint'),
    route('/admin/swarm-mcp-tools', 'GET', 'global_safe', 'mcp tool registry metadata'),
    route('/admin/swarm-a2a-agents', 'GET', 'global_safe', 'a2a agent registry metadata'),
    route('/admin/swarm-cost-baselines', 'GET', 'global_safe', 'cost baseline metadata'),
    route('/admin/swarm-model-tiers', 'GET', 'global_safe', 'model tier metadata'),
    route('/admin/swarm-event-types', 'GET', 'global_safe', 'event type metadata'),
    route('/admin/swarm-schema-versions', 'GET', 'global_safe', 'schema version metadata'),
    route('/admin/swarm-compliance-frameworks', 'GET', 'global_safe', 'compliance metadata'),
    route('/admin/swarm-canaries', 'GET', 'global_safe', 'canary metadata'),
    route('/admin/swarm-webhooks', 'GET', 'global_safe', 'webhook reliability metadata'),
    route('/admin/swarm-skill-gateway', 'GET', 'global_safe', 'skill gateway metadata'),
    route('/admin/swarm-healing-log', 'GET', 'global_safe', 'healing log metadata'),
    route('/admin/swarm-chaos-config', 'GET', 'global_safe', 'chaos config metadata'),
    route('/admin/swarm-api-contracts', 'GET', 'global_safe', 'api contract metadata'),
  ];

  const adminWriteOnly = [
    route('/admin/training/run', 'POST', 'admin_write_only', 'mutates training runtime state'),
    route('/admin/training/control', 'POST', 'admin_write_only', 'mutates training control state'),
    route('/admin/training/profile', 'POST', 'admin_write_only', 'mutates training profile'),
    route('/admin/training/review', 'POST', 'admin_write_only', 'mutates review queue decisions'),
  ];

  const runScoped = [
    route('/admin/swarm-runs/:id', 'GET', 'tenant_guarded', 'run detail requires tenant-scoped visibility'),
    route('/admin/swarm-runs/:id/stream', 'GET', 'tenant_guarded', 'run visibility checked before opening SSE'),
    route('/admin/swarm-runs/:id/snapshots', 'GET', 'tenant_guarded', 'uses Admin.getSwarmSnapshotsV1(runId, tenantId)'),
    route('/admin/swarm-runs/:id/metrics', 'GET', 'tenant_guarded', 'uses Admin.getSwarmRunMetricsV1(runId, tenantId)'),
    route('/admin/swarm-runs/:id/cost-breakdown', 'GET', 'tenant_guarded', 'uses Admin.getSwarmRunCostBreakdownV1(runId, tenantId)'),
    route('/admin/swarm-runs/:id/resume', 'POST', 'tenant_guarded_admin_write', 'requires tenant scope + admin_write'),
    route('/admin/swarm-runs/:id/rewind', 'POST', 'tenant_guarded_admin_write', 'requires tenant scope + admin_write'),
  ];

  const reviewScoped = [
    route('/admin/swarm-reviews', 'GET', 'tenant_guarded', 'tenant filter applied'),
    route('/admin/swarm-reviews/:id', 'GET', 'tenant_guarded', 'returns 404 for out-of-scope'),
    route('/admin/swarm-reviews/:id/approve', 'POST', 'tenant_guarded_admin_write', 'requires tenant scope + admin_write'),
    route('/admin/swarm-reviews/:id/reject', 'POST', 'tenant_guarded_admin_write', 'requires tenant scope + admin_write'),
  ];

  const aggregateRunDerived = [
    route('/admin/swarm-runs', 'GET', 'tenant_guarded', 'list is tenant filtered and tenant scope required'),
    route('/admin/swarm-graph-summary', 'GET', 'tenant_guarded', 'summary computed from tenant-filtered runs'),
    route('/admin/swarm-checkpoints', 'GET', 'tenant_guarded', 'checkpoint list filtered by tenant'),
    route('/admin/swarm-trace-summary', 'GET', 'tenant_guarded', 'trace summary filtered by tenant'),
  ];

  return {
    schema_version: 'freeaiAdminTenantCoverage.v1',
    generated_at: new Date().toISOString(),
    source_of_truth: 'src/server.js + src/server/admin.js',
    summary: {
      run_scoped_routes: runScoped.length,
      review_routes: reviewScoped.length,
      aggregate_run_derived_routes: aggregateRunDerived.length,
      global_safe_routes: globalSafe.length,
      admin_write_only_routes: adminWriteOnly.length,
      tenant_guarded_total: [...runScoped, ...reviewScoped, ...aggregateRunDerived].filter((r) => r.tenant_scope.startsWith('tenant_guarded')).length,
    },
    run_scoped_routes: runScoped,
    review_routes: reviewScoped,
    aggregate_run_derived_routes: aggregateRunDerived,
    global_safe_routes: globalSafe,
    admin_write_only_routes: adminWriteOnly,
  };
}

function main() {
  const report = buildCoverageReport();
  const reportsDir = path.join(process.cwd(), 'evidence', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const outPath = path.join(reportsDir, `admin-tenant-coverage-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ out_path: outPath, ...report.summary }, null, 2));
}

main();

