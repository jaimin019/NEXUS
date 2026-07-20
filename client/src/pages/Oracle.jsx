/**
 * Oracle.jsx — Main ORACLE Copilot page.
 * Desktop: two-column (context panel 35% + conversation 65%)
 * Mobile: phone simulation frame, single column
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import ContextPanel from '@/components/oracle/ContextPanel';
import ConversationPanel from '@/components/oracle/ConversationPanel';
import QueryInputBar from '@/components/oracle/QueryInputBar';
import SourceModal from '@/components/oracle/SourceModal';
import useNexusStore from '@/store/nexusStore';
import { searchQuery, getAssets } from '@/lib/api';

// Asset banner
function AssetBanner({ tag, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-2 px-4 py-2 bg-nexus-primary/10 border-b border-nexus-primary/20 flex-shrink-0"
    >
      <span className="text-xs text-nexus-primary">
        Showing context for asset <span className="font-mono font-semibold">{tag}</span>
      </span>
      <button onClick={onDismiss} className="ml-auto text-nexus-muted hover:text-nexus-text">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default function Oracle() {
    const [filters, setFilters] = useState({ equipment_tags: [], doc_types: [], tacit: false });
  const [activeSource, setActiveSource] = useState(null);
  const [lastAnswer, setLastAnswer] = useState('');
  const [assetBanner, setAssetBanner] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionRef = useRef({ queries: 0, sources: 0, totalMs: 0 });
  const [sessionStats, setSessionStats] = useState({ queries: 0, sources: 0, avgMs: 0 });

  const {
    addMessage, setIsQuerying, isQuerying, conversationHistory,
    assets, setAssets, setActivePage,
  } = useNexusStore();

  // Load assets for tag autocomplete
  useEffect(() => {
    if (!assets.length) {
      getAssets().then(({ data }) => { if (data?.assets) setAssets(data.assets); });
    }
  }, []);

  // URL param: ?asset=TAG
  useEffect(() => {
    const tag = searchParams.get('asset');
    if (tag) {
      setAssetBanner(tag);
      setFilters((f) => ({ ...f, equipment_tags: [tag.toUpperCase()] }));
      // Auto-run query
      setTimeout(() => {
        handleSubmit(`Show me all documentation and recent work orders for ${tag.toUpperCase()}`);
      }, 600);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const handleSubmit = useCallback(async (queryText) => {
    if (!queryText?.trim() || isQuerying) return;

    // Build filters for API
    const apiFilters = {};
    if (filters.equipment_tags.length) apiFilters.equipment_tags = filters.equipment_tags;
    if (filters.doc_types.length) apiFilters.doc_type = filters.doc_types[0]; // primary type
    if (filters.tacit) apiFilters.is_tacit_knowledge = true;

    // Last 4 turns for context
    const history = conversationHistory.slice(-4).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add user message
    addMessage({ role: 'user', content: queryText });
    setIsQuerying(true);

    const t0 = Date.now();
    const { data, error } = await searchQuery(queryText, apiFilters, history);
    const elapsed = Date.now() - t0;

    setIsQuerying(false);

    if (error) {
      addMessage({
        role: 'assistant',
        content: `Error: ${error}. Please check your connection and try again.`,
        sources: [],
        queryTime: elapsed,
        chunksRetrieved: 0,
      });
      return;
    }

    const answer = data.answer || 'No answer generated.';
    setLastAnswer(answer);

    addMessage({
      role: 'assistant',
      content: answer,
      sources: data.sources || [],
      failureAlert: data.failureAlert || null,
      safetyWarnings: data.safetyWarnings || [],
      model: data.model,
      queryTime: data.queryTime || elapsed,
      chunksRetrieved: data.chunksRetrieved || 0,
    });

    // Update session stats
    const s = sessionRef.current;
    s.queries++;
    s.sources += (data.sources || []).length;
    s.totalMs += data.queryTime || elapsed;
    setSessionStats({
      queries: s.queries,
      sources: s.sources,
      avgMs: Math.round(s.totalMs / s.queries),
    });
  }, [isQuerying, filters, conversationHistory, addMessage, setIsQuerying]);

  const handleAssetFromQR = (tag) => {
    setAssetBanner(tag);
    setFilters((f) => ({ ...f, equipment_tags: [tag.toUpperCase()] }));
    setTimeout(() => handleSubmit(`Show all documentation for ${tag.toUpperCase()}`), 300);
  };

  // Current safety warnings from last assistant message
  const lastAssistant = [...conversationHistory].reverse().find((m) => m.role === 'assistant');
  const safetyWarnings = lastAssistant?.safetyWarnings || [];

  
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col -mt-6 -mx-6" style={{ background: "#F5F0E8", display: "flex", height: "100%" }}>

      

      
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left: Context Panel (hidden on small screens) */}
          <div className="hidden md:block w-[320px] flex-shrink-0 border-r border-nexus-border p-4 overflow-y-auto no-scrollbar">
            <ContextPanel
              filters={filters}
              onFiltersChange={setFilters}
              onSuggestionClick={(q) => handleSubmit(q)}
              safetyWarnings={safetyWarnings}
              sessionStats={sessionStats}
            />
          </div>

          {/* Right: Conversation Panel */}
          <div className="flex-1 overflow-hidden">
            <div className="flex flex-col h-full">
              <AnimatePresence>
                {assetBanner && (
                  <AssetBanner tag={assetBanner} onDismiss={() => setAssetBanner(null)} />
                )}
              </AnimatePresence>
              <div className="flex-1 overflow-hidden">
                <ConversationPanel
                  onSourceClick={setActiveSource}
                />
              </div>
              <QueryInputBar
                onSubmit={handleSubmit}
                answerToSpeak={lastAnswer}
                onSpeakDone={() => setLastAnswer('')}
              />
            </div>
          </div>
        </div>
      </div>


      {/* Source Detail Modal */}
      <AnimatePresence>
        {activeSource && (
          <SourceModal source={activeSource} onClose={() => setActiveSource(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
