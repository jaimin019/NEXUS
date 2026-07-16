/**
 * ContextPanel — Left panel with filters, suggestions, and safety context.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Lightbulb, AlertTriangle, ChevronRight, X, Info } from 'lucide-react';
import useNexusStore from '@/store/nexusStore';
import { getQuerySuggestions } from '@/lib/api';

const DOC_TYPES = [
  { id: 'SOP', color: 'bg-indigo-500' },
  { id: 'WorkOrder', color: 'bg-amber-500' },
  { id: 'Regulation', color: 'bg-purple-500' },
  { id: 'IncidentReport', color: 'bg-red-500' },
  { id: 'ExpertInterview', color: 'bg-emerald-500' },
  { id: 'OEMManual', color: 'bg-cyan-500' },
];

const SUGGESTION_ICONS = ['🔧', '⚠️', '📋', '🛡️', '🔍', '📊'];

export default function ContextPanel({ filters, onFiltersChange, onSuggestionClick, safetyWarnings = [], sessionStats }) {
  const { assets } = useNexusStore();
  const [suggestions, setSuggestions] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tagDropdown, setTagDropdown] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const tagRef = useRef(null);

  useEffect(() => {
    getQuerySuggestions().then(({ data }) => {
      if (data?.suggestions) setSuggestions(data.suggestions);
    });
  }, []);

  // Tag autocomplete
  const handleTagInput = (val) => {
    setTagInput(val);
    if (val.length < 1) { setTagDropdown([]); return; }
    const matches = assets
      .filter((a) => a.tag.toLowerCase().includes(val.toLowerCase()) || a.name?.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 6);
    setTagDropdown(matches);
  };

  const addTag = (tag) => {
    if (!filters.equipment_tags.includes(tag)) {
      onFiltersChange({ ...filters, equipment_tags: [...filters.equipment_tags, tag] });
    }
    setTagInput('');
    setTagDropdown([]);
  };

  const removeTag = (tag) => {
    onFiltersChange({ ...filters, equipment_tags: filters.equipment_tags.filter((t) => t !== tag) });
  };

  const toggleDocType = (type) => {
    const curr = filters.doc_types || [];
    const next = curr.includes(type) ? curr.filter((t) => t !== type) : [...curr, type];
    onFiltersChange({ ...filters, doc_types: next });
  };

  const clearAll = () => {
    onFiltersChange({ equipment_tags: [], doc_types: [], tacit: false });
    setTagInput('');
    setTagDropdown([]);
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto no-scrollbar">

      {/* Section A — Query Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-nexus-primary" />
            <h3 className="text-sm font-semibold text-nexus-text">Search Context</h3>
          </div>
          <button onClick={clearAll} className="text-xs text-nexus-muted hover:text-nexus-primary transition-colors">
            Clear All
          </button>
        </div>

        {/* Equipment tag input */}
        <div className="mb-3">
          <label className="text-xs text-nexus-muted mb-1.5 block">Equipment Tags</label>
          <div className="relative" ref={tagRef}>
            <input
              value={tagInput}
              onChange={(e) => handleTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput) addTag(tagInput.toUpperCase());
              }}
              placeholder="Type to search assets…"
              className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-3 py-1.5 text-xs text-nexus-text
                placeholder:text-nexus-muted focus:outline-none focus:border-nexus-primary transition-colors"
            />
            <AnimatePresence>
              {tagDropdown.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full mt-1 left-0 right-0 glass-card border border-nexus-border rounded-lg overflow-hidden z-20 shadow-xl"
                >
                  {tagDropdown.map((a) => (
                    <button
                      key={a.tag}
                      onClick={() => addTag(a.tag)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-nexus-primary/10 text-left transition-colors"
                    >
                      <span className="text-xs font-mono text-nexus-accent font-medium">{a.tag}</span>
                      <span className="text-xs text-nexus-textMuted truncate">{a.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selected tags */}
          {filters.equipment_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {filters.equipment_tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                  bg-nexus-primary/15 border border-nexus-primary/30 text-nexus-primary font-mono">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-nexus-text ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Doc type checkboxes */}
        <div className="mb-3">
          <label className="text-xs text-nexus-muted mb-1.5 block">Document Type</label>
          <div className="space-y-1.5">
            {DOC_TYPES.map((type) => (
              <label key={type.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={(filters.doc_types || []).includes(type.id)}
                  onChange={() => toggleDocType(type.id)}
                  className="accent-nexus-primary rounded"
                />
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${type.color}`} />
                <span className="text-xs text-nexus-textMuted group-hover:text-nexus-text transition-colors">{type.id}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Expert knowledge toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-nexus-border">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-nexus-textMuted">Include Expert Knowledge</span>
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-nexus-muted hover:text-nexus-text"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-0 bottom-full mb-1.5 w-56 glass-card border border-nexus-border
                      rounded-lg p-2.5 text-xs text-nexus-textMuted z-30 shadow-xl"
                  >
                    Includes undocumented knowledge captured from retiring engineers.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <button
            onClick={() => onFiltersChange({ ...filters, tacit: !filters.tacit })}
            className={`w-9 h-5 rounded-full transition-all duration-300 relative flex-shrink-0
              ${filters.tacit ? 'bg-nexus-primary' : 'bg-nexus-border'}`}
          >
            <motion.div
              animate={{ x: filters.tacit ? 16 : 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
            />
          </button>
        </div>
      </div>

      {/* Section B — Suggested Queries */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-nexus-warning" />
          <h3 className="text-sm font-semibold text-nexus-text">Suggested Queries</h3>
        </div>
        <div className="space-y-1.5">
          {(suggestions.length > 0 ? suggestions : [
            'Isolation procedure for HX-204',
            'Recent failures on centrifugal pumps',
            'What SOPs apply to Unit 3?',
            'Explain hot work permit process',
            'Open compliance gaps for OISD-GDN-206',
            'What did last inspection of P-101 find?',
          ]).map((q, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSuggestionClick(q)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left
                hover:bg-nexus-primary/8 border border-transparent hover:border-nexus-primary/20
                transition-all duration-150 group"
            >
              <span className="text-base flex-shrink-0">{SUGGESTION_ICONS[i % SUGGESTION_ICONS.length]}</span>
              <span className="text-xs text-nexus-textMuted group-hover:text-nexus-text transition-colors flex-1 leading-snug">
                {q}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-nexus-muted group-hover:text-nexus-primary opacity-0 group-hover:opacity-100 transition-all" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Section C — Active Safety Context */}
      <AnimatePresence>
        {safetyWarnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl p-4 border border-red-500/30"
            style={{ background: 'rgba(239,68,68,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-red-300">Active Safety Context</h3>
            </div>
            <div className="space-y-1.5 mb-2">
              {safetyWarnings.map((w, i) => (
                <div key={i} className="text-xs text-red-200/80 flex items-start gap-1.5">
                  <span className="text-red-400 font-mono font-medium mt-0.5 flex-shrink-0">{w.tag}</span>
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-red-400/70 italic">
              This context will be prepended to your next query answer.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section D — Session Stats */}
      {sessionStats && (
        <div className="px-1 pb-1">
          <p className="text-xs text-nexus-muted leading-relaxed">
            {sessionStats.queries} quer{sessionStats.queries !== 1 ? 'ies' : 'y'} this session
            {sessionStats.sources > 0 && ` · ${sessionStats.sources} sources retrieved`}
            {sessionStats.avgMs > 0 && ` · ${sessionStats.avgMs}ms avg response`}
          </p>
        </div>
      )}
    </div>
  );
}
