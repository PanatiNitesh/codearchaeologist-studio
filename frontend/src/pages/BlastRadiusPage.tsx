import React, { useState } from 'react';
import { 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Activity, 
  ShieldAlert, 
  FileCode2, 
  Cpu, 
  TrendingUp, 
  ExternalLink 
} from 'lucide-react';
import { 
  FileItem, 
  BlastRadiusResult, 
  ChangeImpactPrediction 
} from '../api/client';

interface BlastRadiusPageProps {
  repoId?: string;
  files: FileItem[];
  selectedFilePath: string | null;
  blastRadius: BlastRadiusResult | null;
  predictions: ChangeImpactPrediction | null;
  onSelectFile: (path: string) => void;
  onAskAI: (prompt: string) => void;
}

export const BlastRadiusPage: React.FC<BlastRadiusPageProps> = ({
  files,
  selectedFilePath,
  blastRadius,
  predictions,
  onSelectFile,
  onAskAI
}) => {
  return (
    <div className="flex-1 h-full min-h-0 overflow-y-auto w-full">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fade-in text-[var(--text-primary)]">
      
      {/* Page Title & Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-50/90 via-indigo-50/40 to-slate-50/80 dark:from-slate-900/90 dark:to-slate-900 border border-rose-100 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Blast Radius & Cascading Impact Engine
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Deterministic AST transitive reachability & ML co-change change likelihood analysis.
          </p>
        </div>

        {/* File Target Picker */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <select
              value={selectedFilePath || ''}
              onChange={(e) => onSelectFile(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-xs font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:border-rose-500 shadow-sm"
            >
              <option value="" disabled>Select target module to simulate...</option>
              {files.map(f => (
                <option key={f.path} value={f.path}>
                  {f.path} ({f.component_type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {blastRadius ? (
        <div className="space-y-6">
          {/* Risk Metrics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-1 shadow-sm">
              <div className="text-xs text-[var(--text-tertiary)]">Target Module</div>
              <div className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 truncate">
                {blastRadius.target_file}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-1 shadow-sm">
              <div className="text-xs text-[var(--text-tertiary)]">Risk Level Assessment</div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono uppercase ${
                  blastRadius.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300' :
                  blastRadius.risk_level === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' :
                  'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300'
                }`}>
                  {blastRadius.risk_level}
                </span>
                <span className="text-xs font-mono text-[var(--text-tertiary)]">
                  Score: {blastRadius.risk_score.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-1 shadow-sm">
              <div className="text-xs text-[var(--text-tertiary)]">Total Affected Components</div>
              <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
                {blastRadius.total_impact_count} <span className="text-xs font-normal text-[var(--text-tertiary)]">modules</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-1 shadow-sm">
              <div className="text-xs text-[var(--text-tertiary)]">Downstream Impact APIs</div>
              <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
                {blastRadius.affected_apis?.length || 0} <span className="text-xs font-normal text-[var(--text-tertiary)]">endpoints</span>
              </div>
            </div>
          </div>

          {/* Explanation Banner */}
          {blastRadius.explanation && (
            <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-[var(--text-secondary)] leading-relaxed shadow-sm">
              <strong className="text-indigo-900 dark:text-indigo-200 font-mono">AST Reachability Summary:</strong> {blastRadius.explanation}
            </div>
          )}

          {/* 4-Tier Impact Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tier 1: Direct Callers */}
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)]">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-rose-500" />
                  1. Direct Callers
                </span>
                <span className="text-xs font-mono font-bold text-rose-600">
                  {blastRadius.direct_affected_files.length}
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {blastRadius.direct_affected_files.length === 0 ? (
                  <span className="text-xs text-[var(--text-tertiary)] italic">No direct consumers found</span>
                ) : (
                  blastRadius.direct_affected_files.map((file, i) => (
                    <div 
                      key={i} 
                      onClick={() => onSelectFile(file)}
                      className="p-1.5 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-hairline)] text-[11px] font-mono text-[var(--text-secondary)] truncate cursor-pointer transition-colors"
                    >
                      {file}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tier 2: Transitive Callers */}
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)]">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  2. Transitive (N-Hop)
                </span>
                <span className="text-xs font-mono font-bold text-amber-600">
                  {blastRadius.indirect_affected_files.length}
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {blastRadius.indirect_affected_files.length === 0 ? (
                  <span className="text-xs text-[var(--text-tertiary)] italic">No indirect callers</span>
                ) : (
                  blastRadius.indirect_affected_files.map((file, i) => (
                    <div 
                      key={i} 
                      onClick={() => onSelectFile(file)}
                      className="p-1.5 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-hairline)] text-[11px] font-mono text-[var(--text-secondary)] truncate cursor-pointer transition-colors"
                    >
                      {file}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tier 3: Affected APIs */}
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)]">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-500" />
                  3. Ingress Endpoints
                </span>
                <span className="text-xs font-mono font-bold text-purple-600">
                  {blastRadius.affected_apis?.length || 0}
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(!blastRadius.affected_apis || blastRadius.affected_apis.length === 0) ? (
                  <span className="text-xs text-[var(--text-tertiary)] italic">No API entrypoints affected</span>
                ) : (
                  blastRadius.affected_apis.map((apiItem, i) => (
                    <div key={i} className="p-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[11px] font-mono text-[var(--text-secondary)] truncate">
                      {apiItem}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tier 4: Affected Tests */}
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)]">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  4. Test Suites
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  {blastRadius.affected_tests?.length || 0}
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(!blastRadius.affected_tests || blastRadius.affected_tests.length === 0) ? (
                  <span className="text-xs text-[var(--text-tertiary)] italic">No test suites impacted</span>
                ) : (
                  blastRadius.affected_tests.map((test, i) => (
                    <div key={i} className="p-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[11px] font-mono text-[var(--text-secondary)] truncate">
                      {test}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Machine Learning Co-Change Predictions Table */}
          {predictions && predictions.predicted_files && predictions.predicted_files.length > 0 && (
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Machine Learning Change-Impact Predictions (Historical Co-Change Matrix)
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Calibrated likelihood estimates P(Co-Change(B | A)) derived from 2022–2026 Git commit transactions.
                  </p>
                </div>
                <div className="text-xs font-mono text-[var(--text-tertiary)]">
                  Model: {predictions.model_name}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[var(--border-hairline)]">
                <table className="w-full text-xs text-left text-[var(--text-secondary)]">
                  <thead className="bg-[var(--bg-surface)] text-[var(--text-tertiary)] uppercase text-[10px] tracking-wider border-b border-[var(--border-hairline)]">
                    <tr>
                      <th className="px-4 py-3">Predicted File</th>
                      <th className="px-4 py-3">Empirical Probability</th>
                      <th className="px-4 py-3">Graph Distance</th>
                      <th className="px-4 py-3">Historical Co-Changes</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)] font-mono">
                    {predictions.predicted_files.map((pred, i) => (
                      <tr 
                        key={i}
                        onClick={() => onSelectFile(pred.file_path)}
                        className="hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-[var(--text-primary)] flex items-center gap-2">
                          <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
                          {pred.file_path}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 rounded-full" 
                                style={{ width: `${Math.min(100, pred.probability * 100)}%` }} 
                              />
                            </div>
                            <span className="font-bold text-[var(--text-primary)]">
                              {(pred.probability * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{pred.graph_distance} hop(s)</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{pred.co_change_count} commits</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAskAI(`Explain why ${pred.file_path} co-changes with ${blastRadius.target_file}`);
                            }}
                            className="text-[11px] font-sans font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                          >
                            Explain AI →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-3 shadow-sm">
          <ShieldAlert className="w-10 h-10 mx-auto text-[var(--text-tertiary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">No Module Selected</h3>
          <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto">
            Choose a source file from the dropdown above to simulate its ripple effects across the entire codebase.
          </p>
        </div>
      )}
      </div>
    </div>
  );
};
