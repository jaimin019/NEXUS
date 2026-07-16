/**
 * Dashboard — The command center. First page judges see.
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

// Completeness bar color
function completenessColor(v) {
  if (v >= 0.7) return 'bg-emerald-500';
  if (v >= 0.4) return 'bg-amber-500';
  return 'bg-red-500';
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

  const compColor = compCoverage === null ? 'indigo'
    : compCoverage >= 80 ? 'green'
    : compCoverage >= 50 ? 'amber'
    : 'red';

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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px]">

      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-nexus-text">
            Command Center
          </h2>
          <p className="text-sm text-nexus-textMuted mt-0.5">
            Real-time overview of your industrial knowledge base
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-nexus-border
            text-nexus-textMuted hover:text-nexus-text hover:border-nexus-primary/40
            text-xs transition-all duration-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {lastRefresh ? `Updated ${format(lastRefresh, 'HH:mm:ss')}` : 'Refresh'}
        </button>
      </motion.div>

      {/* Row 1 — KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={FileStack} label="Documents Indexed" value={loading ? null : totalDocs}
          color="indigo" trend="up" trendValue="+3 today" loading={loading}
        />
        <MetricCard
          icon={Cpu} label="Equipment Nodes" value={loading ? null : totalAssets}
          color="cyan" trend="up" trendValue={`${totalAssets} tracked`} loading={loading}
        />
        <MetricCard
          icon={Network} label="Knowledge Graph Edges" value={loading ? null : totalEdges}
          color="purple" trend="up" trendValue="Relationships" loading={loading}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Compliance Coverage"
          value={loading ? null : compCoverage !== null ? `${compCoverage.toFixed(0)}%` : 'N/A'}
          color={compColor}
          trend={compCoverage >= 80 ? 'up' : 'down'}
          trendValue={compCoverage !== null ? (compCoverage >= 80 ? 'Healthy' : 'Needs attention') : '—'}
          loading={loading}
        />
      </motion.div>

      {/* Row 2 — Active Alerts */}
      <motion.div variants={item} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-nexus-text flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${alerts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            Active Pattern Alerts
          </h3>
          <span className="text-xs text-nexus-textMuted">{alerts.length} pattern{alerts.length !== 1 ? 's' : ''} detected</span>
        </div>

        {loading ? (
          <div className="flex gap-3">
            {[1,2,3].map(i => <LoadingSkeleton key={i} width={288} height={120} />)}
          </div>
        ) : alerts.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <AnimatePresence>
              {alerts.map((pattern) => (
                <AlertCard
                  key={pattern._id}
                  severity={pattern.occurrence_count > 5 ? 'HIGH' : 'MEDIUM'}
                  title={pattern.failure_mode}
                  equipment={pattern.equipment_type}
                  occurrences={pattern.occurrence_count}
                  avgDaysToFailure={pattern.avg_days_to_failure}
                  message={pattern.resolution || pattern.detection_method}
                  onDismiss={() => dismissAlert(pattern._id)}
                  onViewDetails={() => {}}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-4 px-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">All Systems Nominal</p>
              <p className="text-xs text-nexus-textMuted mt-0.5">No failure patterns with multiple occurrences detected</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Row 3 — Documents table + Knowledge Completeness */}
      <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Recent Documents (60%) */}
        <div className="xl:col-span-3 glass-card p-5">
          <h3 className="text-sm font-semibold text-nexus-text mb-4">Recent Documents</h3>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <LoadingSkeleton key={i} height={40} />)}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-10">
              <FileStack className="w-10 h-10 text-nexus-muted mx-auto mb-3 opacity-50" />
              <p className="text-sm text-nexus-textMuted">No documents indexed yet</p>
              <p className="text-xs text-nexus-muted mt-1">Upload documents using the button above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-nexus-border">
                    {['Title', 'Type', 'Status', 'Entities', 'Chunks', 'Uploaded'].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-nexus-muted pb-3 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.slice(0, 10).map((doc) => (
                    <tr key={doc._id} className="table-row-hover border-b border-nexus-border/50 last:border-0 transition-colors">
                      <td className="py-3 pr-4">
                        <span className="text-nexus-text font-medium text-xs truncate max-w-[180px] block" title={doc.title}>
                          {doc.title}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge value={doc.doc_type} type="doc_type" />
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge value={doc.ingestion_status} type="status" />
                      </td>
                      <td className="py-3 pr-4 text-nexus-textMuted text-xs">{doc.entity_count ?? '—'}</td>
                      <td className="py-3 pr-4 text-nexus-textMuted text-xs">{doc.chunk_count ?? '—'}</td>
                      <td className="py-3 text-nexus-muted text-xs whitespace-nowrap">{fmtDate(doc.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {documents.length > 10 && (
                <p className="text-xs text-nexus-muted mt-3 text-center">
                  +{documents.length - 10} more documents
                </p>
              )}
            </div>
          )}
        </div>

        {/* Knowledge Completeness (40%) */}
        <div className="xl:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-nexus-text">Knowledge Gaps</h3>
            <span className="text-xs text-nexus-muted">Lowest completeness first</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3,4,5,6].map(i => <LoadingSkeleton key={i} height={36} />)}
            </div>
          ) : gapAssets.length === 0 ? (
            <div className="text-center py-10">
              <Cpu className="w-10 h-10 text-nexus-muted mx-auto mb-3 opacity-50" />
              <p className="text-sm text-nexus-textMuted">No assets registered yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gapAssets.map((asset) => {
                const pct = Math.round((asset.knowledge_completeness || 0) * 100);
                const barColor = completenessColor(asset.knowledge_completeness || 0);
                return (
                  <div key={asset._id || asset.tag}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-nexus-accent font-medium flex-shrink-0">{asset.tag}</span>
                        <span className="text-xs text-nexus-textMuted truncate">{asset.name}</span>
                      </div>
                      <span className={`text-xs font-semibold ml-2 flex-shrink-0
                        ${pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-nexus-bg rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${barColor}`}
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
