import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Zap, Activity, AlertTriangle, Clock, RefreshCw, Loader2 } from 'lucide-react';
import PatternTimeline from '@/components/chronicle/PatternTimeline';
import PatternSimulator from '@/components/chronicle/PatternSimulator';
import SourceModal from '@/components/chronicle/SourceModal';
import { getFailurePatterns, minePatterns } from '@/lib/api';
import useNexusStore from '@/store/nexusStore';
import { useToast } from '@/components/ui/Toast';

export default function FailureIntelligence() {
  const { failurePatterns, setFailurePatterns } = useNexusStore();
  const [loading, setLoading] = useState(true);
  const [mining, setMining] = useState(false);
  const [activeSourcePattern, setActiveSourcePattern] = useState(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data } = await getFailurePatterns();
    if (data && data.patterns) {
      setFailurePatterns(data.patterns);
    }
    setLoading(false);
  }, [setFailurePatterns]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Mining with Polling
  const handleMineNewPatterns = async () => {
    if (mining) return;
    setMining(true);
    const initialCount = failurePatterns.length;

    toast.info('Pattern mining started — this may take 30 seconds', 6000);

    const { error } = await minePatterns();
    if (error) {
      toast.error(`Mining failed: ${error}`);
      setMining(false);
      return;
    }

    // Poll GET /chronicle/patterns every 5s up to 6 times (30s)
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data } = await getFailurePatterns();
      if (data && data.patterns) {
        if (data.patterns.length > initialCount || attempts >= 6) {
          clearInterval(interval);
          setFailurePatterns(data.patterns);
          setMining(false);
          if (data.patterns.length > initialCount) {
            toast.success(`Pattern mining complete! Detected ${data.patterns.length - initialCount} new historical recurrence signatures.`);
          } else {
            toast.success('Pattern mining complete! Updated existing signatures.');
          }
        }
      } else if (attempts >= 6) {
        clearInterval(interval);
        setMining(false);
      }
    }, 5000);
  };

  // Stats computation
  const stats = useMemo(() => {
    const total = failurePatterns.length;
    if (total === 0) {
      return {
        total: 0,
        highestRiskText: 'No signatures detected',
        avgLeadTime: 0,
      };
    }

    let highestOcc = -1;
    let highestPattern = failurePatterns[0];
    let sumDays = 0;
    let daysCount = 0;

    failurePatterns.forEach((p) => {
      const occ = p.occurrence_count || 1;
      if (occ > highestOcc) {
        highestOcc = occ;
        highestPattern = p;
      }
      if (typeof p.avg_days_to_failure === 'number') {
        sumDays += p.avg_days_to_failure;
        daysCount++;
      } else {
        sumDays += 5;
        daysCount++;
      }
    });

    return {
      total,
      highestRiskText: `${highestPattern.equipment_type || 'Equipment'}: ${highestPattern.failure_mode || 'Critical Failure'}`,
      avgLeadTime: daysCount > 0 ? Math.round(sumDays / daysCount) : 6,
    };
  }, [failurePatterns]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-nexus-border pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Failure Pattern Intelligence</span>
          </h1>
          <p className="text-xs text-nexus-textMuted mt-1 max-w-xl leading-relaxed">
            AI-mined patterns from historical incidents, work orders, and inspection records. Autonomously isolates precursor signals and calculates risk horizons across the plant network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh Patterns"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-nexus-textMuted hover:text-white border border-nexus-border transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-nexus-primary' : ''}`} />
          </button>

          <button
            onClick={handleMineNewPatterns}
            disabled={mining}
            className="btn-primary px-5 py-2.5 rounded-xl text-xs flex items-center gap-2"
          >
            {mining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mining Signatures...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Mine New Patterns</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats row — 3 horizontal cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Patterns */}
        <div className="card p-5 flex items-center justify-between relative overflow-hidden group hover:border-nexus-primary/40 transition-all">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-nexus-textMuted block">
              Total Patterns Detected
            </span>
            <span className="text-3xl font-mono font-black gradient-text block">
              {stats.total}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-nexus-primary/10 border border-nexus-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6 text-nexus-primary" />
          </div>
        </div>

        {/* Card 2: Highest Risk Pattern */}
        <div className="card p-5 flex items-center justify-between relative overflow-hidden group hover:border-[#C4A882]/40 transition-all">
          <div className="space-y-1 min-w-0 pr-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-nexus-textMuted block">
              Highest Risk Pattern
            </span>
            <span className="text-sm font-bold text-white truncate block" title={stats.highestRiskText}>
              {stats.highestRiskText}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#C4A882]/10 border border-[#C4A882]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-6 h-6 text-[#C4A882]" />
          </div>
        </div>

        {/* Card 3: Avg Prediction Lead Time */}
        <div className="card p-5 flex items-center justify-between relative overflow-hidden group hover:border-[#D4B896]/40 transition-all">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-nexus-textMuted block">
              Avg Prediction Lead Time
            </span>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-3xl font-black text-[#D4B896]">{stats.avgLeadTime}</span>
              <span className="text-xs text-nexus-textMuted uppercase font-bold">days</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#D4B896]/10 border border-[#D4B896]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6 text-[#D4B896]" />
          </div>
        </div>
      </div>

      {/* Main Pattern Timeline Visualization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-nexus-border/50 pb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-nexus-accent" />
            <span>Recurrence Signatures Timeline</span>
          </h3>
          <span className="text-xs text-nexus-textMuted font-mono">Sorted by severity & risk horizon</span>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-nexus-primary animate-spin mx-auto" />
            <p className="text-xs font-mono text-nexus-textMuted animate-pulse">
              Extracting failure signatures & building precursor timeline...
            </p>
          </div>
        ) : (
          <PatternTimeline
            patterns={failurePatterns}
            onOpenSourceModal={(pattern) => setActiveSourcePattern(pattern)}
          />
        )}
      </div>

      {/* Pattern Match Simulator */}
      <div className="pt-4">
        <PatternSimulator onOpenSourceModal={(pattern) => setActiveSourcePattern(pattern)} />
      </div>

      {/* Source Incidents Modal */}
      <SourceModal
        pattern={activeSourcePattern}
        onClose={() => setActiveSourcePattern(null)}
      />
    </div>
  );
}
