import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  FileCode, 
  GitCommit, 
  X,
  CornerDownLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { RAGAnswerResponse, EvidenceItem } from '../api/client';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAskQuestion: (question: string) => Promise<RAGAnswerResponse>;
  onSelectFile: (filePath: string) => void;
  initialPrompt?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  evidence?: EvidenceItem[];
  sources?: Record<string, number>;
  confidence?: number;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  onAskQuestion,
  onSelectFile,
  initialPrompt
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: (
        "Welcome to **CodeArchaeologist AI Assistant**.\n" +
        "I synthesize answers grounded strictly in your **AST Dependency Graph**, **Multi-Tier Call Chains**, and **Empirical Git History**.\n\n" +
        "Every claim cites verifiable source lines and commit hashes."
      )
    }
  ]);
  const [input, setInput] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);

  const suggestedPrompts = [
    "Why was Redis introduced?",
    "What caused the 2024 payment timeout bug?",
    "Which commits introduced security patches?",
    "What would be affected if paymentService.ts is modified?",
    "How does authentication token validation flow across tiers?",
    "Which components depend on UserService?"
  ];

  const handleSend = async (questionToSend?: string) => {
    const q = (questionToSend || input).trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);

    try {
      const response = await onAskQuestion(q);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          evidence: response.evidence,
          sources: response.retrieval_sources,
          confidence: response.confidence_score
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Synthesis error: ${err}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-y-0 right-0 w-full max-w-lg z-50 flex flex-col shadow-2xl select-none transition-colors"
      style={{
        background: 'var(--bg-panel-elevated)',
        borderLeft: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Drawer Header */}
      <div 
        className="h-12 px-4 flex items-center justify-between"
        style={{
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-hairline)'
        }}
      >
        <div className="flex items-center gap-2.5">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: 'var(--accent-primary)'
            }}
          >
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-xs font-mono flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              CodeArchaeologist Assistant
              <span 
                className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(99, 102, 241, 0.25)'
                }}
              >
                EVIDENCE RAG
              </span>
            </span>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="p-1 rounded-md transition-colors cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Inquiries */}
      <div 
        className="p-3"
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-hairline)'
        }}
      >
        <span 
          className="text-[10px] font-mono uppercase tracking-wider block mb-1.5 font-semibold"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Suggested Inquiries:
        </span>
        <div className="flex flex-wrap gap-1">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="text-[10.5px] px-2.5 py-1 rounded-md transition-all font-sans text-left cursor-pointer"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 select-text">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.role === 'user' ? (
              <div 
                className="max-w-[92%] rounded-xl p-3 text-xs leading-relaxed font-sans shadow-sm"
                style={{
                  background: 'var(--accent-primary)',
                  color: '#ffffff'
                }}
              >
                <div className="whitespace-pre-line space-y-1.5">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div 
                className="max-w-[94%] rounded-xl p-3 text-xs leading-relaxed font-sans shadow-sm"
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {/* Content */}
                <div className="whitespace-pre-line space-y-1.5 leading-relaxed">
                  {msg.content}
                </div>

                {/* Verifiable Evidence Drawer */}
                {msg.evidence && msg.evidence.length > 0 && (
                  <div 
                    className="mt-3 pt-2.5 space-y-2"
                    style={{ borderTop: '1px solid var(--border-hairline)' }}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span 
                        className="text-[10px] font-semibold flex items-center gap-1 uppercase tracking-wider"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                        Verifiable Archaeological Citations ({msg.evidence.length})
                      </span>
                      {msg.confidence && (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          Confidence: {Math.round(msg.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {msg.evidence.map((ev, eIdx) => (
                        <div
                          key={eIdx}
                          className="p-2.5 rounded-lg text-[11px] font-mono transition-colors"
                          style={{
                            background: 'var(--bg-app)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <button
                              onClick={() => onSelectFile(ev.file_path)}
                              className="font-bold hover:underline flex items-center gap-1.5 truncate text-left cursor-pointer"
                              style={{ color: 'var(--text-accent)' }}
                            >
                              <FileCode className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-teal)' }} />
                              <span className="truncate">{ev.file_path}</span>
                              {ev.line_start && (
                                <span style={{ color: 'var(--text-muted)' }} className="font-normal">
                                  :L{ev.line_start}–{ev.line_end}
                                </span>
                              )}
                            </button>

                            {ev.commit_hash && (
                              <span 
                                className="text-[9.5px] font-mono px-1.5 py-0.5 rounded shrink-0 font-medium"
                                style={{
                                  color: 'var(--accent-primary)',
                                  background: 'rgba(99, 102, 241, 0.12)',
                                  border: '1px solid rgba(99, 102, 241, 0.25)'
                                }}
                              >
                                {ev.commit_hash}
                              </span>
                            )}
                          </div>

                          {ev.commit_message && (
                            <div className="text-[10px] flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-secondary)' }}>
                              <GitCommit className="w-3 h-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
                              <span className="truncate">"{ev.commit_message}"</span>
                            </div>
                          )}

                          <p className="text-[10px] italic font-sans leading-tight" style={{ color: 'var(--text-muted)' }}>
                            {ev.relevance_reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-2 text-xs font-mono" style={{ color: 'var(--accent-primary)' }}>
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Consulting dependency graph & Git commit logs...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div 
        className="p-3"
        style={{
          background: 'var(--bg-panel)',
          borderTop: '1px solid var(--border-hairline)'
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about architecture, Redis, blast reach, payment..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-lg px-3 py-2 text-xs font-mono transition-colors focus:outline-none"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
            onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)')}
            onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)')}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-studio btn-studio-primary px-3 py-2 rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-50"
            style={{
              background: 'var(--accent-primary)',
              color: '#ffffff'
            }}
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
