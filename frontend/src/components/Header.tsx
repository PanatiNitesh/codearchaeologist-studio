import React, { useState } from 'react';
import { 
  GitBranch, 
  Layers, 
  Plus, 
  Sparkles, 
  BarChart2, 
  Terminal, 
  Check, 
  Copy, 
  ChevronDown, 
  Activity, 
  FolderGit2, 
  Cpu, 
  LayoutDashboard, 
  Compass, 
  Flame, 
  History, 
  Bot,
  Users,
  Palette,
  Sun,
  Moon,
  Zap,
  Upload,
  FileArchive
} from 'lucide-react';
import { RepositoryItem, api } from '../api/client';

export type AppPage = 'overview' | 'architecture' | 'blast-radius' | 'systemdna' | 'handover' | 'archaeology' | 'assistant' | 'evaluation';
export type AppTheme = 'light' | 'dark' | 'cyber' | 'aurora' | 'titanium' | 'daybreak' | 'studio';

export interface HeaderProps {
  repositories: RepositoryItem[];
  currentRepoId: string;
  onSelectRepo: (id: string) => void;
  onIngest: (url: string) => Promise<void>;
  onLoadSample: () => Promise<void>;
  onOpenEval?: () => void;
  onOpenAnalytics: () => void;
  onOpenSystemDNA?: () => void;
  loading: boolean;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  currentTheme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  repositories,
  currentRepoId,
  onSelectRepo,
  onIngest,
  onLoadSample,
  onOpenEval,
  onOpenAnalytics,
  onOpenSystemDNA,
  loading,
  activePage,
  onNavigate,
  currentTheme = 'light',
  onThemeChange
}) => {
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [ingestMode, setIngestMode] = useState<'url' | 'upload'>('url');
  const [inputUrl, setInputUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestStatusText, setIngestStatusText] = useState('');
  const [copied, setCopied] = useState(false);

  const currentRepo = repositories.find(r => r.id === currentRepoId);

  const navItems: { id: AppPage; label: string; icon: React.ComponentType<any>; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'architecture', label: 'Topology Graph', icon: Compass },
    { id: 'blast-radius', label: 'Blast Radius', icon: Flame },
    { id: 'systemdna', label: 'SystemDNA', icon: Cpu, badge: 'ForgeHacks' },
    { id: 'handover', label: 'Shift Handover', icon: Users, badge: 'Continuity' },
    { id: 'archaeology', label: 'Archaeology', icon: History },
    { id: 'assistant', label: 'Evidence AI', icon: Bot },
    { id: 'evaluation', label: 'Benchmarks', icon: BarChart2 }
  ];

  const themeOptions: { id: AppTheme; label: string; icon: React.ComponentType<any>; desc: string }[] = [
    { id: 'light', label: 'Light Clean (Pro)', icon: Sun, desc: 'Ultra-crisp modern Silicon Valley SaaS look' },
    { id: 'dark', label: 'Dark Titanium', icon: Moon, desc: 'High-contrast stealth graphite' },
    { id: 'cyber', label: 'Cyber Neon', icon: Zap, desc: 'Luminous cyan, radiant violet & glass glow' },
    { id: 'aurora', label: 'Cosmic Aurora', icon: Palette, desc: 'Deep sapphire & northern lights' }
  ];

  const getThemeLabel = (t: string) => {
    if (t === 'light') return 'Light';
    if (t === 'cyber') return 'Cyber';
    if (t === 'aurora') return 'Aurora';
    return 'Dark';
  };

  const startTaskPolling = (taskId: string, fallbackUrl?: string) => {
    let attempts = 0;
    let pollInterval: any = null;
    pollInterval = setInterval(async () => {
      attempts++;
      try {
        const statusData = await api.getTaskStatus(taskId);
        if (statusData.progress) {
          setIngestStatusText(statusData.progress);
        }
        if (statusData.status === 'completed') {
          if (pollInterval) clearInterval(pollInterval);
          setIngestLoading(false);
          setShowIngestModal(false);
          setInputUrl('');
          setSelectedFile(null);
          setIngestStatusText('');
          if (statusData.repo_id) {
            onSelectRepo(statusData.repo_id);
          } else if (fallbackUrl) {
            await onIngest(fallbackUrl);
          }
        } else if (statusData.status === 'failed') {
          if (pollInterval) clearInterval(pollInterval);
          setIngestLoading(false);
          setIngestStatusText('');
          alert(`Ingestion failed: ${statusData.error || 'Unknown error'}`);
        } else if (attempts > 600) {
          if (pollInterval) clearInterval(pollInterval);
          setIngestLoading(false);
          setIngestStatusText('');
          alert('Ingestion is taking longer than expected. The task is continuing in the background—please check back shortly or refresh the page.');
        }
      } catch (err) {
        console.warn('Poll error (retrying):', err);
      }
    }, 1500);
  };

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ingestMode === 'url') {
      const url = inputUrl.trim();
      if (!url) return;
      setIngestLoading(true);
      setIngestStatusText('Initiating repository archaeology...');
      try {
        const { task_id } = await api.ingestAsync(url);
        setIngestStatusText('Ingestion task queued. Processing...');
        startTaskPolling(task_id, url);
      } catch (err: any) {
        setIngestLoading(false);
        setIngestStatusText('');
        alert(`Could not start ingestion: ${err?.message || err}`);
      }
    } else {
      if (!selectedFile) {
        alert('Please select or drop a .zip archive of your project first.');
        return;
      }
      setIngestLoading(true);
      setIngestStatusText(`Uploading ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(1)} MB)...`);
      try {
        const { task_id } = await api.uploadRepoZip(selectedFile);
        setIngestStatusText('Upload complete. Analyzing codebase...');
        startTaskPolling(task_id);
      } catch (err: any) {
        setIngestLoading(false);
        setIngestStatusText('');
        alert(`Upload failed: ${err?.message || err}`);
      }
    }
  };

  const copyRepoPath = () => {
    if (currentRepo?.path) {
      navigator.clipboard.writeText(currentRepo.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <header style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-hairline)', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }} className="select-none">
      {/* ── Single unified nav bar ── */}
      <div style={{ height: 'var(--nav-height, 52px)', padding: '0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* ── Logo ── */}
        <div
          onClick={() => onNavigate('overview')}
          className="flex items-center gap-2 cursor-pointer flex-shrink-0"
          title="CodeArchaeologist Pro"
        >
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--accent-glow)', flexShrink: 0
          }}>
            <Layers style={{ width: 14, height: 14, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            CodeArchaeologist
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: 4,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)'
          }}>Pro</span>
        </div>

        {/* ── Divider ── */}
        <div style={{ width: 1, height: 20, background: 'var(--border-hairline)', flexShrink: 0, marginLeft: 4, marginRight: 4 }} />

        {/* ── Repo Selector ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
          borderRadius: 7, border: '1px solid var(--border-hairline)',
          background: 'var(--bg-card)', cursor: 'pointer', flexShrink: 0,
          transition: 'all 0.15s ease'
        }} className="hover:border-[var(--border-subtle)]">
          <FolderGit2 style={{ width: 13, height: 13, color: 'var(--accent-primary)', flexShrink: 0 }} />
          <select
            value={currentRepoId}
            onChange={(e) => onSelectRepo(e.target.value)}
            style={{ background: 'transparent', border: 'none', fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', maxWidth: 160 }}
            disabled={loading}
          >
            {repositories.map(r => (
              <option key={r.id} value={r.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                {r.name}
              </option>
            ))}
          </select>
          <ChevronDown style={{ width: 11, height: 11, color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>

        {currentRepo && (
          <div className="hidden xl:flex items-center gap-1" style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
            <GitBranch style={{ width: 11, height: 11 }} />
            <span>{currentRepo.default_branch || 'main'}</span>
            <button onClick={copyRepoPath} style={{ marginLeft: 3, cursor: 'pointer', color: 'var(--text-muted)', background: 'none', border: 'none', display: 'flex', alignItems: 'center' }}>
              {copied ? <Check style={{ width: 11, height: 11, color: 'var(--accent-emerald)' }} /> : <Copy style={{ width: 11, height: 11 }} />}
            </button>
          </div>
        )}

        {/* ── Nav Tabs (scrollable center) ── */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflow: 'hidden', marginLeft: 8, marginRight: 8 }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(99,102,241,0.22)' : '1px solid transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'all 0.15s ease', fontFamily: 'Inter, sans-serif'
                }}
                className={!isActive ? 'hover-nav-tab' : ''}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
              >
                <Icon style={{ width: 13, height: 13, flexShrink: 0 }} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: 8.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    background: isActive ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
                    border: '1px solid var(--border-hairline)', padding: '1px 5px', borderRadius: 4
                  }}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          {currentRepo?.stats && (
            <div className="hidden xl:flex items-center gap-1.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5 }}>
              <div style={{ padding: '2px 8px', borderRadius: 5, background: 'rgba(16,185,129,0.12)', color: 'var(--accent-emerald)', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 600 }}>
                F1 {(currentRepo.stats.arch_f1 ?? 1.0).toFixed(2)}
              </div>
              <div style={{ padding: '2px 8px', borderRadius: 5, background: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(99,102,241,0.25)', fontWeight: 600 }}>
                Blast {(currentRepo.stats.blast_f1 ?? 0.85).toFixed(2)}
              </div>
            </div>
          )}

          {/* ── Theme Switcher ── */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                borderRadius: 7, border: '1px solid var(--border-hairline)',
                background: 'var(--bg-card)', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                color: 'var(--text-secondary)', transition: 'all 0.15s ease'
              }}
              title="Change UI Theme"
            >
              <Palette style={{ width: 13, height: 13 }} />
              <span className="hidden md:inline" style={{ fontSize: 12 }}>{getThemeLabel(currentTheme)}</span>
              <ChevronDown style={{ width: 11, height: 11, color: 'var(--text-muted)' }} />
            </button>

            {showThemeMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setShowThemeMenu(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 240,
                  background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)',
                  borderRadius: 12, boxShadow: 'var(--shadow-xl)', zIndex: 200, overflow: 'hidden',
                  padding: 6
                }}>
                  <div style={{ padding: '6px 8px 8px', borderBottom: '1px solid var(--border-hairline)', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Theme</span>
                  </div>
                  {themeOptions.map(th => {
                    const Icon = th.icon;
                    const isCur = currentTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        onClick={() => { if (onThemeChange) onThemeChange(th.id); setShowThemeMenu(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: isCur ? 'rgba(99,102,241,0.10)' : 'transparent',
                          textAlign: 'left', transition: 'background 0.12s'
                        }}
                        onMouseEnter={e => { if (!isCur) (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'; }}
                        onMouseLeave={e => { if (!isCur) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <Icon style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1, color: isCur ? 'var(--accent-primary)' : 'var(--text-tertiary)' }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: isCur ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{th.label}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 1 }}>{th.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <button
            onClick={onOpenAnalytics}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
              borderRadius: 7, border: '1px solid var(--border-hairline)',
              background: 'var(--bg-card)', cursor: 'pointer', fontSize: 12, fontWeight: 500,
              color: 'var(--text-secondary)', transition: 'all 0.15s ease', whiteSpace: 'nowrap'
            }}
            title="Live Usage Analytics"
          >
            <Activity style={{ width: 13, height: 13, color: 'var(--accent-primary)' }} />
            <span className="hidden lg:inline">Analytics</span>
          </button>

          <button
            onClick={onLoadSample}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
              borderRadius: 7, border: '1px solid var(--border-hairline)',
              background: 'var(--bg-card)', cursor: 'pointer', fontSize: 12, fontWeight: 500,
              color: 'var(--text-secondary)', transition: 'all 0.15s ease', whiteSpace: 'nowrap'
            }}
            title="Reload Sample"
          >
            <Sparkles style={{ width: 13, height: 13, color: 'var(--accent-amber)' }} />
            <span className="hidden md:inline">Sample</span>
          </button>

          {/* ── Ingest Repo Button ── */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowIngestModal(!showIngestModal)}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                color: '#fff', background: 'var(--accent-primary)',
                boxShadow: 'var(--accent-glow)', transition: 'all 0.15s ease',
                opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap'
              }}
            >
              <Plus style={{ width: 13, height: 13 }} />
              <span>Ingest Repo</span>
            </button>

            {showIngestModal && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowIngestModal(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                  width: 480, maxWidth: '92vw',
                  background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)',
                  borderRadius: 16, boxShadow: 'var(--shadow-xl)', zIndex: 200, padding: 20,
                  color: 'var(--text-primary)'
                }} className="animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border-hairline)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Terminal style={{ width: 15, height: 15, color: 'var(--accent-primary)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Ingest Repository</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>8-phase archaeology pipeline</div>
                      </div>
                    </div>
                    <button onClick={() => setShowIngestModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6 }}>✕</button>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.65 }}>
                    Provide a public Git URL or upload a local .zip archive. The pipeline extracts AST symbols, builds dependency graphs, classifies components, and mines Git history.
                  </p>

                  <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-hairline)', borderRadius: 10, padding: 4, marginBottom: 16 }}>
                    {([{ id: 'url', icon: Terminal, label: 'Git URL / GitHub' }, { id: 'upload', icon: Upload, label: 'Upload Local ZIP' }] as const).map(tab => {
                      const TabIcon = tab.icon;
                      const isTabActive = ingestMode === tab.id;
                      return (
                        <button key={tab.id} type="button" onClick={() => setIngestMode(tab.id)}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '7px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600, transition: 'all 0.15s ease',
                            background: isTabActive ? 'var(--accent-primary)' : 'transparent',
                            color: isTabActive ? '#fff' : 'var(--text-tertiary)',
                            boxShadow: isTabActive ? 'var(--accent-glow)' : 'none'
                          }}
                        >
                          <TabIcon style={{ width: 13, height: 13 }} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <form onSubmit={handleIngestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {ingestMode === 'url' ? (
                      <div>
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Source URL or Path</label>
                        <input
                          type="text"
                          placeholder="https://github.com/expressjs/express or owner/repo"
                          value={inputUrl}
                          onChange={(e) => setInputUrl(e.target.value)}
                          style={{
                            width: '100%', padding: '9px 12px', borderRadius: 8,
                            border: '1px solid var(--border-subtle)', background: 'var(--bg-input)',
                            color: 'var(--text-primary)', fontSize: 12,
                            fontFamily: 'JetBrains Mono, monospace', outline: 'none', transition: 'border-color 0.15s'
                          }}
                          onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
                          onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
                          required={ingestMode === 'url'}
                        />
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Quick Presets</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {[
                              { name: 'expressjs/express', url: 'https://github.com/expressjs/express' },
                              { name: 'fastapi/fastapi', url: 'https://github.com/fastapi/fastapi' },
                              { name: 'pallets/flask', url: 'https://github.com/pallets/flask' },
                              { name: 'CodeArchaeologist', url: 'https://github.com/PanatiNitesh/CodeArchaeologist-Pro' }
                            ].map(preset => (
                              <button key={preset.name} type="button" onClick={() => setInputUrl(preset.url)}
                                style={{
                                  padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-hairline)',
                                  background: 'var(--bg-card)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                                  color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.12s'
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-primary)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hairline)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                              >
                                ⚡ {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Local Project Archive (.zip)</label>
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault(); setIsDragging(false);
                            if (e.dataTransfer.files?.[0]) {
                              const f = e.dataTransfer.files[0];
                              if (f.name.toLowerCase().endsWith('.zip')) setSelectedFile(f);
                              else alert('Please select a .zip archive.');
                            }
                          }}
                          onClick={() => document.getElementById('zip-upload-input')?.click()}
                          style={{
                            border: `2px dashed ${isDragging ? 'var(--accent-primary)' : selectedFile ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                            borderRadius: 10, padding: 24, textAlign: 'center', cursor: 'pointer',
                            background: isDragging ? 'rgba(99,102,241,0.06)' : selectedFile ? 'rgba(16,185,129,0.05)' : 'var(--bg-card)',
                            transition: 'all 0.15s'
                          }}
                        >
                          <input id="zip-upload-input" type="file" accept=".zip" style={{ display: 'none' }}
                            onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }}
                          />
                          {selectedFile ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileArchive style={{ width: 20, height: 20, color: 'var(--accent-emerald)' }} />
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{selectedFile.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{(selectedFile.size/1024/1024).toFixed(2)} MB · Ready</div>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                style={{ fontSize: 11, color: 'var(--accent-rose)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                                Remove file
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Upload style={{ width: 20, height: 20, color: 'var(--accent-primary)' }} />
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Drop your <span style={{ color: 'var(--accent-primary)' }}>.zip</span> here</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>or click to browse · Max 35 MB</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingTop: 14, borderTop: '1px solid var(--border-hairline)' }}>
                      <button type="button" onClick={() => setShowIngestModal(false)}
                        style={{
                          padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-hairline)',
                          background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
                        }}>Cancel</button>
                      <button type="submit"
                        disabled={ingestLoading || (ingestMode === 'upload' && !selectedFile)}
                        style={{
                          padding: '7px 18px', borderRadius: 8, background: 'var(--accent-primary)', border: 'none',
                          color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                          boxShadow: 'var(--accent-glow)', minWidth: 160,
                          opacity: (ingestLoading || (ingestMode === 'upload' && !selectedFile)) ? 0.5 : 1
                        }}>
                        {ingestLoading ? (ingestStatusText || 'Processing…') : ingestMode === 'upload' ? 'Upload & Analyze' : 'Run Archaeology'}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nav tabs are embedded in the single bar above */}
    </header>
  );
};
