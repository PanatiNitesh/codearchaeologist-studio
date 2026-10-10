import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  FileCode2, 
  GitCommit, 
  Loader2, 
  CheckCircle2, 
  ExternalLink,
  Trash2
} from 'lucide-react';
import { 
  RAGAnswerResponse, 
  EvidenceItem, 
  api 
} from '../api/client';

interface AssistantPageProps {
  repoId: string;
  onAskQuestion?: (question: string) => Promise<RAGAnswerResponse>;
  onSelectFile: (path: string) => void;
  initialPrompt?: string;
}

export const AssistantPage: React.FC<AssistantPageProps> = ({ 
  repoId, 
  onAskQuestion, 
  onSelectFile,
  initialPrompt 
}) => {
  const [question, setQuestion] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);

  // Persist conversation across tab switches via localStorage
  const [conversation, setConversation] = useState<Array<{ q: string; response: RAGAnswerResponse }>>(() => {
    try {
      const saved = localStorage.getItem(`ca_chat_history_${repoId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Re-sync conversation when active repository switches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ca_chat_history_${repoId}`);
      setConversation(saved ? JSON.parse(saved) : []);
    } catch {
      setConversation([]);
    }
  }, [repoId]);

  // Persist whenever a new message is added
  useEffect(() => {
    try {
      if (conversation.length > 0) {
        localStorage.setItem(`ca_chat_history_${repoId}`, JSON.stringify(conversation));
      }
    } catch (e) {
      console.warn('Failed to save chat to localStorage', e);
    }
  }, [conversation, repoId]);

  const handleClearHistory = () => {
    setConversation([]);
    try {
      localStorage.removeItem(`ca_chat_history_${repoId}`);
    } catch {}
  };

  // Context-aware queries tailored to the active repository
  const isEcommerce = repoId.toLowerCase().includes("ecommerce");
  const presetQueries = isEcommerce ? [
    "Why was paymentService refactored and what dependencies were introduced?",
    "What are the downstream consumers and blast radius of authService?",
    "Which commits introduced security or token verification patches?",
    "How does the database connection pool handle high concurrency?"
  ] : [
    "Explain the core architectural components and pipeline layers in this project.",
    "Which files and services have the highest dependency coupling?",
    "What recent changes or Git milestones had the highest impact?",
    "What is the blast radius and downstream effect of modifying the core component?"
  ];

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q || !repoId) return;

    setLoading(true);
    setQuestion('');
    try {
      const res = onAskQuestion ? await onAskQuestion(q) : await api.askAI(repoId, q);
      setConversation(prev => {
        const next = [...prev, { q, response: res }];
        try {
          localStorage.setItem(`ca_chat_history_${repoId}`, JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      console.error('AI query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full animate-fade-in flex flex-col h-full text-[var(--text-primary)]">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-sky-50/50 to-indigo-50/90 dark:from-slate-900 dark:via-cyan-950/40 dark:to-slate-900 border border-indigo-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-cyan-500/10 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500/20">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Evidence-Grounded AI Software Assistant
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Hybrid Dense Neural + BM25 Lexical RAG with strict verifiable file lines & Git commit citations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {conversation.length > 0 && (
            <button
              onClick={handleClearHistory}
              title="Clear chat history"
              className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-red-500 font-mono px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] hover:border-red-300 dark:hover:border-red-900 bg-[var(--bg-card)] transition-colors cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 dark:bg-cyan-950/50 dark:text-cyan-400 font-mono px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-cyan-800/50 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Hallucinations</span>
          </div>
        </div>
      </div>

      {/* Preset Suggestions */}
      {conversation.length === 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Sample Grounded Queries:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {presetQueries.map((pq, i) => (
              <button
                key={i}
                onClick={() => handleAsk(pq)}
                className="p-3.5 text-left rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] hover:border-indigo-400 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-sm"
              >
                {pq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation Thread */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {conversation.map((item, idx) => (
          <div key={idx} className="space-y-3 animate-fade-in">
            {/* User Question */}
            <div className="flex items-start gap-3 justify-end">
              <div className="p-3.5 rounded-2xl bg-indigo-600 text-white text-xs max-w-xl shadow-sm leading-relaxed">
                {item.q}
              </div>
            </div>

            {/* AI Grounded Response */}
            <div className="flex items-start gap-3 justify-start">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0 mt-1 border border-indigo-200 dark:border-indigo-800">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-3 shadow-sm">
                <div className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                  {item.response.answer}
                </div>

                {/* Evidence Citations */}
                {((item.response.evidence_used || item.response.evidence || []).length > 0) && (
                  <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2">
                    <div className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified Code Citations ({(item.response.evidence_used || item.response.evidence || []).length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(item.response.evidence_used || item.response.evidence || []).map((ev, evIdx) => (
                        <button
                          key={evIdx}
                          onClick={() => onSelectFile(ev.file_path)}
                          className="px-2.5 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-hairline)] text-[11px] font-mono text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                        >
                          <FileCode2 className="w-3 h-3 text-indigo-600" />
                          <span>{ev.file_path}:{ev.line_start || 1}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] text-xs text-[var(--text-tertiary)] font-mono animate-pulse shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Traversing AST symbol graph & retrieving commit archaeology evidence...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="relative mt-auto pt-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about architecture, historical refactors, or blast radius..."
          className="w-full bg-[var(--bg-card)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-xs rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:border-indigo-500 shadow-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="absolute right-2 top-4 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
