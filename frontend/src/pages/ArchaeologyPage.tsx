import React from 'react';
import { 
  Clock, 
  GitCommit, 
  User, 
  Calendar
} from 'lucide-react';
import { TimelineView } from '../components/TimelineView';
import { 
  SoftwareTimeline, 
  CommitRecord, 
  FileItem,
  FileEvolution 
} from '../api/client';

interface ArchaeologyPageProps {
  timeline: SoftwareTimeline | null;
  files: FileItem[];
  selectedFilePath?: string | null;
  fileEvolution?: FileEvolution | null;
  onSelectFile: (path: string) => void;
  onSelectCommit?: (commit: CommitRecord) => void;
}

export const ArchaeologyPage: React.FC<ArchaeologyPageProps> = ({
  timeline,
  files,
  selectedFilePath,
  fileEvolution,
  onSelectFile,
  onSelectCommit
}) => {
  const milestones = timeline?.milestones || [];

  const handleCommitClick = (c: CommitRecord) => {
    if (onSelectCommit) {
      onSelectCommit(c);
    } else if (c.changed_files && c.changed_files.length > 0) {
      const target = files.find(f => f.path.includes(c.changed_files[0])) || files[0];
      if (target) onSelectFile(target.path);
    }
  };

  return (
    <div className="flex-1 h-full min-h-0 overflow-y-auto w-full">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fade-in text-[var(--text-primary)]">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50/90 via-indigo-50/40 to-slate-50/80 dark:from-slate-900 dark:via-amber-950/30 dark:to-slate-900 border border-amber-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Software Archaeology & Commit Churn Evolution
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Chronological commit timeline mining, author distribution, rename tracking, and regression hotspot profiling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 px-3 py-1.5 rounded-lg">
            {timeline?.total_commits ?? 0} Total Commits
          </div>
          <div className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20 px-3 py-1.5 rounded-lg">
            {milestones.length} Epoch Milestones
          </div>
        </div>
      </div>

      {/* Main Interactive Timeline Graphic */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-amber-500" />
            Interactive Commit Evolution Biography
          </h2>
          <span className="text-xs text-[var(--text-tertiary)]">Click any node to inspect affected modules</span>
        </div>

        <div className="h-64 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-2 overflow-hidden shadow-inner">
          <TimelineView
            timeline={timeline}
            onSelectCommit={handleCommitClick}
          />
        </div>
      </div>

      {/* Milestone Epoch Stream */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Chronological Evolution Epochs & Key Commits
        </h3>

        <div className="space-y-4">
          {milestones.map((m, mIdx) => (
            <div 
              key={`${m.period}-${mIdx}`}
              className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-3 shadow-sm"
            >
              {/* Epoch Milestone Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50 px-2.5 py-1 rounded-md">
                    {m.period}
                  </span>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    {m.headline || `Evolution Cycle ${m.period}`}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-tertiary)]">
                  <span>{m.commit_count} Commits</span>
                  {m.top_categories && Object.keys(m.top_categories).length > 0 && (
                    <div className="flex items-center gap-1">
                      {Object.entries(m.top_categories).slice(0, 2).map(([cat, cnt]) => (
                        <span key={cat} className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                          {cat} ({cnt})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Commits Inside Milestone */}
              <div className="space-y-2">
                {(m.key_commits || []).map((c) => (
                  <div
                    key={c.commit_id}
                    onClick={() => handleCommitClick(c)}
                    className="p-3.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-hairline)] cursor-pointer transition-all space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800/50 px-2 py-0.5 rounded">
                          {c.short_hash || c.commit_id.slice(0, 7)}
                        </span>
                        <span className="text-xs font-medium text-[var(--text-primary)]">
                          {c.message}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-hairline)] text-[var(--text-secondary)] shrink-0">
                        {c.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-tertiary)] font-mono">
                      <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                        <User className="w-3 h-3 text-[var(--text-tertiary)]" />
                        {c.author}
                      </span>
                      <span>•</span>
                      <span>{c.date || (c.timestamp ? new Date(c.timestamp).toLocaleDateString() : 'Historical')}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-bold">+{c.added_lines}</span>
                      <span className="text-rose-600 font-bold">-{c.deleted_lines}</span>
                      <span>•</span>
                      <span>{c.changed_files?.length || 0} files</span>
                    </div>

                    {c.changed_files && c.changed_files.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {c.changed_files.map((cf, cfIdx) => (
                          <span 
                            key={cfIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectFile(cf);
                            }}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-indigo-600 hover:border-indigo-400 border border-[var(--border-hairline)] transition-colors"
                          >
                            {cf}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};
