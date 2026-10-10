import React, { useState } from 'react';
import { 
  FileCode, 
  History, 
  Flame, 
  GitCommit, 
  User, 
  Calendar, 
  Sparkles, 
  Code2, 
  ExternalLink,
  ChevronRight,
  Bug,
  Shield,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { FileItem, FileEvolution, BlastRadiusResult, ChangeImpactPrediction } from '../api/client';

interface FileIntelligenceProps {
  file: FileItem | null;
  evolution: FileEvolution | null;
  blastRadius: BlastRadiusResult | null;
  predictions: ChangeImpactPrediction | null;
  onAskAI: (prompt: string) => void;
  onOpenBlastModal: () => void;
}

export const FileIntelligence: React.FC<FileIntelligenceProps> = ({
  file,
  evolution,
  blastRadius,
  predictions,
  onAskAI,
  onOpenBlastModal
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'blast'>('overview');

  if (!file) {
    return (
      <div className="studio-panel p-6 flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] bg-[var(--bg-surface)]">
        <FileCode className="w-10 h-10 mb-3 text-[var(--text-muted)] stroke-[1.2]" />
        <h3 className="font-semibold text-[var(--text-secondary)] text-xs mb-1 font-mono uppercase tracking-wider">
          No Component Selected
        </h3>
        <p className="text-[11px] max-w-xs text-[var(--text-muted)] leading-relaxed">
          Select any node in the topology graph or file in the explorer to inspect AST symbols, historical Git milestones, and cascading reach.
        </p>
      </div>
    );
  }

  const getRiskPill = (level: string = 'Low', score: number = 0) => {
    const l = level.toLowerCase();
    let cls = 'risk-pill-low';
    if (l === 'critical') cls = 'risk-pill-critical';
    else if (l === 'high') cls = 'risk-pill-high';
    else if (l === 'medium') cls = 'risk-pill-medium';

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${cls}`}>
        {level.toUpperCase()} IMPACT ({score}%)
      </span>
    );
  };

  return (
    <div className="studio-panel flex flex-col h-full bg-[var(--bg-surface)]">
      {/* File Header Card */}
      <div className="p-3 border-b border-[var(--border-hairline)] bg-[var(--bg-card)]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-[var(--text-primary)] truncate font-mono">
                {file.name}
              </span>
              <span className="badge-arch badge-service text-[9px]">{file.component_type}</span>
              <span 
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-hairline)]"
                title="Probabilistic classification confidence score (classifier.py)"
              >
                {Math.round((file.component_confidence || 0.92) * 100)}% conf
              </span>
              {evolution?.hotspot_score && evolution.hotspot_score >= 4.0 ? (
                <span 
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/50 flex items-center gap-1 font-semibold"
                  title={`Regression hotspot score: ${evolution.hotspot_score}/10 based on bug fixes and churn frequency`}
                >
                  🔥 Hotspot ({evolution.hotspot_score})
                </span>
              ) : evolution?.hotspot_score && evolution.hotspot_score >= 2.0 ? (
                <span 
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50 flex items-center gap-1 font-semibold"
                  title={`Watchlist score: ${evolution.hotspot_score}/10 based on bug fixes and revisions`}
                >
                  ⚠️ Watch ({evolution.hotspot_score})
                </span>
              ) : null}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-mono truncate mt-0.5">{file.path}</p>
          </div>
          {blastRadius && getRiskPill(blastRadius.risk_level, blastRadius.risk_score)}
        </div>

        {/* Precision Segmented Control */}
        <div className="segmented-control w-full mt-2">
          <div
            onClick={() => setActiveTab('overview')}
            className={`segmented-item flex-1 text-center ${activeTab === 'overview' ? 'active' : ''}`}
          >
            Overview & AST
          </div>
          <div
            onClick={() => setActiveTab('history')}
            className={`segmented-item flex-1 text-center ${activeTab === 'history' ? 'active' : ''}`}
          >
            History ({evolution?.total_revisions ?? 0})
          </div>
          <div
            onClick={() => setActiveTab('blast')}
            className={`segmented-item flex-1 text-center ${activeTab === 'blast' ? 'active' : ''}`}
          >
            Reach ({blastRadius?.total_impact_count ?? 0})
          </div>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Metadata Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-hairline)] text-center">
                <span className="block text-[9px] font-mono text-[var(--text-muted)] uppercase">Lines</span>
                <span className="font-mono font-semibold text-xs text-[var(--text-primary)]">{file.loc}</span>
              </div>
              <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-hairline)] text-center">
                <span className="block text-[9px] font-mono text-[var(--text-muted)] uppercase">Functions</span>
                <span className="font-mono font-semibold text-xs text-indigo-600">{file.functions?.length ?? 0}</span>
              </div>
              <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-hairline)] text-center">
                <span className="block text-[9px] font-mono text-[var(--text-muted)] uppercase">Classes</span>
                <span className="font-mono font-semibold text-xs text-emerald-600">{file.classes?.length ?? 0}</span>
              </div>
              <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-hairline)] text-center">
                <span className="block text-[9px] font-mono text-[var(--text-muted)] uppercase">Churn</span>
                <span className={`font-mono font-semibold text-xs ${
                  (evolution?.total_churn || 0) > 600
                    ? 'text-rose-600'
                    : (evolution?.total_churn || 0) > 200
                    ? 'text-amber-600'
                    : 'text-[var(--text-primary)]'
                }`}>
                  {evolution?.total_churn ?? 0}
                </span>
              </div>
            </div>

            {/* Extracted AST Functions */}
            {file.functions && file.functions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Code2 className="w-3 h-3 text-indigo-600" />
                    Extracted Functions ({file.functions.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {file.functions.map((fn, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-hairline)] text-[11px]"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-semibold text-indigo-700 truncate">
                          {fn.name}<span className="text-[var(--text-muted)]">({fn.params.join(', ')})</span>
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0 pl-1">
                          L{fn.start_line}–{fn.end_line}
                        </span>
                      </div>
                      {fn.calls.length > 0 && (
                        <div className="mt-1 text-[10px] font-mono text-[var(--text-secondary)] flex items-center gap-1">
                          <span>Calls:</span>
                          <span className="text-cyan-700 font-semibold">{fn.calls.slice(0, 3).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Architectural Inquiry Menu */}
            <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Ask Archaeological Assistant
                </span>
                <span className="text-[9px] font-mono text-indigo-600 font-medium">Grounded in AST + Commits</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => onAskAI(`Explain the architecture, design choices, and purpose of ${file.path}`)}
                  className="p-1.5 rounded bg-white hover:bg-indigo-50 border border-indigo-200 text-[10px] text-slate-800 text-left transition-colors font-mono flex items-center gap-1 font-medium shadow-2xs cursor-pointer"
                  title="Explain architecture and design choices"
                >
                  🏛️ Architecture & Role
                </button>

                <button
                  onClick={() => onAskAI(`What could break across callers or APIs if I change ${file.path}?`)}
                  className="p-1.5 rounded bg-white hover:bg-indigo-50 border border-indigo-200 text-[10px] text-slate-800 text-left transition-colors font-mono flex items-center gap-1 font-medium shadow-2xs cursor-pointer"
                  title="Simulate breaking changes and blast reach"
                >
                  💥 What Breaks if Changed?
                </button>

                <button
                  onClick={() => onAskAI(`Why was ${file.path} modified in past commits and what bug fixes touched it?`)}
                  className="p-1.5 rounded bg-white hover:bg-indigo-50 border border-indigo-200 text-[10px] text-slate-800 text-left transition-colors font-mono flex items-center gap-1 font-medium shadow-2xs cursor-pointer"
                  title="Historical commit rationale and bug fix traces"
                >
                  📜 Bug Fix History
                </button>

                <button
                  onClick={() => onAskAI(`Which test suites and callers depend on ${file.name}?`)}
                  className="p-1.5 rounded bg-white hover:bg-indigo-50 border border-indigo-200 text-[10px] text-slate-800 text-left transition-colors font-mono flex items-center gap-1 font-medium shadow-2xs cursor-pointer"
                  title="Identify downstream callers and required tests"
                >
                  🧪 Dependent Tests & Callers
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {evolution ? (
              <>
                {/* Creation Lifecycle Card */}
                <div className="p-2.5 rounded bg-[var(--bg-card)] border border-[var(--border-hairline)] text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Origin Date:</span>
                    <span className="text-[var(--text-primary)] font-medium">{evolution.created_date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Original Author:</span>
                    <span className="text-indigo-600 font-semibold">{evolution.created_by || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Total Contributors:</span>
                    <span className="text-[var(--text-primary)]">{evolution.total_authors} developers</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Historical Churn:</span>
                    <span className="text-[var(--text-primary)]">
                      {evolution.total_churn ?? 0} lines ({evolution.churn_per_revision ?? 0}/rev)
                    </span>
                  </div>
                  {evolution.hotspot_score !== undefined && evolution.hotspot_score > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Hotspot Risk:</span>
                      <span className={evolution.hotspot_score >= 4 ? 'text-rose-600 font-bold' : 'text-amber-600 font-semibold'}>
                        {evolution.hotspot_score} / 10
                      </span>
                    </div>
                  )}
                </div>

                {/* Major Milestones */}
                <div>
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1.5">
                    Evolutionary Milestones
                  </span>
                  <div className="space-y-1.5">
                    {evolution.major_milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-hairline)] flex items-start gap-2 text-xs"
                      >
                        <span className="font-mono font-semibold text-indigo-600 shrink-0 text-[10px] pt-0.5">
                          {m.date}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--text-primary)] text-[11px] leading-tight font-medium">{m.description}</p>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {m.hash} • {m.author}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bug Fixes & Refactors */}
                {evolution.bug_fixes.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-rose-600 block mb-1.5">
                      Historical Bug Fixes ({evolution.bug_fixes.length})
                    </span>
                    <div className="space-y-1">
                      {evolution.bug_fixes.map((bf, idx) => (
                        <div key={idx} className="p-1.5 rounded bg-rose-50 border border-rose-200 text-[11px] font-mono flex items-center gap-2">
                          <span className="text-rose-700 font-bold">{bf.short_hash}</span>
                          <span className="text-[var(--text-primary)] truncate font-sans font-medium">{bf.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-[var(--text-muted)] font-mono">Mining file evolution records...</p>
            )}
          </div>
        )}

        {/* BLAST REACH TAB */}
        {activeTab === 'blast' && (
          <div className="space-y-3">
            {blastRadius ? (
              <>
                <div className="p-2.5 rounded bg-[var(--bg-card)] border border-[var(--border-hairline)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase font-semibold">Impact Assessment</span>
                    {getRiskPill(blastRadius.risk_level, blastRadius.risk_score)}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {blastRadius.explanation}
                  </p>
                </div>

                {/* Direct Dependents */}
                <div>
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-rose-600 flex items-center justify-between mb-1">
                    <span>Direct Dependents (1-Hop):</span>
                    <span>{blastRadius.direct_affected_files.length}</span>
                  </span>
                  <div className="space-y-1">
                    {blastRadius.direct_affected_files.length === 0 ? (
                      <div className="p-1.5 rounded bg-[var(--bg-card)] border border-[var(--border-hairline)] text-[10px] font-mono text-[var(--text-muted)] italic">None</div>
                    ) : blastRadius.direct_affected_files.map((df, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-rose-50 border border-rose-200 text-[10px] font-mono text-rose-900 truncate font-medium" title={df}>
                        {df}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indirect Dependents */}
                <div>
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-600 flex items-center justify-between mb-1">
                    <span>Indirect Dependents (2+ Hop):</span>
                    <span>{blastRadius.indirect_affected_files.length}</span>
                  </span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {blastRadius.indirect_affected_files.length === 0 ? (
                      <div className="p-1.5 rounded bg-[var(--bg-card)] border border-[var(--border-hairline)] text-[10px] font-mono text-[var(--text-muted)] italic">None</div>
                    ) : blastRadius.indirect_affected_files.map((df, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-mono text-amber-900 truncate font-medium" title={df}>
                        {df}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Downstream APIs */}
                {blastRadius.affected_apis.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-600 block mb-1">
                      Downstream API Endpoints ({blastRadius.affected_apis.length})
                    </span>
                    <div className="space-y-1">
                      {blastRadius.affected_apis.map((api, idx) => (
                        <div key={idx} className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-800 truncate font-semibold">
                          {api}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Test Runs */}
                {blastRadius.affected_tests.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-pink-600 block mb-1">
                      Candidate Regression Tests ({blastRadius.affected_tests.length})
                    </span>
                    <div className="space-y-1">
                      {blastRadius.affected_tests.map((test, idx) => (
                        <div key={idx} className="p-1.5 rounded bg-pink-50 border border-pink-200 text-[10px] font-mono text-pink-800 truncate font-semibold">
                          {test}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={onOpenBlastModal}
                  className="w-full btn-studio btn-studio-primary text-xs py-2 shadow-sm font-semibold cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-200" />
                  View Predictive Impact & Co-Changes
                </button>
              </>
            ) : (
              <p className="text-xs text-[var(--text-muted)] font-mono">Calculating cascading reach...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
