/**
 * Oracle.jsx — Main ORACLE Copilot page.
 * Desktop: two-column (context panel 35% + conversation 65%)
 * Mobile: phone simulation frame, single column
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, LayoutDashboard, Search, Network, ShieldCheck, X } from 'lucide-react';

import ContextPanel from '@/components/oracle/ContextPanel';
import ConversationPanel from '@/components/oracle/ConversationPanel';
import QueryInputBar from '@/components/oracle/QueryInputBar';
import SourceModal from '@/components/oracle/SourceModal';
import QRScanner from '@/components/oracle/QRScanner';
import useNexusStore from '@/store/nexusStore';
import { searchQuery, getAssets } from '@/lib/api';

// Phone status bar — cosmetic
function PhoneStatusBar() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="flex items-center justify-between px-5 py-2 text-xs text-nexus-text flex-shrink-0">
      <span className="font-semibold">{time}</span>
      <div className="flex items-center gap-1.5">
        {/* Signal bars */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
          {[0,1,2,3].map((i) => (
            <rect key={i} x={i*4.5} y={12-(i+1)*3} width="3.5" height={(i+1)*3}
              rx="1" fill={i < 3 ? '#F1F5F9' : '#6B7280'} />
          ))}
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 9.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" fill="#F1F5F9"/>
          <path d="M4.5 7C5.8 5.8 6.8 5 8 5s2.2.8 3.5 2" stroke="#F1F5F9" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M2 4.5C3.8 2.8 5.8 2 8 2s4.2.8 6 2.5" stroke="#F1F5F9" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {/* Battery */}
        <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
          <rect x="0.5" y="1.5" width="18" height="9" rx="2" stroke="#F1F5F9" strokeWidth="1.2"/>
          <rect x="18.5" y="4" width="2.5" height="4" rx="1" fill="#F1F5F9"/>
          <rect x="2" y="3" width="12" height="6" rx="1" fill="#10B981"/>
        </svg>
      </div>
    </div>
  );
}

// Mobile bottom tab bar
function MobileTabBar({ navigate, setActivePage }) {
  const tabs = [
    { icon: LayoutDashboard, label: 'Home', route: '/', page: 'dashboard' },
    { icon: Search, label: 'ORACLE', route: '/oracle', page: 'oracle', active: true },
    { icon: Network, label: 'Graph', route: '/synapse', page: 'synapse' },
    { icon: ShieldCheck, label: 'Compliance', route: '/compliance', page: 'compliance' },
  ];
  return (
    <div className="flex items-center justify-around py-2 border-t border-nexus-border bg-nexus-surface flex-shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.route}
          onClick={() => { setActivePage(tab.page); navigate(tab.route); }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors
            ${tab.active ? 'text-nexus-primary' : 'text-nexus-muted'}`}
        >
          <tab.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

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
  const [viewMode, setViewMode] = useState('desktop');
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

  // Shared inner content (works for both desktop conversation column and mobile)
  const ConversationContent = (
    <div className="flex flex-col h-full">
      <AnimatePresence>
        {assetBanner && (
          <AssetBanner tag={assetBanner} onDismiss={() => setAssetBanner(null)} />
        )}
      </AnimatePresence>
      <div className="flex-1 overflow-hidden">
        <ConversationPanel
          viewMode={viewMode}
          onViewModeToggle={() => setViewMode((v) => v === 'desktop' ? 'mobile' : 'desktop')}
          onSourceClick={setActiveSource}
        />
      </div>
      <QueryInputBar
        onSubmit={handleSubmit}
        answerToSpeak={lastAnswer}
        onSpeakDone={() => setLastAnswer('')}
      />
    </div>
  );

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col -mt-6 -mx-6">

      {/* Top utility bar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-nexus-border flex-shrink-0 bg-nexus-surface/50">
        <span className="text-xs text-nexus-muted">
          {conversationHistory.filter(m => m.role === 'user').length} queries ·{' '}
          {viewMode === 'mobile' ? 'Mobile View — Field Technician Mode' : 'Desktop View'}
        </span>
        <div className="flex items-center gap-2">
          <QRScanner onAssetFromQR={handleAssetFromQR} />
          <button
            onClick={() => setViewMode((v) => v === 'desktop' ? 'mobile' : 'desktop')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-nexus-border
              text-nexus-muted hover:text-nexus-text hover:border-nexus-primary/40 text-xs transition-all"
          >
            {viewMode === 'desktop'
              ? <><Smartphone className="w-3.5 h-3.5" /> Mobile View</>
              : <><Monitor className="w-3.5 h-3.5" /> Desktop View</>
            }
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ────────────── DESKTOP LAYOUT ────────────── */}
          {viewMode === 'desktop' && (
            <motion.div
              key="desktop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full"
            >
              {/* Left: Context Panel (35%) */}
              <div className="w-[320px] flex-shrink-0 border-r border-nexus-border p-4 overflow-y-auto no-scrollbar">
                <ContextPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  onSuggestionClick={(q) => handleSubmit(q)}
                  safetyWarnings={safetyWarnings}
                  sessionStats={sessionStats}
                />
              </div>

              {/* Right: Conversation Panel (65%) */}
              <div className="flex-1 overflow-hidden">
                {ConversationContent}
              </div>
            </motion.div>
          )}

          {/* ────────────── MOBILE LAYOUT ────────────── */}
          {viewMode === 'mobile' && (
            <motion.div
              key="mobile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-center h-full py-4"
              style={{ background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.06) 0%, transparent 70%)' }}
            >
              {/* Phone frame */}
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="flex flex-col overflow-hidden"
                style={{
                  width: 390,
                  height: 780,
                  borderRadius: 36,
                  border: '2px solid #1E1E2E',
                  boxShadow: '0 0 60px rgba(79,70,229,0.2), 0 30px 60px rgba(0,0,0,0.5)',
                  background: '#0A0A0F',
                  position: 'relative',
                }}
              >
                {/* Status bar */}
                <PhoneStatusBar />

                {/* Conversation fills phone */}
                <div className="flex-1 overflow-hidden flex flex-col" style={{ fontSize: '16px' }}>
                  <AnimatePresence>
                    {assetBanner && (
                      <AssetBanner tag={assetBanner} onDismiss={() => setAssetBanner(null)} />
                    )}
                  </AnimatePresence>
                  <div className="flex-1 overflow-hidden">
                    <ConversationPanel
                      viewMode={viewMode}
                      onViewModeToggle={() => setViewMode('desktop')}
                      onSourceClick={setActiveSource}
                    />
                  </div>
                  <QueryInputBar
                    onSubmit={handleSubmit}
                    answerToSpeak={lastAnswer}
                    onSpeakDone={() => setLastAnswer('')}
                  />
                </div>

                {/* Mobile bottom tab bar */}
                <MobileTabBar navigate={navigate} setActivePage={setActivePage} />

                {/* Notch decoration */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 rounded-b-2xl"
                  style={{ background: '#0A0A0F', border: '2px solid #1E1E2E', borderTop: 'none' }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
