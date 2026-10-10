const API_BASE = ((import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL.replace(/\/$/, '')}/api` : '/api');

export interface RepositoryItem {
  id: string;
  name: string;
  path: string;
  url: string;
  default_branch: string;
  cloned_at: string;
  stats?: {
    total_files?: number;
    total_loc?: number;
    total_commits?: number;
    arch_f1?: number;
    blast_f1?: number;
  };
}

export interface FileItem {
  path: string;
  name: string;
  extension: string;
  size_bytes: number;
  loc: number;
  component_type: string;
  component_confidence: number;
  dependencies?: any[];
  functions?: Array<{
    name: string;
    kind: string;
    start_line: number;
    end_line: number;
    params: string[];
    calls: string[];
  }>;
  classes?: Array<{
    name: string;
    super_class?: string;
    methods: string[];
  }>;
  imports?: Array<{
    source: string;
    imported_names: string[];
  }>;
  exports?: Array<{
    name: string;
    kind: string;
  }>;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  component_type?: string;
  path?: string;
  loc?: number;
  degree: number;
  in_degree: number;
  out_degree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  details?: any;
}

export interface SoftwareGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: Record<string, any>;
}

export interface CommitRecord {
  commit_id: string;
  short_hash: string;
  author: string;
  date: string;
  timestamp: number;
  message: string;
  category: string;
  changed_files: string[];
  added_lines: number;
  deleted_lines: number;
}

export interface TimelineMilestone {
  year: number;
  month: number;
  period: string;
  commit_count: number;
  top_categories: Record<string, number>;
  key_commits: CommitRecord[];
  headline: string;
}

export interface SoftwareTimeline {
  total_commits: number;
  time_span: string;
  milestones: TimelineMilestone[];
  category_distribution: Record<string, number>;
}

export interface FileEvolution {
  file_path: string;
  created_date: string;
  created_commit?: string;
  created_by?: string;
  total_revisions: number;
  total_authors: number;
  authors: string[];
  major_milestones: Array<{
    date: string;
    hash: string;
    type: string;
    description: string;
    author: string;
  }>;
  bug_fixes: CommitRecord[];
  refactors: CommitRecord[];
  recent_changes: CommitRecord[];
  total_churn?: number;
  churn_per_revision?: number;
  hotspot_score?: number;
}

export interface BlastRadiusResult {
  target_file: string;
  direct_affected_files: string[];
  indirect_affected_files: string[];
  affected_apis: string[];
  affected_tests: string[];
  total_impact_count: number;
  risk_level: string;
  risk_score: number;
  impact_graph?: SoftwareGraph;
  explanation: string;
}

export interface ChangePredictionItem {
  file_path: string;
  probability: number;
  co_change_count: number;
  graph_distance: number;
  component_type: string;
  reason: string;
}

export interface ChangeImpactPrediction {
  target_file: string;
  predicted_files: ChangePredictionItem[];
  model_name: string;
  feature_importance: Record<string, number>;
}

export interface EvidenceItem {
  file_path: string;
  line_start?: number;
  line_end?: number;
  commit_hash?: string;
  commit_message?: string;
  commit_date?: string;
  snippet: string;
  relevance_reason: string;
}

export interface RAGAnswerResponse {
  question: string;
  answer: string;
  evidence: EvidenceItem[];
  evidence_used?: EvidenceItem[];
  confidence_score: number;
  retrieval_sources: Record<string, number>;
}

export interface EvaluationMetrics {
  precision: number;
  recall: number;
  f1_score: number;
  tested_samples: number;
  details?: any;
}

export interface OverallEvaluation {
  architecture_eval: EvaluationMetrics;
  blast_radius_eval: EvaluationMetrics;
  commit_count_evaluated: number;
  summary: string;
}

async function safeJson<T = any>(res: Response): Promise<T> {
  if (!res.ok) {
    let errDetail = '';
    try {
      const errJson = await res.json();
      errDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errDetail = await res.text().catch(() => res.statusText);
    }
    throw new Error(errDetail || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  async getRepositories(): Promise<RepositoryItem[]> {
    const res = await fetch(`${API_BASE}/repositories`);
    return safeJson(res);
  },

  async ingest(repo_url_or_path: string, force_reclone: boolean = false): Promise<any> {
    const res = await fetch(`${API_BASE}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url_or_path, force_reclone })
    });
    return safeJson(res);
  },

  async ingestAsync(repo_url_or_path: string, force_reclone: boolean = false): Promise<{ task_id: string; status: string }> {
    const res = await fetch(`${API_BASE}/ingest/async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url_or_path, force_reclone })
    });
    return safeJson(res);
  },

  async uploadRepoZip(file: File): Promise<{ task_id: string; status: string; repo_id?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/ingest/upload`, {
      method: 'POST',
      body: formData
    });
    return safeJson(res);
  },

  async getTaskStatus(taskId: string): Promise<{ task_id: string; status: string; progress?: string; repo_id?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`);
    return safeJson(res);
  },

  async loadSample(): Promise<any> {
    const res = await fetch(`${API_BASE}/load-sample`, { method: 'POST' });
    return safeJson(res);
  },

  async getFiles(repoId: string): Promise<FileItem[]> {
    const res = await fetch(`${API_BASE}/repo/${repoId}/files`);
    const data = await safeJson(res);
    return data.files || [];
  },

  async getFileContent(repoId: string, path: string): Promise<any> {
    const res = await fetch(`${API_BASE}/repo/${repoId}/file-content?path=${encodeURIComponent(path)}`);
    return safeJson(res);
  },

  async getGraph(repoId: string): Promise<SoftwareGraph> {
    const res = await fetch(`${API_BASE}/repo/${repoId}/graph`);
    return safeJson(res);
  },

  async getTimeline(repoId: string): Promise<SoftwareTimeline> {
    const res = await fetch(`${API_BASE}/repo/${repoId}/timeline`);
    return safeJson(res);
  },

  async getFileIntelligence(repoId: string, filePath: string): Promise<FileEvolution> {
    const res = await fetch(`${API_BASE}/repo/${repoId}/file-intelligence?file_path=${encodeURIComponent(filePath)}`);
    return safeJson(res);
  },

  async calculateBlastRadius(repoId: string, targetFile: string): Promise<BlastRadiusResult> {
    const res = await fetch(`${API_BASE}/repo/${repoId}/blast-radius?target_file=${encodeURIComponent(targetFile)}`);
    return safeJson(res);
  },

  async predictImpact(repoId: string, targetFile: string): Promise<ChangeImpactPrediction> {
    const res = await fetch(`${API_BASE}/repo/${repoId}/predict-impact?target_file=${encodeURIComponent(targetFile)}`);
    return safeJson(res);
  },

  async askAI(repoId: string, question: string): Promise<RAGAnswerResponse> {
    const res = await fetch(`${API_BASE}/repo/${repoId}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    return safeJson(res);
  },

  async getEvaluation(repoId: string): Promise<OverallEvaluation> {
    const res = await fetch(`${API_BASE}/repo/${repoId}/evaluation`);
    return safeJson(res);
  },

  async getRefactorScenarios(repoId: string): Promise<RefactorScenarioItem[]> {
    const res = await fetch(`${API_BASE}/repo/${repoId}/refactor-scenarios`);
    return safeJson(res);
  },

  async simulateRefactor(repoId: string, scenarioId?: string, customChange?: string): Promise<RefactorSimulationResult> {
    const res = await fetch(`${API_BASE}/repo/${repoId}/simulate-refactor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, custom_change: customChange })
    });
    return safeJson(res);
  },

  async getFleetScale(repoId: string): Promise<FleetScaleData> {
    const res = await fetch(`${API_BASE}/repo/${repoId}/fleet-scale`);
    return safeJson(res);
  },

  async trackEvent(eventType: string, repoId?: string, details?: any): Promise<void> {
    try {
      await fetch(`${API_BASE}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          visitor_id: getOrCreateVisitorId(),
          session_id: getSessionId(),
          repo_id: repoId,
          details
        })
      });
    } catch {
      // Non-blocking telemetry
    }
  },

  async getAnalyticsStats(): Promise<AnalyticsStats> {
    const res = await fetch(`${API_BASE}/analytics/stats`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

export interface RefactorScenarioItem {
  id: string;
  title: string;
  category: string;
  description: string;
  target_symbol: string;
  risk_level: string;
  estimated_waves: number;
}

export interface GrepComparison {
  symbol: string;
  grep_raw_matches_count: number;
  ast_compiler_references_count: number;
  precision_rate_pct: number;
  grep_signal_to_noise_ratio: string;
  false_positives_avoided: Array<{
    file: string;
    line: number;
    code_snippet: string;
    reason: string;
  }>;
  false_negatives_rescued: Array<{
    file: string;
    line: number;
    code_snippet: string;
    reason: string;
  }>;
}

export interface ExecutionWave {
  wave_number: number;
  wave_title: string;
  tier: 'GOLDEN' | 'GRAY' | 'RED';
  risk_profile: string;
  files_count: number;
  files: string[];
  permits: Record<string, string>;
  status: string;
  verification: string;
  rollback_guarantee: string;
}

export interface AgentActivity {
  agent_id: string;
  name: string;
  role: string;
  target_scope: string;
  permit_type: string;
  status: string;
  execution_time_ms: number;
  log: string;
}

export interface RefactorSimulationResult {
  scenario_id: string;
  title: string;
  category: string;
  description: string;
  target_symbol: string;
  risk_score: number;
  risk_level: string;
  impacted_business_processes: string[];
  grep_comparison: GrepComparison;
  waves: ExecutionWave[];
  agents: AgentActivity[];
  generated_migration_sql: string;
  generated_pull_request_diff: string;
  audit_trail_id: string;
  summary: string;
}

export interface FleetApplicationItem {
  id: string;
  name: string;
  tier: 'GOLDEN' | 'GRAY' | 'RED';
  security_score: number;
  critical_findings: string[];
  wave: number;
  dependencies: string[];
  recommendation: string;
}

export interface FleetScaleData {
  estate_overview: {
    total_applications: number;
    golden_tier_count: number;
    gray_tier_count: number;
    red_tier_count: number;
    total_migration_waves: number;
    estimated_migration_timeline_weeks: number;
    projected_cost_savings_pct: number;
    automated_golden_module_fit_pct: number;
  };
  security_findings_breakdown: {
    open_ssh_security_groups: number;
    unencrypted_ebs_storage: number;
    legacy_imdsv1_instances: number;
    hardcoded_private_ips: number;
    circular_service_dependencies: number;
  };
  cutover_pipeline: {
    canary_stage_1: string;
    stage_2: string;
    stage_3: string;
    auto_rollback_window_seconds: number;
    rollback_trigger_metric: string;
  };
  sample_applications: FleetApplicationItem[];
}

function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem('ca_visitor_id');
    if (!vid) {
      vid = 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('ca_visitor_id', vid);
    }
    return vid;
  } catch {
    return 'anon_guest';
  }
}

let currentSessionId = '';
function getSessionId(): string {
  if (!currentSessionId) {
    currentSessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }
  return currentSessionId;
}

export interface AnalyticsStats {
  total_visits: number;
  unique_visitors: number;
  total_ai_queries: number;
  total_blast_analyses: number;
  total_repos_ingested: number;
  total_events: number;
  event_breakdown: Record<string, number>;
  top_repos: Array<{ repo_id: string; count: number }>;
  recent_events: Array<{
    id: number;
    event_type: string;
    repo_id?: string;
    details?: any;
    created_at: string;
  }>;
  daily_stats: Array<{
    day: string;
    total_events: number;
    visits: number;
    unique_visitors: number;
  }>;
}
