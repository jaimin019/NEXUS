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

  let color = '#C49A3C';

  return (
    <div className="relative flex flex-col items-center justify-center py-3">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        {/* Background Track circle */}
        <circle
          stroke="#EDE8DE"
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
        <span className="text-xl font-mono font-extrabold gradient-text text-[#2C2416]">{pct}%</span>
        <span className="text-[10px] uppercase tracking-wider text-[#9B8B70] font-semibold">Completeness</span>
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
        <p className="text-xs text-[#9B8B70] mb-6 max-w-[280px]">
          Click any D3 node on the canvas to inspect real-time health, regulatory compliance, relationships, and RAG knowledge.
        </p>
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-[#9B8B70] uppercase tracking-wider block">
            Example Assets:
          </span>
          <div className="flex items-center justify-center gap-2">
            {['P-101', 'HX-204', 'V-302'].map((tag) => (
              <button
                key={tag}
                onClick={() => onSelectTag && onSelectTag(tag)}
                className="px-3 py-1.5 rounded-lg bg-[#F5EDD8] border border-nexus-border text-xs font-mono font-medium text-[#2C2416] hover:text-white hover:border-nexus-primary/50 hover:bg-nexus-primary/10 transition-all shadow-sm"
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
              className="p-1.5 rounded-lg text-[#9B8B70] hover:text-white hover:bg-white/10 transition-colors"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-md bg-[#F5EDD8] border border-nexus-border text-xs font-medium text-[#2C2416]">
              {type}
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
                criticality === 'A'
                  ? 'bg-[#B87070]/10 text-[#B87070] border-[#B87070]/30'
                  : criticality === 'B'
                  ? 'bg-[#C4A882]/10 text-[#C4A882] border-[#C4A882]/30'
                  : 'bg-[#D4B896]/10 text-[#D4B896] border-[#D4B896]/30'
              }`}
            >
              Criticality {criticality}
            </span>
          </div>
        </div>

        {/* Section 2 — Knowledge Completeness */}
        <div className="p-5 border-b border-nexus-border flex flex-col items-center text-center bg-black/20">
          <CircularProgressRing completeness={completeness} />
          <div className="flex items-center gap-1.5 text-xs text-[#2C2416] font-medium mt-1">
            <FileText className="w-4 h-4 text-nexus-accent" />
            <span><strong className="text-white font-mono">{docCount}</strong> documents indexed</span>
          </div>
        </div>

        {/* Section 3 — Health Indicators */}
        <div className="p-5 border-b border-nexus-border space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9B8B70]">
            Health & Operational Status
          </h4>
          <div className="card p-3 space-y-2.5">
            {/* Vibration Trend */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#9B8B70]">Vibration Trend:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-white font-medium">{vibration.value}</span>
                {vibration.trend === 'rising' ? (
                  <span className="w-2 h-2 rounded-full bg-[#B87070] animate-pulse" title="Rising" />
                ) : vibration.trend === 'decreasing' ? (
                  <span className="w-2 h-2 rounded-full bg-[#C49A3C]" title="Decreasing" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#D4B896]" title="Stable" />
                )}
              </div>
            </div>

            <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs">
              <span className="text-[#9B8B70]">Last Inspection:</span>
              <span className="text-[#2C2416] font-medium text-right max-w-[170px] truncate" title={lastInspection}>
                {lastInspection}
              </span>
            </div>

            <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs">
              <span className="text-[#9B8B70]">Days Since Maint:</span>
              <span className={`font-mono font-bold ${daysSinceMaintenance > 90 ? 'text-[#B87070]' : 'text-[#D4B896]'}`}>
                {daysSinceMaintenance} days
              </span>
            </div>
          </div>
        </div>

        {/* Section 4 — Active Work & Permits */}
        <div className="p-5 border-b border-nexus-border space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9B8B70]">
            Active Work & Permits
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3 text-center">
              <span className="text-2xl font-mono font-bold text-white block">{openWorkOrders}</span>
              <span className="text-[11px] text-[#9B8B70]">Open Work Orders</span>
            </div>
            <div className="card p-3 text-center">
              <span className="text-2xl font-mono font-bold text-white block">{activePermits}</span>
              <span className="text-[11px] text-[#9B8B70]">Active Permits</span>
            </div>
          </div>

          {hasActiveWork && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl flex items-start gap-2.5 text-xs"
              style={{ background: 'rgba(194,59,46,0.1)', border: '1px solid rgba(194,59,46,0.3)', color: '#C49A3C' }}
            >
              <AlertTriangle className="w-4 h-4 text-[#B87070] flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="leading-relaxed">
                <strong className="text-white font-semibold block">Active Work Detected</strong>
                Verify physical isolation and safety interlocks before querying maintenance procedures.
              </div>
            </motion.div>
          )}
        </div>

        {/* Section 5 — Relationships */}
        <div className="p-5 border-b border-nexus-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9B8B70]">
              Knowledge Relationships
            </h4>
            <span className="text-[11px] font-mono text-[#9B8B70]">{relationships.length} links</span>
          </div>

          {relationships.length === 0 ? (
            <div className="card p-4 text-center text-xs text-[#9B8B70] italic">
              No explicit connections mapped yet.
            </div>
          ) : (
            <div className="space-y-2">
              {relationships.map((rel, idx) => {
                const relType = rel.type || 'RELATED_TO';
                // Adjust colors based on Autumn Sunset palette, matching KnowledgeGraph
                const typeColor =
                  relType === 'FEEDS_INTO' ? 'text-[#A0623A] bg-[#C49A3C]/10 border-[#C49A3C]/20' :
                  relType === 'GOVERNED_BY' ? 'text-[#B87070] bg-[#B87070]/10 border-[#B87070]/20' :
                  relType === 'CONTROLLED_BY' ? 'text-[#C4A882] bg-[#C4A882]/10 border-[#C4A882]/20' :
                  'text-[#A0623A] bg-[#C49A3C]/10 border-[#C49A3C]/20';

                return (
                  <div
                    key={idx}
                    onClick={() => onSelectTag && onSelectTag(rel.target_tag)}
                    className="card p-3 flex items-center justify-between hover:border-nexus-blush transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ArrowRight className="w-4 h-4 text-[#9B8B70] group-hover:text-nexus-primary flex-shrink-0 transition-colors" />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${typeColor}`}>
                        {relType}
                      </span>
                      <span className="font-mono font-bold text-white text-xs truncate group-hover:underline">
                        {rel.target_tag}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#9B8B70] flex-shrink-0">
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
            className="btn-primary w-full py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2"
          >
            <Bot className="w-4 h-4" />
            <span>Query ORACLE about this asset</span>
          </button>

          <button
            onClick={handleViewChronicle}
            className="btn-secondary w-full py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4 text-nexus-accent" />
            <span>View Failure Patterns</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
