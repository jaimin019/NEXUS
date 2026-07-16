/**
 * SourceModal — Displays full chunk text for a retrieved source.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

function highlightTags(text, tags = []) {
  if (!tags.length) return text;
  // Escape regex special chars
  const escaped = tags.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="text-nexus-accent underline decoration-nexus-primary/50 font-medium">
        {part}
      </span>
    ) : part
  );
}

export default function SourceModal({ source, onClose }) {
  if (!source) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-nexus-border flex-shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <StatusBadge value={source.doc_type} type="doc_type" />
                {(source.equipment_tags || []).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-nexus-primary/15
                    border border-nexus-primary/30 text-nexus-primary font-mono">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-sm font-semibold text-nexus-text truncate">
                {source.section_header || 'Document Chunk'}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-nexus-muted">
                {source.page_number && <span>Page {source.page_number}</span>}
                {source.confidence_score && (
                  <span>Confidence: {(source.confidence_score * 100).toFixed(0)}%</span>
                )}
                {source.rrf_score && (
                  <span>Relevance: {(source.rrf_score * 100).toFixed(1)}</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-3 p-1.5 rounded-lg hover:bg-white/5 text-nexus-muted hover:text-nexus-text transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body — raw text */}
          <div className="flex-1 overflow-y-auto p-5">
            <div
              className="text-sm leading-relaxed font-mono rounded-lg p-4 whitespace-pre-wrap"
              style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.12)' }}
            >
              <span className="text-nexus-text">
                {highlightTags(source.raw_text || source.text || 'No text available.', source.equipment_tags || [])}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-3 border-t border-nexus-border flex-shrink-0 text-xs text-nexus-muted">
            <FileText className="w-3.5 h-3.5" />
            {source.doc_id ? (
              <span>Document ID: <span className="font-mono text-nexus-textMuted">{source.doc_id?.toString?.()?.slice(-8)}</span></span>
            ) : (
              <span>Source document unavailable</span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
