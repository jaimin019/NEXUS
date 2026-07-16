import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, AlertTriangle, ArrowRight, Bot, Activity,
  FileText, ShieldAlert, CheckCircle2, TrendingUp,
  TrendingDown, Minus, Network, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Circular Progress Ring (Pure SVG)
function CircularProgressRing({ completeness = 0 }) {
  const pct = Math.round(Math.min(Math.max(completeness, 0), 1) * 100);
  const radius = 44;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  let color = '#EF4444'; // red
  if (pct > 70) color = '#10B981'; // green
  else if (pct >= 40) color = '#F59E0B'; // amber

  return (
    <div className="relative flex flex-col items-center justify-center py-3">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        {/* Background Track circle */}
        <circle
          stroke="#1E1E2E"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s ease-in-out' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-mono font-extrabold text-white">{pct}%</span>
        <span className="text-[10px] uppercase tracking-wider text-nexus-textMuted font-semibold">Completeness</span>
      </div>
    </div>
  );
}

export default function AssetDetailPanel({ selectedAsset, onClose, onSelectTag }) {
  const navigate = useNavigate();

  // If nothing selected, render empty state
  if (!selectedAsset) {
    return (
      <div className="w-full h-full bg-nexus-surface border-l border-nexus-border p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-nexus-primary/10 border border-nexus-primary/20 flex items-center justify-center mb-4 shadow-xl">
          <Network className="w-8 h-8 text-nexus-primary animate-pulse" />
        </div>
        <h3 className="gradient-text text-lg font-bold mb-2 max-w-[260px]">
          Select an asset to explore its knowledge network
        </h3>
        <p className="text-xs text-nexus-textMuted mb-6 max-w-[280px]">
          Click any D3 node on the canvas to inspect real-time health, regulatory compliance, relationships, and RAG knowledge.
        </p>
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-nexus-textMuted uppercase tracking-wider block">
            Example Assets:
          </span>
          <div className="flex items-center justify-center gap-2">
            {['P-101', 'HX-204', 'V-302'].map((tag) => (
              <button
                key={tag}
                onClick={() => onSelectTag && onSelectTag(tag)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-nexus-border text-xs font-mono font-medium text-nexus-text hover:text-white hover:border-nexus-primary/50 hover:bg-nexus-primary/10 transition-all shadow-sm"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Extract / synthesize properties safely
  const tag = selectedAsset.tag || selectedAsset.id || 'UNKNOWN';
  const name = selectedAsset.name || `Equipment ${tag}`;
  const type = selectedAsset.asset_type || selectedAsset.type || 'Equipment';
  const criticality = selectedAsset.criticality || 'B';
  const completeness = typeof selectedAsset.knowledge_completeness === 'number'
    ? selectedAsset.knowledge_completeness
    : typeof selectedAsset.completeness === 'number'
    ? selectedAsset.completeness
    : 0.5;
  const docCount = selectedAsset.doc_count || (selectedAsset.entity_count ? Math.round(selectedAsset.entity_count / 2) : 3);

  // Realistic mock/health metrics if not explicitly populated
  const vibration = selectedAsset.vibration_trend || (criticality === 'A' ? { value: '4.8 mm/s RMS', trend: 'rising' } : { value: '2.1 mm/s RMS', trend: 'stable' });
  const lastInspection = selectedAsset.last_inspection || (criticality === 'A' ? 'Passed — Minor seal leak flagged' : 'Passed — Normal operating parameters');
  const daysSinceMaintenance = selectedAsset.days_since_maintenance ?? (tag === 'P-101' ? 112 : tag === 'HX-204' ? 45 : 88);

  const openWorkOrders = selectedAsset.open_work_orders ?? (criticality === 'A' || tag === 'P-101' ? 2 : 0);
  const activePermits = selectedAsset.active_permits ?? (criticality === 'A' || tag === 'P-101' ? 1 : 0);
  const hasActiveWork = openWorkOrders > 0 || activePermits > 0;

  const relationships = Array.isArray(selectedAsset.relationships) && selectedAsset.relationships.length > 0
    ? selectedAsset.relationships
    : tag === 'P-101'
    ? [{ target_tag: 'HX-204', type: 'FEEDS_INTO', confidence: 1.0 }, { target_tag: 'V-302', type: 'CONTROLLED_BY', confidence: 0.95 }]
    : tag === 'HX-204'
    ? [{ target_tag: 'P-101', type: 'FED_BY', confidence: 1.0 }]
    : [];

  const handleQueryOracle = () => {
    navigate('/oracle', {
      state: {
        initialQuery: `What are the standard operating procedures, maintenance steps, and safety warnings for asset ${tag} (${name})?`,
      },
    });
  };

  const handleViewChronicle = () => {
    navigate('/chronicle', {
      state: {
        filterEquipmentType: type,
      },
    });
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tag}
        initial={{ x: 350, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 350, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full h-full bg-nexus-surface border-l border-nexus-border flex flex-col overflow-y-auto no-scrollbar"
      >
        {/* Section 1 — Header */}
        <div className="p-5 border-b border-nexus-border bg-gradient-to-b from-white/[0.02] to-transparent sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="gradient-text font-mono text-2xl font-extrabold tracking-tight block">
                {tag}
              </span>
              <h2 className="text-base font-semibold text-white mt-0.5 leading-snug">{name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-nexus-textMuted hover:text-white hover:bg-white/10 transition-colors"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-nexus-border text-xs font-medium text-nexus-text">
              {type}
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
                criticality === 'A'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : criticality === 'B'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              Criticality {criticality}
            </span>
          </div>
        </div>

        {/* Section 2 — Knowledge Completeness */}
        <div className="p-5 border-b border-nexus-border flex flex-col items-center text-center bg-black/20">
          <CircularProgressRing completeness={completeness} />
          <div className="flex items-center gap-1.5 text-xs text-nexus-text font-medium mt-1">
            <FileText className="w-4 h-4 text-nexus-accent" />
            <span><strong className="text-white font-mono">{docCount}</strong> documents indexed</span>
          </div>
        </div>

        {/* Section 3 — Health Indicators */}
        <div className="p-5 border-b border-nexus-border space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-nexus-textMuted">
            Health & Operational Status
          </h4>
          <div className="glass-card p-3 space-y-2.5 border border-nexus-border">
            {/* Vibration Trend */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-nexus-textMuted">Vibration Trend:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-white font-medium">{vibration.value}</span>
                {vibration.trend === 'rising' ? (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Rising" />
                ) : vibration.trend === 'decreasing' ? (
                  <span className="w-2 h-2 rounded-full bg-cyan-400" title="Decreasing" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Stable" />
                )}
              </div>
            </div>

            <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs">
              <span className="text-nexus-textMuted">Last Inspection:</span>
              <span className="text-nexus-text font-medium text-right max-w-[170px] truncate" title={lastInspection}>
                {lastInspection}
              </span>
            </div>

            <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs">
              <span className="text-nexus-textMuted">Days Since Maint:</span>
              <span className={`font-mono font-bold ${daysSinceMaintenance > 90 ? 'text-red-400' : 'text-emerald-400'}`}>
                {daysSinceMaintenance} days
              </span>
            </div>
          </div>
        </div>

        {/* Section 4 — Active Work & Permits */}
        <div className="p-5 border-b border-nexus-border space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-nexus-textMuted">
            Active Work & Permits
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 border border-nexus-border text-center">
              <span className="text-2xl font-mono font-bold text-white block">{openWorkOrders}</span>
              <span className="text-[11px] text-nexus-textMuted">Open Work Orders</span>
            </div>
            <div className="glass-card p-3 border border-nexus-border text-center">
              <span className="text-2xl font-mono font-bold text-white block">{activePermits}</span>
              <span className="text-[11px] text-nexus-textMuted">Active Permits</span>
            </div>
          </div>

          {hasActiveWork && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="leading-relaxed">
                <strong className="text-red-200 font-semibold block">Active Work Detected</strong>
                Verify physical isolation and safety interlocks before querying maintenance procedures.
              </div>
            </motion.div>
          )}
        </div>

        {/* Section 5 — Relationships */}
        <div className="p-5 border-b border-nexus-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-nexus-textMuted">
              Knowledge Relationships
            </h4>
            <span className="text-[11px] font-mono text-nexus-textMuted">{relationships.length} links</span>
          </div>

          {relationships.length === 0 ? (
            <div className="glass-card p-4 text-center text-xs text-nexus-textMuted italic border border-nexus-border">
              No explicit connections mapped yet.
            </div>
          ) : (
            <div className="space-y-2">
              {relationships.map((rel, idx) => {
                const relType = rel.type || 'RELATED_TO';
                const typeColor =
                  relType === 'FEEDS_INTO' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' :
                  relType === 'GOVERNED_BY' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                  relType === 'CONTROLLED_BY' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                  'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';

                return (
                  <div
                    key={idx}
                    onClick={() => onSelectTag && onSelectTag(rel.target_tag)}
                    className="glass-card p-3 border border-nexus-border flex items-center justify-between hover:border-nexus-primary/50 hover:bg-white/[0.04] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ArrowRight className="w-4 h-4 text-nexus-textMuted group-hover:text-nexus-primary flex-shrink-0 transition-colors" />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${typeColor}`}>
                        {relType}
                      </span>
                      <span className="font-mono font-bold text-white text-xs truncate group-hover:underline">
                        {rel.target_tag}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-nexus-textMuted flex-shrink-0">
                      {Math.round((rel.confidence || 0.8) * 100)}% conf
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 6 — Actions */}
        <div className="p-5 space-y-3 mt-auto">
          <button
            onClick={handleQueryOracle}
            className="w-full py-3 px-4 rounded-xl bg-nexus-primary text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-nexus-primary/25 hover:bg-indigo-600 transition-all active:scale-[0.98]"
          >
            <Bot className="w-4 h-4" />
            <span>Query ORACLE about this asset</span>
          </button>

          <button
            onClick={handleViewChronicle}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-nexus-border text-nexus-text font-medium text-xs flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
          >
            <Activity className="w-4 h-4 text-nexus-accent" />
            <span>View Failure Patterns</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
