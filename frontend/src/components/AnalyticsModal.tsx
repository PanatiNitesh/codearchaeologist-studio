import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  Eye, 
  Bot, 
  Flame, 
  FolderGit2, 
  RefreshCw, 
  X, 
  Copy, 
  Check, 
  Sparkles,
  Clock,
  Compass,
  Zap
} from 'lucide-react';
import { api, AnalyticsStats } from '../api/client';

interface AnalyticsModalProps {
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ onClose }) => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchStats = async () => {
    try {
      const data = await api.getAnalyticsStats();
      setStats(data);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load analytics stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const copyReport = () => {
    if (!stats) return;
    const report = [
      `# 📊 CodeArchaeologist Analytics & Usage Report`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `### Key Metrics`,
      `- **Total Page Visits**: ${stats.total_visits}`,
      `- **Unique Visitors**: ${stats.unique_visitors}`,
      `- **Repositories Ingested**: ${stats.total_repos_ingested}`,
      `- **AI Archaeological Queries**: ${stats.total_ai_queries}`,
      `- **Blast Radius Simulations**: ${stats.total_blast_analyses}`,
      `- **Total Recorded Interactions**: ${stats.total_events}`,
      ``,
      `### Top Repositories Explored`,
      ...(stats.top_repos.map(r => `- ${r.repo_id}: ${r.count} interactions`) || []),
      ``,
      `*Tracked securely via SQLite persistent backend telemetry.*`
    ].join('\n');

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:border-purple-800 dark:text-purple-300 font-semibold">PAGE VIEW</span>;
      case 'ai_query':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-950/60 dark:border-cyan-800 dark:text-cyan-300 font-semibold">AI QUERY</span>;
      case 'blast_radius':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300 font-semibold">BLAST RADIUS</span>;
      case 'repo_ingest':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 font-semibold">INGEST</span>;
      case 'load_sample':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300 font-semibold">DEMO LOAD</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-secondary)] font-semibold">{eventType.toUpperCase()}</span>;
    }
  };

  const formatEventDetail = (event: any) => {
    if (!event.details) return event.repo_id || 'System event';
    const d = event.details;
    if (d.question) return `"${d.question}"`;
    if (d.target_file) return `File: ${d.target_file}`;
    if (d.url) return `Repo: ${d.name || d.url}`;
    if (d.sample) return 'Enterprise Sample Repository';
    return event.repo_id || JSON.stringify(d);
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[var(--bg-panel-elevated)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden shadow-2xl text-[var(--text-primary)]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-hairline)] flex items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[var(--text-primary)] font-mono uppercase tracking-wide">
                  Live Usage & Visitor Analytics
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-semibold">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                Persistent telemetry stored in SQLite • Real-time visitor & feature utilization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Refresh telemetry metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={copyReport}
              className="px-2.5 py-1 text-xs font-mono rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors font-semibold"
              title="Copy markdown analytics report"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Export'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)] gap-3 font-mono text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Fetching telemetry data...</span>
            </div>
          ) : !stats ? (
            <div className="text-center py-12 text-[var(--text-tertiary)] font-mono text-xs">
              No analytics data available yet.
            </div>
          ) : (
            <>
              {/* Primary KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
                    <span className="text-[11px] font-mono uppercase font-semibold text-[var(--text-tertiary)]">Total Visits</span>
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    {stats.total_visits}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
                    Page loads & hits
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                    <span className="text-[11px] font-mono uppercase font-semibold text-[var(--text-tertiary)]">Unique Users</span>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    {stats.unique_visitors}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
                    Anonymized devices
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
                    <span className="text-[11px] font-mono uppercase font-semibold text-[var(--text-tertiary)]">Repos Analyzed</span>
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    {stats.total_repos_ingested}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
                    Mined & Indexed
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 mb-2">
                    <span className="text-[11px] font-mono uppercase font-semibold text-[var(--text-tertiary)]">AI Inquiries</span>
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    {stats.total_ai_queries}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
                    Archaeology Q&A
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] flex flex-col justify-between shadow-sm col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
                    <span className="text-[11px] font-mono uppercase font-semibold text-[var(--text-tertiary)]">Blast Radius</span>
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    {stats.total_blast_analyses}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
                    Impact simulations
                  </div>
                </div>
              </div>

              {/* Action Breakdown & Top Repositories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Feature Usage Breakdown */}
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Interaction Breakdown
                    </h4>
                    <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      {stats.total_events} total events
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {Object.entries(stats.event_breakdown).length === 0 ? (
                      <div className="text-xs text-[var(--text-tertiary)] font-mono">No actions recorded yet.</div>
                    ) : (
                      Object.entries(stats.event_breakdown).map(([type, count]) => {
                        const pct = stats.total_events > 0 ? Math.round((count / stats.total_events) * 100) : 0;
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-[var(--text-secondary)] font-medium capitalize">{type.replace('_', ' ')}</span>
                              <span className="text-[var(--text-tertiary)] font-semibold">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-hairline)]">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                style={{ width: `${Math.max(4, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Top Repositories */}
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Top Explored Codebases
                    </h4>
                    <span className="text-[11px] font-mono text-[var(--text-tertiary)]">By interactions</span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {stats.top_repos.length === 0 ? (
                      <div className="text-xs text-[var(--text-tertiary)] font-mono">No repositories explored yet.</div>
                    ) : (
                      stats.top_repos.map((repo, idx) => (
                        <div 
                          key={repo.repo_id}
                          className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-[var(--text-secondary)] font-medium truncate">{repo.repo_id}</span>
                          </div>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                            {repo.count} actions
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Live Activity Event Stream */}
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Live Activity Stream
                  </h4>
                  <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                    Last {stats.recent_events.length} interactions
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                  {stats.recent_events.length === 0 ? (
                    <div className="text-xs text-[var(--text-tertiary)] font-mono">No activity logged yet.</div>
                  ) : (
                    stats.recent_events.map((ev) => (
                      <div 
                        key={ev.id} 
                        className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-indigo-500/40 transition-colors text-xs font-mono"
                      >
                        <div className="flex items-center gap-2.5 truncate mr-2">
                          {getEventBadge(ev.event_type)}
                          <span className="text-[var(--text-secondary)] truncate">
                            {formatEventDetail(ev)}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                          {ev.created_at ? new Date(ev.created_at).toLocaleTimeString() : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Telemetry Active • Last synchronized: {lastRefreshed || 'Just now'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-xs text-[var(--text-primary)] font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
