/**
 * ConversationPanel — Chat messages, empty state, and message rendering.
 */
import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, RotateCcw, Monitor, Smartphone, ChevronDown, ChevronUp,
  Activity, AlertTriangle, Clock, Layers, ExternalLink
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import SourceModal from './SourceModal';
import useNexusStore from '@/store/nexusStore';

// Animated hex SVG for empty state
function HexIcon() {
  return (
    <motion.svg
      width="72" height="72" viewBox="0 0 72 72"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      <path d="M36 4L68 22V58L36 76L4 58V22L36 4Z" fill="url(#hg)" opacity="0.9" />
      <path d="M36 16L58 28.5V53.5L36 66L14 53.5V28.5L36 16Z" fill="#0A0A0F" opacity="0.7" />
      <circle cx="36" cy="36" r="8" fill="#06B6D4" />
      <defs>
        <linearGradient id="hg" x1="4" y1="4" x2="68" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" /><stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-nexus-primary/20 border border-nexus-primary/30 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-nexus-primary" />
      </div>
      <div className="glass-card px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-nexus-primary rounded-full"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Render answer with markdown-like formatting
function AnswerText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];

  const flushList = (key) => {
    if (listBuffer.length) {
      elements.push(
        <ol key={`list-${key}`} className="list-decimal list-inside space-y-1 my-2 text-nexus-text text-sm leading-relaxed">
          {listBuffer.map((item, i) => (
            <li key={i} className="text-nexus-textMuted">
              <span className="text-nexus-text">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, idx) => {
    const numberedMatch = line.match(/^(\d+)[.)]\s+(.*)/);
    const isWarning = line.startsWith('WARNING:');

    if (numberedMatch) {
      listBuffer.push(numberedMatch[2]);
    } else {
      flushList(idx);
      if (isWarning) {
        elements.push(
          <div key={idx} className="flex items-start gap-2 my-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-300">{line.replace('WARNING:', '').trim()}</span>
          </div>
        );
      } else if (line.trim()) {
        elements.push(
          <p key={idx} className="text-sm text-nexus-text leading-relaxed mb-1.5">
            {renderInline(line)}
          </p>
        );
      }
    }
  });
  flushList('end');
  return <div>{elements}</div>;
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[SOURCE \d+\])/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i} className="font-semibold text-nexus-text">{part.slice(2, -2)}</strong>;
    }
    if (/^\[SOURCE \d+\]$/.test(part)) {
      return <span key={i} className="text-xs font-mono bg-nexus-primary/15 text-nexus-primary px-1 py-0.5 rounded">{part}</span>;
    }
    return part;
  });
}

// Single assistant message
function AssistantMessage({ msg, onSourceClick }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const hasSources = (msg.sources || []).length > 0;
  const hasFailureAlert = !!msg.failureAlert;
  const hasSafetyWarnings = (msg.safetyWarnings || []).length > 0;

  return (
    <div className="flex items-end gap-3 mb-5">
      <motion.div
        animate={{ boxShadow: ['0 0 0px rgba(79,70,229,0)', '0 0 12px rgba(79,70,229,0.3)', '0 0 0px rgba(79,70,229,0)'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-7 h-7 rounded-full bg-nexus-primary/20 border border-nexus-primary/30 flex items-center justify-center flex-shrink-0 mb-1"
      >
        <Bot className="w-4 h-4 text-nexus-primary" />
      </motion.div>

      <div className="flex-1 max-w-[85%]">
        <div className="glass-card p-4">
          {/* Safety warnings */}
          {hasSafetyWarnings && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-semibold text-red-300">Safety Warning</span>
              </div>
              {msg.safetyWarnings.map((w, i) => (
                <p key={i} className="text-xs text-red-200/80">{w.message || JSON.stringify(w)}</p>
              ))}
            </div>
          )}

          {/* Failure alert */}
          {hasFailureAlert && (
            <div className="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-300">Failure Pattern Detected</span>
                <span className="ml-auto text-xs text-amber-400">
                  {((msg.failureAlert.similarity_score || 0) * 100).toFixed(0)}% match
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mb-1">{msg.failureAlert.message}</p>
              {msg.failureAlert.recommended_action && (
                <p className="text-xs text-amber-300/70 italic">{msg.failureAlert.recommended_action}</p>
              )}
            </div>
          )}

          {/* Answer */}
          <AnswerText text={msg.content} />

          {/* Sources */}
          {hasSources && (
            <div className="mt-3 pt-3 border-t border-nexus-border">
              <button
                onClick={() => setSourcesOpen((o) => !o)}
                className="flex items-center gap-1.5 text-xs text-nexus-muted hover:text-nexus-text transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                {msg.sources.length} Source{msg.sources.length !== 1 ? 's' : ''}
                {sourcesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <AnimatePresence>
                {sourcesOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1.5"
                  >
                    {msg.sources.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => onSourceClick(src)}
                        className="w-full flex items-start gap-2 p-2 rounded-lg bg-nexus-bg
                          border border-nexus-border hover:border-nexus-primary/40 text-left transition-all group"
                      >
                        <StatusBadge value={src.doc_type} type="doc_type" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-nexus-textMuted truncate">
                            {src.section_header || 'Section'}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {(src.equipment_tags || []).map((t) => (
                              <span key={t} className="text-[10px] font-mono text-nexus-accent">{t}</span>
                            ))}
                          </div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-nexus-muted group-hover:text-nexus-primary opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-all" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer metadata */}
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-[10px] text-nexus-muted">{msg.model || 'llama-3.3-70b via Groq'}</span>
          {msg.queryTime && <span className="text-[10px] text-nexus-muted">{msg.queryTime}ms</span>}
          {msg.chunksRetrieved !== undefined && (
            <span className="text-[10px] text-nexus-muted">{msg.chunksRetrieved} chunks</span>
          )}
          {msg.timestamp && (
            <span className="text-[10px] text-nexus-muted ml-auto">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// User message bubble
function UserMessage({ msg }) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[75%]">
        <div className="bg-nexus-primary rounded-2xl rounded-br-sm px-4 py-2.5">
          <p className="text-sm text-white">{msg.content}</p>
        </div>
        <p className="text-[10px] text-nexus-muted mt-1 text-right">
          {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function ConversationPanel({ onSourceClick }) {
  const { conversationHistory, isQuerying, clearConversation } = useNexusStore();
  const bottomRef = useRef(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, isQuerying]);

  const handleClear = () => {
    if (confirmClear) { clearConversation(); setConfirmClear(false); }
    else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); }
  };

  const FEATURED_QUERIES = [
    'Isolation procedure for HX-204',
    'Recent failures on P-101',
    'Open compliance gaps',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-nexus-border flex-shrink-0">
        <motion.div
          animate={{ boxShadow: ['0 0 0px rgba(79,70,229,0)', '0 0 16px rgba(79,70,229,0.35)', '0 0 0px rgba(79,70,229,0)'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="p-1.5 rounded-lg bg-nexus-primary/15 border border-nexus-primary/30"
        >
          <Bot className="w-4 h-4 text-nexus-primary" />
        </motion.div>
        <span className="text-sm font-semibold text-nexus-text">ORACLE</span>
        <span className="text-xs text-nexus-muted">Industrial AI Copilot</span>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* New Conversation */}
          <button
            onClick={handleClear}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all
              ${confirmClear
                ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                : 'border border-nexus-border text-nexus-muted hover:text-nexus-text hover:border-nexus-primary/40'}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {confirmClear ? 'Confirm?' : 'New'}
          </button>

          {/* View toggle */}
          {onViewModeToggle && (
            <button
              onClick={onViewModeToggle}
              className="p-1.5 rounded-lg border border-nexus-border text-nexus-muted hover:text-nexus-text hover:border-nexus-primary/40 transition-all"
              title={viewMode === 'desktop' ? 'Switch to mobile view' : 'Switch to desktop view'}
            >
              {viewMode === 'desktop' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {conversationHistory.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center h-full text-center px-6 pb-8"
          >
            <HexIcon />
            <h2 className="gradient-text text-2xl font-bold mt-5 mb-2">ORACLE Industrial Copilot</h2>
            <p className="text-sm text-nexus-textMuted max-w-sm leading-relaxed mb-6">
              Query your plant's collective knowledge. Ask about procedures, equipment history,
              compliance, or failure patterns.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {FEATURED_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => {/* handled by parent via ref */}}
                  className="px-3 py-1.5 rounded-full text-xs border border-nexus-primary/30
                    bg-nexus-primary/8 text-nexus-primary hover:bg-nexus-primary/15 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {conversationHistory.map((msg, i) =>
              msg.role === 'user' ? (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <UserMessage msg={msg} />
                </motion.div>
              ) : (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <AssistantMessage msg={msg} onSourceClick={onSourceClick} />
                </motion.div>
              )
            )}
          </AnimatePresence>
        )}

        {/* Typing indicator */}
        {isQuerying && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
