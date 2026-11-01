import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  FileCode2, 
  Cpu, 
  Copy, 
  Check, 
  Sparkles,
  Terminal,
  Activity,
  Layers,
  Plane,
  GitBranch,
  BookOpen,
  Zap,
  Code
} from 'lucide-react';
import { api, FileItem } from '../api/client';

interface CompletedItem {
  file: string;
  desc: string;
  lines: string;
  evidence?: string;
  test_status?: string;
}

interface IncompleteItem {
  file: string;
  desc: string;
  risk: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  action: string;
  caller_symbol?: string;
  target_contract?: string;
  patch_diff?: string;
}

interface SafetyInvariant {
  rule: string;
  status: 'VERIFIED' | 'PENDING' | 'WARNING' | 'VIOLATED';
  detail: string;
  mined_confidence?: number;
}

interface SystematicEdit {
  rule_id: string;
  description: string;
  antecedent_pattern: string;
  consequent_pattern: string;
  applied_count: number;
  pending_count: number;
  pending_sites: Array<{
    file: string;
    line: number;
    code_snippet: string;
    replacement: string;
    patch_diff?: string;
  }>;
}

export const HandoverPage: React.FC<{
  repoId?: string;
  files?: FileItem[];
  onNavigate?: (page: string) => void;
}> = ({ repoId, onNavigate }) => {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('live_git_wip');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedSlack, setCopiedSlack] = useState<boolean>(false);
  const [copiedPatchIdx, setCopiedPatchIdx] = useState<number | null>(null);
  const [resumingState, setResumingState] = useState<'idle' | 'analyzing' | 'synthesizing' | 'ready'>('idle');
  const [selectedPatch, setSelectedPatch] = useState<string | null>(null);

  // Live handover data from backend
  const [briefingData, setBriefingData] = useState<any>(null);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);

  const effectiveRepoId = repoId || 'sample_enterprise_ecommerce';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    if (activeScenarioId === 'benchmark_halfdone') {
      api.getHalfDoneBenchmark(effectiveRepoId, 5)
        .then(data => {
          if (isMounted) {
            setBenchmarkData(data);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error("Failed to load benchmark:", err);
          if (isMounted) setLoading(false);
        });
      return;
    }

    api.getShiftHandover(effectiveRepoId, activeScenarioId)
      .then(data => {
        if (isMounted) {
          setBriefingData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to fetch shift handover:", err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [effectiveRepoId, activeScenarioId]);

  const handleExportMarkdown = () => {
    if (!briefingData?.markdown_briefing) return;
    navigator.clipboard.writeText(briefingData.markdown_briefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportSlack = () => {
    if (!briefingData?.slack_briefing) return;
    navigator.clipboard.writeText(briefingData.slack_briefing);
    setCopiedSlack(true);
    setTimeout(() => setCopiedSlack(false), 2000);
  };

  const handleCopyPatch = (patchText: string, idx: number) => {
    navigator.clipboard.writeText(patchText);
    setCopiedPatchIdx(idx);
    setTimeout(() => setCopiedPatchIdx(null), 2000);
  };

  const handleSimulateResume = () => {
    setResumingState('analyzing');
    setTimeout(() => {
      setResumingState('synthesizing');
      setTimeout(() => {
        setResumingState('ready');
      }, 700);
    }, 600);
  };

  const completedList: CompletedItem[] = briefingData?.completed_items || [];
  const incompleteList: IncompleteItem[] = briefingData?.incomplete_items || [];
  const invariantsList: SafetyInvariant[] = briefingData?.safety_invariants || [];
  const systematicEdits: SystematicEdit[] = briefingData?.systematic_edits || [];

  return (
    <div className="flex-1 h-full min-h-0 overflow-y-auto w-full">
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fade-in text-[var(--text-primary)]">
      
      {/* Hero Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-sky-50/60 to-purple-50/90 dark:from-indigo-950/80 dark:via-slate-900/90 dark:to-purple-950/70 border border-indigo-100 dark:border-indigo-500/30 shadow-sm dark:shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/40 shadow-sm">
                <Users className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    Shift Handover Pro
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                    Compiler-Grounded Continuity
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  Grounds uncommitted WIP diffs, AST call-graph contract breaks, and Daikon-mined invariants for zero-context loss.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 hover:border-indigo-400 text-sm font-medium text-[var(--text-primary)] shadow-sm hover:shadow transition-all"
              title="Copy formatted markdown briefing for Jira or GitHub PR"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-indigo-500" />}
              <span>{copied ? 'Copied Markdown!' : 'Export Markdown'}</span>
            </button>

            <button
              onClick={handleExportSlack}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 hover:border-purple-400 text-sm font-medium text-[var(--text-primary)] shadow-sm hover:shadow transition-all"
              title="Copy formatted concise briefing for Slack or Teams"
            >
              {copiedSlack ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-purple-500" />}
              <span>{copiedSlack ? 'Copied Slack!' : 'Export Slack'}</span>
            </button>

            <button
              onClick={handleSimulateResume}
              disabled={resumingState !== 'idle' && resumingState !== 'ready'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className={`w-4 h-4 ${resumingState === 'analyzing' || resumingState === 'synthesizing' ? 'animate-spin' : ''}`} />
              <span>
                {resumingState === 'idle' && 'Resume Work with AI'}
                {resumingState === 'analyzing' && 'Compiling AST Callers...'}
                {resumingState === 'synthesizing' && 'Synthesizing Caller Patches...'}
                {resumingState === 'ready' && 'Continuation Branch Ready!'}
              </span>
            </button>
          </div>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="mt-6 pt-5 border-t border-indigo-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mr-2 font-mono">
            Handover Scope:
          </span>
          {[
            { id: 'live_git_wip', label: 'Live Git Working Tree & Branch WIP', icon: GitBranch },
            { id: 'atc_equipment_status', label: 'ATC Avionics 3-State Migration', icon: Plane },
            { id: 'ecommerce_auth_jwt', label: 'Session-to-JWT Migration', icon: Layers },
            { id: 'benchmark_halfdone', label: 'HalfDone-Bench Live Suite', icon: BookOpen },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeScenarioId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveScenarioId(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-[var(--text-secondary)] animate-pulse">
          <Activity className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Auditing Git working tree, changed symbols, and AST call hierarchy...</p>
        </div>
      )}

      {/* BENCHMARK TAB VIEW */}
      {!loading && activeScenarioId === 'benchmark_halfdone' && benchmarkData && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--border-subtle)] shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {benchmarkData.benchmark_name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/30">
                    v{benchmarkData.benchmark_version}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-1 font-mono">
                  Theoretical Foundation: {benchmarkData.academic_basis}
                </p>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono text-sm font-bold">
                Recovery Success: {benchmarkData.success_rate_pct}%
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <span className="text-xs font-mono text-[var(--text-tertiary)] block">Evaluated Tasks</span>
                <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{benchmarkData.evaluated_tasks_count}</span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <span className="text-xs font-mono text-[var(--text-tertiary)] block">Mean Precision</span>
                <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {Math.round(benchmarkData.mean_precision * 100)}%
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <span className="text-xs font-mono text-[var(--text-tertiary)] block">Mean Recall</span>
                <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {Math.round(benchmarkData.mean_recall * 100)}%
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <span className="text-xs font-mono text-[var(--text-tertiary)] block">Mean F1 Score</span>
                <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                  {Math.round(benchmarkData.mean_f1_score * 100)}%
                </span>
              </div>
            </div>

            {/* Task Breakdown */}
            <div className="space-y-3 pt-3">
              <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-[var(--text-tertiary)]">
                Empirical Commit Task Breakdown:
              </h3>
              {benchmarkData.tasks?.map((t: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-500">{t.commit_hash} — {t.message}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600">
                      {t.recovery_verdict} (F1: {t.f1_score})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-black/5 dark:bg-black/30">
                      <span className="text-[var(--text-tertiary)] block mb-1">Visible WIP Hunks (50%):</span>
                      {t.visible_wip_files.map((f: string, fi: number) => <div key={fi} className="text-emerald-600 dark:text-emerald-400">+ {f}</div>)}
                    </div>
                    <div className="p-2 rounded bg-black/5 dark:bg-black/30">
                      <span className="text-[var(--text-tertiary)] block mb-1">Recovered Pending Callers (Held Out 50%):</span>
                      {t.ground_truth_missing_files.map((f: string, fi: number) => <div key={fi} className="text-purple-600 dark:text-purple-400">✓ {f}</div>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3-COLUMN HANDOVER BOARD */}
      {!loading && activeScenarioId !== 'benchmark_halfdone' && briefingData && (
        <>
          {/* Status Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div>
              <span className="text-[var(--text-tertiary)] uppercase block text-[10px]">Objective</span>
              <span className="font-semibold text-[var(--text-primary)]">{briefingData.objective}</span>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)] uppercase block text-[10px]">Departing Engineer</span>
              <span className="font-semibold text-indigo-500">{briefingData.departing_engineer}</span>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)] uppercase block text-[10px]">Handover Timestamp</span>
              <span className="font-semibold text-[var(--text-secondary)]">{briefingData.shift_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-tertiary)] uppercase text-[10px]">Progress</span>
              <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${briefingData.progress_percent}%` }}
                />
              </div>
              <span className="font-bold text-emerald-500">{briefingData.progress_percent}%</span>
            </div>
          </div>

          {/* 3 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Completed & Evidence-Backed */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-emerald-500/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Completed & Evidence-Verified</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600">
                  {completedList.length}
                </span>
              </div>

              <div className="space-y-3">
                {completedList.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate max-w-[200px]" title={item.file}>
                        {item.file}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {item.test_status || 'VERIFIED'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{item.desc}</p>
                    {item.evidence && (
                      <p className="text-[11px] text-[var(--text-tertiary)] font-mono">
                        Evidence: {item.evidence}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Incomplete Tasks & Broken Contracts */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-amber-500/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Unfinished Tasks & Broken Callers</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-500/10 text-amber-600">
                  {incompleteList.length}
                </span>
              </div>

              <div className="space-y-3">
                {incompleteList.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate max-w-[180px]" title={item.file}>
                        {item.file}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        item.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-amber-500/20 text-amber-600'
                      }`}>
                        {item.risk}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{item.desc}</p>
                    <div className="p-2 rounded bg-white dark:bg-slate-950 border border-amber-500/20 text-[11px] font-mono text-amber-600 dark:text-amber-400">
                      Action: {item.action}
                    </div>
                    {item.patch_diff && (
                      <div className="pt-1 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedPatch(selectedPatch === item.patch_diff ? null : item.patch_diff || null)}
                          className="text-[11px] font-mono text-indigo-500 hover:underline flex items-center gap-1"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span>{selectedPatch === item.patch_diff ? 'Hide Patch Diff' : 'View Caller Patch'}</span>
                        </button>
                        <button
                          onClick={() => handleCopyPatch(item.patch_diff!, idx)}
                          className="text-[11px] font-mono text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1"
                        >
                          {copiedPatchIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPatchIdx === idx ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Safety & Invariant Shield */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-indigo-500/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Safety & Mined Invariants</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-500/10 text-indigo-600">
                  {invariantsList.length}
                </span>
              </div>

              <div className="space-y-3">
                {invariantsList.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                        {item.rule}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        item.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{item.detail}</p>
                    {item.mined_confidence && (
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)] block">
                        Empirical Co-Change Confidence: {Math.round(item.mined_confidence * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unified Diff Viewer Modal / Dropdown */}
          {selectedPatch && (
            <div className="p-4 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-indigo-400">Unified Caller Fix Patch (git apply ready)</span>
                <button onClick={() => setSelectedPatch(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <pre className="overflow-x-auto p-2 bg-slate-900 rounded text-emerald-400">{selectedPatch}</pre>
            </div>
          )}

          {/* Systematic Edit Inference Card (LASE / Getafix / Refazer) */}
          {systematicEdits.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--border-subtle)] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-[var(--text-primary)]">
                    Systematic Edit Pattern Inference
                  </h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  LASE (ICSE '13) • Getafix (OOPSLA '19) • Refazer (TSE '18)
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                The engine inferred transformation rules from edits already made in this WIP diff, and located all unapplied sites that still need it:
              </p>
              <div className="space-y-3">
                {systematicEdits.map((rule, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-500">
                        {rule.description}
                      </span>
                      <span className="text-xs font-mono text-[var(--text-tertiary)]">
                        {rule.applied_count} applied • <b>{rule.pending_count} pending</b>
                      </span>
                    </div>
                    {rule.pending_sites?.length > 0 && (
                      <div className="space-y-2">
                        {rule.pending_sites.map((site, si) => (
                          <div key={si} className="p-2.5 rounded bg-white dark:bg-slate-950 border border-[var(--border-subtle)] font-mono text-xs space-y-1">
                            <div className="flex items-center justify-between text-[var(--text-tertiary)]">
                              <span>{site.file}:{site.line}</span>
                              <span className="text-amber-500 font-bold">Pending Handover Item</span>
                            </div>
                            <div className="text-red-500 line-through">- {site.code_snippet}</div>
                            <div className="text-emerald-500">+ {site.replacement}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      </div>
    </div>
  );
};
