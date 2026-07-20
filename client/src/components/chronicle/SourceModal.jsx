import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Bot, Calendar, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SourceModal({ pattern, onClose }) {
  const navigate = useNavigate();
  if (!pattern) return null;

  const incidents = pattern.source_incidents || [];
  const equipmentType = pattern.equipment_type || 'Asset';
  const failureMode = pattern.failure_mode || 'Failure Pattern';

  const handleOpenInOracle = (doc) => {
    // Extract first equipment tag or default based on equipment_type
    let tag = 'P-101';
    if (Array.isArray(doc.equipment_tags) && doc.equipment_tags.length > 0) {
      tag = doc.equipment_tags[0];
    } else if (equipmentType.toLowerCase().includes('pump')) {
      tag = 'P-101';
    } else if (equipmentType.toLowerCase().includes('exchanger') || equipmentType.toLowerCase().includes('hx')) {
      tag = 'HX-204';
    } else if (equipmentType.toLowerCase().includes('valve') || equipmentType.toLowerCase().includes('v-')) {
      tag = 'V-302';
    }

    onClose();
    navigate(`/oracle?asset=${tag}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="card w-full max-w-2xl border border-nexus-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] bg-nexus-surface"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-nexus-border flex items-center justify-between bg-white/[0.02] flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-nexus-textMuted border border-purple-500/30">
                  {equipmentType}
                </span>
                <span className="text-xs text-nexus-textMuted">· Source Incidents</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {failureMode}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-nexus-textMuted hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto no-scrollbar space-y-3 flex-1">
            <p className="text-xs text-nexus-textMuted mb-4 leading-relaxed">
              These historical incident reports, maintenance work orders, and inspection records were analyzed by CHRONICLE to synthesize this recurrence signature:
            </p>

            {incidents.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-nexus-border rounded-xl text-nexus-textMuted text-xs">
                No detailed document references attached to this historical signature yet.
              </div>
            ) : (
              incidents.map((doc, idx) => {
                const title = doc.title || doc.filename || `Incident Report #${idx + 1}`;
                const docType = doc.doc_type || 'IncidentReport';
                const dateStr = doc.uploaded_at || doc.created_at
                  ? new Date(doc.uploaded_at || doc.created_at).toLocaleDateString()
                  : 'Historical Record';

                const badgeColor =
                  docType === 'IncidentReport' ? 'bg-[#B87070]/10 text-[#B87070] border-[#B87070]/30' :
                  docType === 'WorkOrder' ? 'bg-[#C4A882]/10 text-[#C4A882] border-[#C4A882]/30' :
                  'bg-[#C49A3C]/10 text-[#C49A3C] border-[#C49A3C]/30';

                return (
                  <div
                    key={doc._id || idx}
                    className="card p-4 border border-nexus-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-nexus-primary/40 transition-all bg-white/[0.01]"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-white/5 border border-nexus-border flex-shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-nexus-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-white text-xs truncate max-w-[260px]" title={title}>
                            {title}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor}`}>
                            {docType}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-nexus-textMuted">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dateStr}
                          </span>
                          {Array.isArray(doc.equipment_tags) && doc.equipment_tags.length > 0 && (
                            <span className="font-mono text-nexus-accent">
                              Tags: {doc.equipment_tags.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenInOracle(doc)}
                      className="px-3 py-2 rounded-xl bg-nexus-primary/10 hover:bg-nexus-primary/20 border border-nexus-primary/30 text-nexus-primary hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all flex-shrink-0"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Open in ORACLE</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-nexus-border bg-white/[0.02] flex justify-end flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-nexus-text transition-colors"
            >
              Close Window
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
