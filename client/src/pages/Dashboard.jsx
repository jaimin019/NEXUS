/**
 * Dashboard — The command center. First page judges see. Golden Parchment palette.
 */
import { useEffect, useState, useCallback } from 'react';
import { FileStack, Cpu, Network, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import MetricCard from '@/components/ui/MetricCard';
import AlertCard from '@/components/ui/AlertCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import useNexusStore from '@/store/nexusStore';
import { getDocuments, getAssets, getComplianceDashboard, getFailurePatterns } from '@/lib/api';

// format helper with fallback
function fmtDate(d) {
  try { return format(new Date(d), 'MMM d, HH:mm'); } catch { return '—'; }
}

export default function Dashboard() {
  const { documents, setDocuments, assets, setAssets, setComplianceDashboard,
          complianceDashboard, failurePatterns, setFailurePatterns, dismissAlert } = useNexusStore();

  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchAll = useCallback(async () => {
    const [docsRes, assetsRes, compRes, patternsRes] = await Promise.all([
      getDocuments(1, 50),
      getAssets(),
      getComplianceDashboard(),
      getFailurePatterns(),
    ]);

    if (docsRes.data) setDocuments(docsRes.data.documents || []);
    if (assetsRes.data) setAssets(assetsRes.data.assets || []);
    if (compRes.data) setComplianceDashboard(compRes.data);
    if (patternsRes.data) setFailurePatterns(patternsRes.data.patterns || []);

    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Derived metrics
  const totalDocs = documents.length;
  const totalAssets = assets.length;
  const totalEdges = assets.reduce((sum, a) => sum + (a.relationships?.length || 0), 0);
  const compCoverage = complianceDashboard?.overall_coverage_percent ?? null;

  // Alerts: patterns with >1 occurrence
  const alerts = failurePatterns.filter((p) => (p.occurrence_count || 0) > 1);

  // Assets sorted by completeness asc (gaps first)
  const gapAssets = [...assets].sort((a, b) => (a.knowledge_completeness || 0) - (b.knowledge_completeness || 0)).slice(0, 10);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px]" style={{ padding: 28 }}>

      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h2 className="text-h2" style={{ color: '#2C2416' }}>
            Command Center
          </h2>
          <p style={{ color: '#9B8B70', fontSize: 14, marginTop: 2 }}>
            Real-time overview of your industrial knowledge base
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent transition-all duration-200 hover:bg-surfaceHigh"
          style={{ color: '#C4B49A', fontSize: 12 }}
        >
          <RefreshCw size={13} />
          {lastRefresh ? `Updated ${format(lastRefresh, 'HH:mm')}` : 'Refresh'}
        </button>
      </motion.div>

      {/* Row 1 — KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={FileStack} label="Documents Indexed" value={loading ? null : totalDocs}
          loading={loading}
        />
        <MetricCard
          icon={Cpu} label="Equipment Nodes" value={loading ? null : totalAssets}
          loading={loading}
        />
        <MetricCard
          icon={Network} label="Knowledge Graph Edges" value={loading ? null : totalEdges}
          loading={loading}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Compliance Coverage"
          value={loading ? null : compCoverage !== null ? `${compCoverage.toFixed(0)}%` : 'N/A'}
          loading={loading}
        />
      </motion.div>

      {/* Row 2 — Active Alerts */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2" style={{ fontSize: 16, fontWeight: 700, color: '#2C2416' }}>
            <span className={`w-2 h-2 rounded-full ${alerts.length > 0 ? 'bg-[#C49A3C] animate-pulse' : 'bg-[#7A8C5A]'}`} />
            Active Pattern Alerts
          </h3>
          <span style={{ fontSize: 13, color: '#9B8B70' }}>{alerts.length} pattern{alerts.length !== 1 ? 's' : ''} detected</span>
        </div>

        {loading ? (
          <div className="flex gap-3">
            {[1,2,3].map(i => <LoadingSkeleton key={i} width={320} height={180} />)}
          </div>
        ) : alerts.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            <AnimatePresence>
              {alerts.map((pattern) => (
                <AlertCard
                  key={pattern._id}
                  title={pattern.failure_mode}
                  equipment={pattern.equipment_type}
                  occurrences={pattern.occurrence_count}
                  avgDaysToFailure={pattern.avg_days_to_failure}
                  message={pattern.resolution || pattern.detection_method}
                  onDismiss={() => dismissAlert(pattern._id)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="card p-5 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#7A8C5A' }} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#2C2416' }}>All Systems Nominal</p>
              <p style={{ fontSize: 13, color: '#9B8B70', marginTop: 2 }}>No failure patterns with multiple occurrences detected</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Row 3 — Documents table + Knowledge Completeness */}
      <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Recent Documents (60%) */}
        <div className="xl:col-span-3 card p-6">
          <h3 className="mb-4" style={{ fontSize: 15, fontWeight: 700, color: '#2C2416' }}>Recent Documents</h3>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <LoadingSkeleton key={i} height={40} />)}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-10">
              <FileStack className="w-10 h-10 mx-auto mb-3 opacity-50" style={{ color: '#C4B49A' }} />
              <p style={{ fontSize: 14, color: '#9B8B70' }}>No documents indexed yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="nexus-table">
                <thead>
                  <tr>
                    {['Title', 'Type', 'Status', 'Entities', 'Chunks', 'Uploaded'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.slice(0, 10).map((doc) => (
                    <tr key={doc._id}>
                      <td>
                        <span className="font-medium truncate max-w-[180px] block" title={doc.title}>
                          {doc.title}
                        </span>
                      </td>
                      <td>
                        <StatusBadge value={doc.doc_type} type="doc_type" />
                      </td>
                      <td>
                        <StatusBadge value={doc.ingestion_status} type="status" />
                      </td>
                      <td style={{ color: '#6B5B3E' }}>{doc.entity_count ?? '—'}</td>
                      <td style={{ color: '#6B5B3E' }}>{doc.chunk_count ?? '—'}</td>
                      <td style={{ color: '#9B8B70' }}>{fmtDate(doc.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {documents.length > 10 && (
                <p style={{ fontSize: 13, color: '#C4B49A', marginTop: 12, textAlign: 'center' }}>
                  +{documents.length - 10} more documents
                </p>
              )}
            </div>
          )}
        </div>

        {/* Knowledge Completeness (40%) */}
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2C2416' }}>Knowledge Gaps</h3>
            <span style={{ fontSize: 12, color: '#9B8B70' }}>Lowest completeness first</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3,4,5,6].map(i => <LoadingSkeleton key={i} height={36} />)}
            </div>
          ) : gapAssets.length === 0 ? (
            <div className="text-center py-10">
              <Cpu className="w-10 h-10 mx-auto mb-3 opacity-50" style={{ color: '#C4B49A' }} />
              <p style={{ fontSize: 14, color: '#9B8B70' }}>No assets registered yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gapAssets.map((asset) => {
                const pct = Math.round((asset.knowledge_completeness || 0) * 100);
                return (
                  <div key={asset._id || asset.tag}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono badge-gold text-[10px] px-1.5 py-0.5">{asset.tag}</span>
                        <span className="truncate" style={{ color: '#6B5B3E', fontSize: 13 }}>{asset.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#A0623A' }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{ height: 3, borderRadius: 999, background: '#EDE8DE', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', background: '#C49A3C', borderRadius: 999 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
