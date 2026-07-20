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

  return (
    <div className="relative flex flex-col items-center justify-center py-3">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="#E2D9C8"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#C49A3C"
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
        <span style={{ color: '#2C2416', fontWeight: 800, fontSize: '20px' }} className="font-mono">{pct}%</span>
        <span style={{ color: '#9B8B70', fontSize: '10px' }} className="uppercase tracking-wider font-semibold">Completeness</span>
      </div>
    </div>
  );
}

export default function AssetDetailPanel({ selectedAsset, onClose, onSelectTag }) {
  const navigate = useNavigate();

  // If nothing selected, render empty state
  if (!selectedAsset) {
    return (
      <div
        style={{
          background: '#FDFAF6',
          borderLeft: '1px solid #E2D9C8',
          height: '100%',
          overflowY: 'auto',
          padding: '24px'
        }}
        className="w-full flex flex-col items-center justify-center text-center"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm" style={{ background: '#F5EDD8', border: '1px solid rgba(196,154,60,0.3)' }}>
          <Network className="w-8 h-8 animate-pulse" style={{ color: '#C49A3C' }} />
        </div>
        <h3 className="gradient-text text-lg font-bold mb-2 max-w-[260px]">
          Select an asset to explore its knowledge network
        </h3>
        <p style={{ color: '#9B8B70' }} className="text-xs mb-6 max-w-[280px]">
          Click any D3 node on the canvas to inspect real-time health, regulatory compliance, relationships, and RAG knowledge.
        </p>
        <div className="space-y-2">
          <span style={{ color: '#9B8B70' }} className="text-[11px] font-semibold uppercase tracking-wider block">
            Example Assets:
          </span>
          <div className="flex items-center justify-center gap-2">
            {['P-101', 'HX-204', 'V-302'].map((tag) => (
              <button
                key={tag}
                onClick={() => onSelectTag && onSelectTag(tag)}
                style={{
                  background: '#F5EDD8',
                  color: '#C49A3C',
                  border: '1px solid rgba(196,154,60,0.3)',
                  borderRadius: '999px',
                  padding: '4px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                className="font-mono transition-all shadow-sm"
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
        style={{
          background: '#FDFAF6',
          borderLeft: '1px solid #E2D9C8',
          height: '100%',
          overflowY: 'auto',
          padding: '24px'
        }}
        className="w-full flex flex-col no-scrollbar"
      >
        {/* Section 1 — Header */}
        <div className="pb-4 border-b sticky top-0 z-10" style={{ borderColor: '#E2D9C8', background: '#FDFAF6' }}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span style={{ fontSize: '22px', fontWeight: 800 }} className="gradient-text font-mono tracking-tight block">
                {tag}
              </span>
              <h2 style={{ color: '#2C2416', fontSize: '16px', fontWeight: 600 }} className="mt-0.5 leading-snug">{name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#9B8B70' }}
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="badge-muted">
              {type}
            </span>
            <span className={
              criticality === 'A' ? 'badge-critical' :
              criticality === 'B' ? 'badge-caution' : 'badge-positive'
            }>
              Criticality {criticality}
            </span>
          </div>
        </div>

        {/* Section 2 — Knowledge Completeness */}
        <div className="py-4 border-b flex flex-col items-center text-center" style={{ borderColor: '#E2D9C8' }}>
          <CircularProgressRing completeness={completeness} />
          <div className="flex items-center gap-1.5 font-medium mt-1" style={{ color: '#9B8B70', fontSize: '12px' }}>
            <FileText className="w-4 h-4" style={{ color: '#C49A3C' }} />
            <span><strong className="font-mono" style={{ color: '#2C2416' }}>{docCount}</strong> documents indexed</span>
          </div>
        </div>

        {/* Section 3 — Health Indicators */}
        <div
          style={{
            background: '#F5F0E8',
            border: '1px solid #E2D9C8',
            borderRadius: '8px',
            padding: '12px 14px',
            marginTop: '16px'
          }}
          className="space-y-3"
        >
          <h4
            style={{
              color: '#9B8B70',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}
          >
            HEALTH INDICATORS
          </h4>
          <div className="space-y-2">
            {/* Vibration Trend */}
            <div className="flex items-center justify-between" style={{ color: '#9B8B70', fontSize: '12px' }}>
              <span>Vibration Trend:</span>
              <div className="flex items-center gap-1.5 font-mono" style={{ color: '#2C2416', fontSize: '13px', fontWeight: 500 }}>
                <span>{vibration.value}</span>
                {vibration.trend === 'rising' ? (
                  <span style={{ color: '#A0623A' }} className="font-bold flex items-center gap-1">● rising</span>
                ) : vibration.trend === 'decreasing' ? (
                  <span style={{ color: '#6B7A8C' }} className="font-bold flex items-center gap-1">● decreasing</span>
                ) : (
                  <span style={{ color: '#7A8C5A' }} className="font-bold flex items-center gap-1">● stable</span>
                )}
              </div>
            </div>

            <div className="border-t pt-2 flex items-center justify-between" style={{ borderColor: '#E2D9C8', color: '#9B8B70', fontSize: '12px' }}>
              <span>Last Inspection:</span>
              <span style={{ color: '#2C2416', fontSize: '13px', fontWeight: 500 }} className="text-right max-w-[170px] truncate" title={lastInspection}>
                {lastInspection}
              </span>
            </div>

            <div className="border-t pt-2 flex items-center justify-between" style={{ borderColor: '#E2D9C8', color: '#9B8B70', fontSize: '12px' }}>
              <span>Days Since Maint:</span>
              <span className="font-mono font-bold" style={{
                color: daysSinceMaintenance > 90 ? '#A0623A' : '#2C2416',
                fontSize: '13px'
              }}>
                {daysSinceMaintenance} days
              </span>
            </div>
          </div>
        </div>

        {/* Section 4 — Active Work & Permits */}
        <div className="py-4 border-b space-y-3" style={{ borderColor: '#E2D9C8' }}>
          <h4 style={{ color: '#9B8B70', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Active Work & Permits
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3 text-center">
              <span className="text-2xl font-mono font-bold block" style={{ color: '#2C2416' }}>{openWorkOrders}</span>
              <span className="text-[11px]" style={{ color: '#9B8B70' }}>Open Work Orders</span>
            </div>
            <div className="card p-3 text-center">
              <span className="text-2xl font-mono font-bold block" style={{ color: '#2C2416' }}>{activePermits}</span>
              <span className="text-[11px]" style={{ color: '#9B8B70' }}>Active Permits</span>
            </div>
          </div>

          {hasActiveWork && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(160,98,58,0.06)',
                border: '1px solid rgba(160,98,58,0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginTop: '12px'
              }}
              className="flex items-start gap-2.5"
            >
              <ShieldAlert size={14} style={{ color: '#A0623A' }} className="flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="leading-relaxed" style={{ color: '#A0623A', fontSize: '13px' }}>
                <strong className="font-semibold block">Active Work Detected</strong>
                Verify physical isolation and safety interlocks before querying maintenance procedures.
              </div>
            </motion.div>
          )}
        </div>

        {/* Section 5 — Relationships */}
        <div className="py-4 border-b space-y-3" style={{ borderColor: '#E2D9C8' }}>
          <div className="flex items-center justify-between">
            <h4 style={{ color: '#9B8B70', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Knowledge Relationships
            </h4>
            <span className="text-[11px] font-mono" style={{ color: '#9B8B70' }}>{relationships.length} links</span>
          </div>

          {relationships.length === 0 ? (
            <div className="card p-4 text-center text-xs italic" style={{ color: '#9B8B70' }}>
              No explicit connections mapped yet.
            </div>
          ) : (
            <div className="space-y-2">
              {relationships.map((rel, idx) => {
                const relType = rel.type || 'RELATED_TO';
                return (
                  <div
                    key={idx}
                    onClick={() => onSelectTag && onSelectTag(rel.target_tag)}
                    style={{
                      background: '#F5EDD8',
                      border: '1px solid rgba(196,154,60,0.2)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                    className="transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ArrowRight className="w-4 h-4 flex-shrink-0 transition-colors" style={{ color: '#9B8B70' }} />
                      <span style={{ color: '#C49A3C', fontSize: '12px', fontWeight: 600 }}>
                        {relType}
                      </span>
                      <span style={{ color: '#2C2416', fontSize: '13px', fontWeight: 600 }} className="font-mono truncate group-hover:underline">
                        {rel.target_tag}
                      </span>
                    </div>
                    <span style={{ color: '#9B8B70', fontSize: '11px' }} className="font-mono flex-shrink-0">
                      {Math.round((rel.confidence || 0.8) * 100)}% conf
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 6 — Actions */}
        <div className="pt-4 space-y-3 mt-auto">
          <button
            onClick={handleQueryOracle}
            className="btn-primary"
            style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
          >
            <Bot className="w-4 h-4" />
            <span>Query ORACLE about this asset</span>
          </button>

          <button
            onClick={handleViewChronicle}
            className="btn-secondary"
            style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
          >
            <Activity className="w-4 h-4" style={{ color: '#C49A3C' }} />
            <span>View Failure Patterns</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
