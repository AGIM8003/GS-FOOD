/**
 * FREE AI — Typed TypeScript SDK Client
 *
 * Usage:
 *   import { FreeAIClient } from './freeai-client';
 *   const client = new FreeAIClient({ baseUrl: 'http://localhost:3000' });
 *   const result = await client.infer({ prompt: 'Hello' });
 */

// ─── Types ──────────────────────────────────────────────────

export interface FreeAIClientOptions {
  baseUrl: string;
  adminKey?: string;
  inferKey?: string;
  tenantId?: string;
  timeout?: number;
}

export interface InferRequest {
  prompt: string;
  persona?: string;
  streaming?: boolean;
  output_contract?: string;
  prompt_variant?: string;
  intent_family?: string;
  timeout?: number;
  swarm?: { task_id: string; role: string; agent_id: string };
}

export interface InferResponse {
  status: number;
  body: unknown;
  receipt?: Receipt;
  error?: string;
}

export interface Receipt {
  receipt_id: string;
  trace_id?: string;
  provider_id?: string;
  model_id?: string;
  fallback_used?: boolean;
}

// ─── Swarm Types ────────────────────────────────────────────

export type NodeType =
  | 'prompt_node'
  | 'merge_node'
  | 'finalization_node'
  | 'human_review_node'
  | 'tool_node'
  | 'subgraph_node'
  | 'router_node';

export type EdgeType = 'default' | 'conditional';

export type RunState =
  | 'created' | 'validating' | 'admitted' | 'running'
  | 'completed' | 'failed' | 'paused_for_review'
  | 'resumable' | 'resumed' | 'rejected' | 'quarantined';

export type NodeState =
  | 'pending' | 'admitted' | 'running' | 'completed'
  | 'failed' | 'skipped' | 'waiting_human_review'
  | 'resumed' | 'quarantined';

export type ReceiptType =
  | 'graph_receipt' | 'node_receipt' | 'merge_receipt'
  | 'final_receipt' | 'policy_receipt' | 'review_receipt'
  | 'resume_receipt' | 'tool_receipt';

export type MergeStrategy = 'deterministic_priority' | 'first_valid';
export type ReceiptMode = 'full' | 'summary' | 'none';
export type SchemaVersion = 'v1' | 'v3' | 'v4';

export interface SwarmEdge {
  from_node_id: string;
  to_node_id: string;
  edge_type?: EdgeType;
  condition?: string;
}

export interface SwarmNodeConfig {
  prompt?: string;
  merge_strategy?: MergeStrategy;
  priority?: string[];
  is_final?: boolean;
  final_handler?: boolean;
  requested_action?: string;
  tool_id?: string;
  tool_input?: Record<string, unknown>;
  timeout_ms?: number;
  allow_network?: boolean;
  allow_filesystem?: boolean;
  expected_output_contract?: { required_fields: string[] };
  subgraph?: SwarmGraphBody;
  routes?: Array<{ target_node_id: string; condition?: string; label?: string }>;
}

export interface SwarmNode {
  node_id: string;
  node_type: NodeType;
  role_id?: string;
  task_lane?: string;
  config: SwarmNodeConfig;
}

export interface SwarmGraphBody {
  graph_id: string;
  graph_name: string;
  nodes: SwarmNode[];
  edges: SwarmEdge[];
  entry_node_id: string;
  receipt_mode: ReceiptMode;
  input_payload: Record<string, unknown>;
  graph_schema_version?: SchemaVersion;
  max_fan_out?: number;
  allow_cycles?: boolean;
  max_iterations?: number;
}

export interface SwarmRunResult {
  ok: boolean;
  run_id: string;
  run_state: RunState;
  graph_hash?: string;
  final_output?: { text: string; graph_id: string; graph_hash: string; graph_name: string };
  receipts_count?: number;
  error?: string;
  paused_at_node?: string;
  review_id?: string;
  policy_result?: { decision: string; reason_code: string; summary: string };
}

export interface SwarmRunDetail {
  schema_version: string;
  run: {
    run_id: string;
    graph_id: string;
    run_state: RunState;
    node_states: Record<string, NodeState>;
    receipts: unknown[];
    node_outputs: Record<string, string>;
    execution_checkpoint: string | null;
    failed_at_node_id: string | null;
    resume_eligible: boolean;
    tenant_id: string | null;
  };
}

export interface SwarmSnapshot {
  snapshot_id: string;
  checkpoint_node_id: string;
  timestamp: string;
  run_state: RunState;
  node_states: Record<string, NodeState>;
  node_outputs: Record<string, string>;
  receipts_count: number;
}

export interface RewindResult {
  ok: boolean;
  snapshot_id?: string;
  checkpoint_node_id?: string;
  error?: string;
}

export interface ResumeOptions {
  resumed_by?: string;
  resume_reason?: string;
}

export interface ToolRegistryEntry {
  tool_id: string;
  tool_class: string;
  description: string;
}

export interface HealthReport {
  status: string;
  started_at: string;
  uptime_s: number;
  version: string;
  probes: { live: boolean; ready: boolean; startup: boolean };
  runtime: { provider_count: number };
}

// ─── Client ─────────────────────────────────────────────────

export class FreeAIClient {
  private baseUrl: string;
  private adminKey?: string;
  private inferKey?: string;
  private tenantId?: string;
  private timeout: number;

  constructor(opts: FreeAIClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.adminKey = opts.adminKey;
    this.inferKey = opts.inferKey;
    this.tenantId = opts.tenantId;
    this.timeout = opts.timeout ?? 30000;
  }

  private headers(admin = false): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (admin && this.adminKey) h['X-Admin-Key'] = this.adminKey;
    if (!admin && this.inferKey) h['Authorization'] = `Bearer ${this.inferKey}`;
    if (this.tenantId) h['X-Tenant-Id'] = this.tenantId;
    return h;
  }

  private async request<T>(method: string, path: string, body?: unknown, admin = false): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.headers(admin),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const json = await res.json() as T;
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  // ─── Inference ──────────────────────────────────────────

  async infer(req: InferRequest): Promise<InferResponse> {
    return this.request<InferResponse>('POST', '/v1/infer', req);
  }

  // ─── Swarm ──────────────────────────────────────────────

  async swarmRun(graph: SwarmGraphBody): Promise<SwarmRunResult> {
    return this.request<SwarmRunResult>('POST', '/v1/swarm/run', graph);
  }

  // ─── Admin: Swarm Runs ─────────────────────────────────

  async listSwarmRuns(): Promise<{ runs: unknown[] }> {
    return this.request('GET', '/admin/swarm-runs', undefined, true);
  }

  async getSwarmRun(runId: string): Promise<SwarmRunDetail> {
    return this.request('GET', `/admin/swarm-runs/${runId}`, undefined, true);
  }

  async resumeSwarmRun(runId: string, opts?: ResumeOptions): Promise<SwarmRunResult> {
    return this.request('POST', `/admin/swarm-runs/${runId}/resume`, opts || {}, true);
  }

  // ─── Admin: Time-Travel ────────────────────────────────

  async getSwarmSnapshots(runId: string): Promise<{ snapshots: SwarmSnapshot[] }> {
    return this.request('GET', `/admin/swarm-runs/${runId}/snapshots`, undefined, true);
  }

  async rewindSwarmRun(runId: string, snapshotIndex: number): Promise<RewindResult> {
    return this.request('POST', `/admin/swarm-runs/${runId}/rewind`, { snapshot_index: snapshotIndex }, true);
  }

  // ─── Admin: Reviews ────────────────────────────────────

  async listSwarmReviews(): Promise<{ reviews: unknown[] }> {
    return this.request('GET', '/admin/swarm-reviews', undefined, true);
  }

  async getSwarmReview(reviewId: string): Promise<unknown> {
    return this.request('GET', `/admin/swarm-reviews/${reviewId}`, undefined, true);
  }

  async approveSwarmReview(reviewId: string, opts?: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', `/admin/swarm-reviews/${reviewId}/approve`, opts || {}, true);
  }

  async rejectSwarmReview(reviewId: string, opts?: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', `/admin/swarm-reviews/${reviewId}/reject`, opts || {}, true);
  }

  // ─── Admin: Policy & Tools ─────────────────────────────

  async getSwarmPolicySummary(): Promise<unknown> {
    return this.request('GET', '/admin/swarm-policy-summary', undefined, true);
  }

  async getSwarmToolRegistry(): Promise<{ tools: ToolRegistryEntry[]; count: number }> {
    return this.request('GET', '/admin/swarm-tool-registry', undefined, true);
  }

  // ─── Admin: Observability ──────────────────────────────

  async getSwarmGraphSummary(): Promise<unknown> {
    return this.request('GET', '/admin/swarm-graph-summary', undefined, true);
  }

  async getSwarmCheckpoints(): Promise<unknown> {
    return this.request('GET', '/admin/swarm-checkpoints', undefined, true);
  }

  async getSwarmTraceSummary(): Promise<unknown> {
    return this.request('GET', '/admin/swarm-trace-summary', undefined, true);
  }

  // ─── Health ────────────────────────────────────────────

  async health(): Promise<HealthReport> {
    return this.request('GET', '/health');
  }

  async healthLive(): Promise<{ status: string }> {
    return this.request('GET', '/health/live');
  }

  async healthReady(): Promise<{ status: string }> {
    return this.request('GET', '/health/ready');
  }
}

export default FreeAIClient;
