import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Bot
} from 'lucide-react';
import { Header, AppPage, AppTheme } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { BlastRadiusPage } from './pages/BlastRadiusPage';
import { SystemDNAPage } from './pages/SystemDNAPage';
import { HandoverPage } from './pages/HandoverPage';
import { ArchaeologyPage } from './pages/ArchaeologyPage';
import { AssistantPage } from './pages/AssistantPage';
import { EvaluationPage } from './pages/EvaluationPage';

import { AIChatDrawer } from './components/AIChatDrawer';
import { AnalyticsModal } from './components/AnalyticsModal';
import { 
  api, 
  RepositoryItem, 
  FileItem, 
  SoftwareGraph, 
  SoftwareTimeline, 
  FileEvolution, 
  BlastRadiusResult, 
  ChangeImpactPrediction,
  OverallEvaluation,
  RAGAnswerResponse
} from './api/client';

export const App: React.FC = () => {
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [currentRepoId, setCurrentRepoId] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  const [graph, setGraph] = useState<SoftwareGraph | null>(null);
  const [timeline, setTimeline] = useState<SoftwareTimeline | null>(null);
  const [fileEvolution, setFileEvolution] = useState<FileEvolution | null>(null);
  const [blastRadius, setBlastRadius] = useState<BlastRadiusResult | null>(null);
  const [predictions, setPredictions] = useState<ChangeImpactPrediction | null>(null);
  const [evaluation, setEvaluation] = useState<OverallEvaluation | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing CodeArchaeologist...');
  
  // Website Multi-Page Navigation
  const [activePage, setActivePage] = useState<AppPage>('overview');

  // Theme Switching Engine (Default = Light Professional)
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('code_arch_theme') as AppTheme) || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light' || theme === 'daybreak') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('code_arch_theme', theme);
  }, [theme]);

  // Modals & Floating Drawer
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>('');

  // Initial load
  useEffect(() => {
    loadRepositories();
    api.trackEvent('page_view');
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K opens Evidence AI Assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAIChatOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadRepositories = async () => {
    setLoading(true);
    setLoadingMessage('Loading repository registry...');
    try {
      let repos = await api.getRepositories();
      if (!repos || repos.length === 0) {
        setLoadingMessage('Initializing 2022–2026 Enterprise E-Commerce Sample Repository...');
        await api.loadSample();
        repos = await api.getRepositories();
      }
      setRepositories(repos);
      if (repos.length > 0) {
        await switchRepository(repos[0].id);
      }
    } catch (err) {
      console.error('Failed to load repositories:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchRepository = async (repoId: string) => {
    setCurrentRepoId(repoId);
    setLoading(true);
    setLoadingMessage(`Indexing architecture graph and Git archaeology for ${repoId}...`);

    try {
      const [filesData, graphData, timelineData, evalData, reposData] = await Promise.all([
        api.getFiles(repoId),
        api.getGraph(repoId),
        api.getTimeline(repoId),
        api.getEvaluation(repoId),
        api.getRepositories()
      ]);

      if (reposData && reposData.length > 0) {
        setRepositories(reposData);
      }

      setFiles(filesData);
      setGraph(graphData);
      setTimeline(timelineData);
      setEvaluation(evalData);

      const defaultFile = filesData.find(f => f.path.includes('userService') || f.path.includes('paymentService')) || filesData[0];
      if (defaultFile) {
        await handleSelectFile(defaultFile.path, repoId, filesData);
      } else {
        setSelectedFilePath(null);
        setSelectedFile(null);
      }
    } catch (err) {
      console.error('Failed to switch repo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = async (filePath: string, repoId: string = currentRepoId, filesList: FileItem[] = files) => {
    setSelectedFilePath(filePath);
    const matched = filesList.find(f => f.path === filePath) || null;
    setSelectedFile(matched);

    try {
      const [evo, blast, pred] = await Promise.all([
        api.getFileIntelligence(repoId, filePath),
        api.calculateBlastRadius(repoId, filePath),
        api.predictImpact(repoId, filePath)
      ]);

      setFileEvolution(evo);
      setBlastRadius(blast);
      setPredictions(pred);
    } catch (err) {
      console.error('Failed to fetch file intelligence:', err);
    }
  };

  const handleIngest = async (url: string) => {
    setLoading(true);
    setLoadingMessage('Executing 8-phase code understanding & Git mining pipeline...');
    try {
      const res = await api.ingest(url);
      const repos = await api.getRepositories();
      setRepositories(repos);
      if (res.repo_id) {
        await switchRepository(res.repo_id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setLoading(true);
    setLoadingMessage('Loading 2022–2026 Enterprise E-Commerce Sample Repository...');
    try {
      const res = await api.loadSample();
      const repos = await api.getRepositories();
      setRepositories(repos);
      if (res.repo_id) {
        await switchRepository(res.repo_id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAskAIFromComponent = (prompt: string) => {
    setChatInitialPrompt(prompt);
    setIsAIChatOpen(true);
  };

  const handleAskQuestion = async (question: string): Promise<RAGAnswerResponse> => {
    if (!currentRepoId) throw new Error('No repository active');
    return await api.askAI(currentRepoId, question);
  };

  const handleReRunEvaluation = async () => {
    if (!currentRepoId) return;
    const evalData = await api.getEvaluation(currentRepoId);
    setEvaluation(evalData);
  };

  const currentRepo = repositories.find(r => r.id === currentRepoId) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-app)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      {/* Header / Nav */}
      <Header
        repositories={repositories}
        currentRepoId={currentRepoId}
        onSelectRepo={switchRepository}
        onIngest={handleIngest}
        onLoadSample={handleLoadSample}
        onOpenEval={() => setActivePage('evaluation')}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenSystemDNA={() => setActivePage('systemdna')}
        loading={loading}
        activePage={activePage}
        onNavigate={setActivePage}
        currentTheme={theme}
        onThemeChange={setTheme}
      />

      {/* Main Website Page Viewport */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6" style={{ background: 'var(--bg-app)' }}>
          {/* Animated logo icon */}
          <div style={{ position: 'relative', width: 56, height: 56 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--accent-glow-lg)'
            }}>
              <Loader2 style={{ width: 24, height: 24, color: '#fff' }} className="animate-spin" />
            </div>
            <div style={{
              position: 'absolute', inset: -4, borderRadius: 18,
              border: '1px solid var(--accent-primary)', opacity: 0.3,
              animation: 'pulse-glow 2s ease-in-out infinite'
            }} />
          </div>
          <div style={{ textAlign: 'center', maxWidth: 360 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
              {loadingMessage}
            </p>
            <p style={{ fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              AST Extraction · Dependency Graph · Git Mining · Embeddings
            </p>
          </div>
          {/* Progress shimmer bar */}
          <div style={{ width: 200, height: 3, borderRadius: 99, background: 'var(--border-hairline)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-primary))',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s infinite'
            }} />
          </div>
        </div>
      ) : (
        <main className="flex-1 min-h-0 h-full overflow-hidden relative flex flex-col">
          {activePage === 'overview' && (
            <OverviewPage
              repo={currentRepo}
              graph={graph}
              timeline={timeline}
              evaluation={evaluation}
              files={files}
              onNavigate={(page: string) => setActivePage(page as AppPage)}
              onSelectFile={(path) => {
                handleSelectFile(path);
                setActivePage('architecture');
              }}
            />
          )}

          {activePage === 'architecture' && (
            <ArchitecturePage
              graph={graph}
              files={files}
              selectedFilePath={selectedFilePath}
              selectedFile={selectedFile}
              fileEvolution={fileEvolution}
              blastRadius={blastRadius}
              predictions={predictions}
              onSelectFile={handleSelectFile}
              onAskAI={handleAskAIFromComponent}
              onNavigateBlast={() => setActivePage('blast-radius')}
            />
          )}

          {activePage === 'blast-radius' && (
            <BlastRadiusPage
              repoId={currentRepoId}
              files={files}
              selectedFilePath={selectedFilePath}
              blastRadius={blastRadius}
              predictions={predictions}
              onSelectFile={handleSelectFile}
              onAskAI={handleAskAIFromComponent}
            />
          )}

          {activePage === 'systemdna' && (
            <SystemDNAPage
              repoId={currentRepoId}
              onAskAI={handleAskAIFromComponent}
            />
          )}

          {activePage === 'handover' && (
            <HandoverPage
              files={files}
              onNavigate={(page: string) => setActivePage(page as AppPage)}
            />
          )}

          {activePage === 'archaeology' && (
            <ArchaeologyPage
              timeline={timeline}
              files={files}
              selectedFilePath={selectedFilePath}
              fileEvolution={fileEvolution}
              onSelectFile={handleSelectFile}
            />
          )}

          {activePage === 'assistant' && (
            <AssistantPage
              repoId={currentRepoId}
              onAskQuestion={handleAskQuestion}
              onSelectFile={(path) => {
                handleSelectFile(path);
                setActivePage('architecture');
              }}
              initialPrompt={chatInitialPrompt}
            />
          )}

          {activePage === 'evaluation' && (
            <EvaluationPage
              evaluation={evaluation}
              onReRun={handleReRunEvaluation}
            />
          )}
        </main>
      )}

      {/* Floating Evidence AI Quick Button */}
      {activePage !== 'assistant' && (
        <button
          onClick={() => setIsAIChatOpen(true)}
          title="Open Quick Evidence Assistant (⌘K)"
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 30,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 12,
            background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)', cursor: 'pointer',
            transition: 'all 0.2s ease', color: 'var(--text-primary)'
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'var(--accent-glow-lg)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
          }}
        >
          <Bot style={{ width: 15, height: 15, color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em' }}>Ask Evidence AI</span>
          <kbd style={{
            fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
            padding: '2px 6px', borderRadius: 5, background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)', color: 'var(--text-muted)'
          }}>⌘K</kbd>
        </button>
      )}

      {/* AI Chat Drawer (Quick Overlay) */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        onAskQuestion={handleAskQuestion}
        onSelectFile={(path) => {
          handleSelectFile(path);
          setActivePage('architecture');
        }}
        initialPrompt={chatInitialPrompt}
      />

      {/* Usage Analytics Modal */}
      {isAnalyticsOpen && (
        <AnalyticsModal
          onClose={() => setIsAnalyticsOpen(false)}
        />
      )}
    </div>
  );
};
