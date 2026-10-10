import React, { useState } from 'react';
import { 
  GitCommit, 
  Calendar, 
  User, 
  Tag, 
  Sparkles,
  GitBranch,
  Layers
} from 'lucide-react';
import { SoftwareTimeline, CommitRecord } from '../api/client';

interface TimelineViewProps {
  timeline: SoftwareTimeline | null;
  onSelectCommit?: (commit: CommitRecord) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  onSelectCommit
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!timeline || timeline.milestones.length === 0) {
    return (
      <div className="studio-panel p-4 text-center text-zinc-500 font-mono text-xs">
        No evolutionary Git timeline records available.
      </div>
    );
  }

  const getCategoryChip = (category: string) => {
    switch (category) {
      case 'FEATURE':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">FEAT</span>;
      case 'BUG_FIX':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200">FIX</span>;
      case 'REFACTOR':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200">REFACTOR</span>;
      case 'SECURITY':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">SEC</span>;
      case 'PERFORMANCE':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">PERF</span>;
      case 'TEST':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-pink-50 text-pink-700 border border-pink-200">TEST</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-hairline)]">{category}</span>;
    }
  };

  const categories = ['ALL', ...Object.keys(timeline.category_distribution)];

  return (
    <div className="studio-panel flex flex-col h-full bg-[var(--bg-surface)]">
      {/* Header bar */}
      <div className="h-8 px-3 border-b border-[var(--border-hairline)] bg-[var(--bg-card)] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--text-primary)]">
            Software Evolution Timeline ({timeline.time_span})
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            • {timeline.total_commits} mined commits
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal / Vertical Timeline Lane */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-3 flex gap-4 items-start">
        {timeline.milestones.map((milestone, idx) => {
          const filteredCommits = milestone.key_commits.filter(c => 
            selectedCategory === 'ALL' || c.category === selectedCategory
          );

          if (filteredCommits.length === 0 && selectedCategory !== 'ALL') return null;

          return (
            <div
              key={`m-${idx}`}
              className="w-72 shrink-0 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] p-3 flex flex-col gap-2 shadow-xs"
            >
              {/* Milestone Tag */}
              <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-hairline)]">
                <span className="font-mono text-xs font-bold text-indigo-600">
                  {milestone.period}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] font-medium">
                  {milestone.commit_count} commits
                </span>
              </div>

              <p className="text-[11px] text-[var(--text-primary)] font-medium leading-tight">
                {milestone.headline}
              </p>

              {/* Commits */}
              <div className="space-y-1.5 mt-1">
                {filteredCommits.map(c => (
                  <div
                    key={c.commit_id}
                    onClick={() => onSelectCommit && onSelectCommit(c)}
                    className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-indigo-300 cursor-pointer text-xs transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {getCategoryChip(c.category)}
                      <span className="font-mono text-[10px] text-[var(--text-secondary)] font-semibold">
                        {c.short_hash}
                      </span>
                      <div className="text-[9px] font-mono text-[var(--text-muted)] ml-auto flex items-center gap-1">
                        <span className="text-emerald-600 font-semibold">+{c.added_lines}</span>
                        <span className="text-rose-600 font-semibold">-{c.deleted_lines}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--text-primary)] truncate font-sans font-medium">
                      {c.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mt-1">
                      <span className="truncate max-w-[120px]">{c.author}</span>
                      <span>{c.date.slice(0, 10)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
