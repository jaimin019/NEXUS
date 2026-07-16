import React from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function PatternTimeline({ patterns = [], onOpenSourceModal }) {
  if (!patterns || patterns.length === 0) {
    return (
      <div className="glass-card p-12 text-center border border-nexus-border rounded-2xl flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-nexus-primary/10 border border-nexus-primary/20 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-nexus-primary" />
        </div>
        <h4 className="text-sm font-bold text-white">No Failure Signatures Mined Yet</h4>
        <p className="text-xs text-nexus-textMuted max-w-sm">
          Click the "Mine New Patterns" button above to autonomously extract historical recurrence signatures from your indexed maintenance logs and incident reports.
        </p>
      </div>
    );
  }

  return (
    <div className="relative py-4 select-none">
      {/* Vertical Line connecting all cards with gradient */}
      <div
        className="absolute left-[39px] sm:left-[47px] top-6 bottom-6 w-1 rounded-full pointer-events-none z-0"
        style={{
          background: 'linear-gradient(180deg, #EF4444 0%, #F59E0B 50%, #10B981 100%)',
          boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)',
        }}
      />

      <div className="space-y-6 relative z-10">
        {patterns.map((pattern, idx) => {
          const occCount = pattern.occurrence_count || 1;
          const leadDays = typeof pattern.avg_days_to_failure === 'number' ? pattern.avg_days_to_failure : 5;
          const confidence = typeof pattern.similarity_confidence === 'number' ? pattern.similarity_confidence : 0.88;
          const incidentsCount = Array.isArray(pattern.source_incidents)
            ? pattern.source_incidents.length
            : pattern.source_incident_ids?.length || occCount;

          // Severity colors based on leadDays
          const severityClass =
            leadDays < 7 ? 'bg-red-500 shadow-red-500/50' :
            leadDays <= 14 ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50';

          const leadDaysColor =
            leadDays < 7 ? 'text-red-400 font-bold bg-red-500/10 border-red-500/20' :
            leadDays <= 14 ? 'text-amber-400 font-bold bg-amber-500/10 border-amber-500/20' :
            'text-emerald-400 font-bold bg-emerald-500/10 border-emerald-500/20';

          const typeColor =
            (pattern.equipment_type || '').toLowerCase().includes('pump') ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
            (pattern.equipment_type || '').toLowerCase().includes('exchanger') ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
            (pattern.equipment_type || '').toLowerCase().includes('valve') ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
            'bg-purple-500/20 text-purple-300 border-purple-500/30';

          return (
            <motion.div
              key={pattern._id || idx}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.1, ease: 'easeOut' }}
              className="flex items-start gap-4 sm:gap-6 group"
            >
              {/* Left Column (80px wide): Occurrence count circle / badge */}
              <div className="w-20 sm:w-24 flex-shrink-0 flex flex-col items-center pt-2">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl glass-card border border-nexus-border flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition-transform bg-nexus-surface/90">
                  <span className="gradient-text font-mono text-lg sm:text-xl font-black leading-none">
                    {occCount}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-nexus-textMuted uppercase tracking-wider font-semibold mt-1.5 text-center">
                  occurrences
                </span>
              </div>

              {/* Right: Pattern Card */}
              <div className="flex-1 glass-card glow-border relative overflow-hidden transition-all hover:border-nexus-primary/60 bg-gradient-to-br from-white/[0.03] to-transparent shadow-xl">
                {/* Right edge severity indicator strip (4px wide) */}
                <div className={`absolute right-0 top-0 bottom-0 w-1.5 ${severityClass}`} />

                {/* Card Header */}
                <div className="p-4 sm:p-5 border-b border-nexus-border flex flex-wrap items-center justify-between gap-3 bg-white/[0.01]">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${typeColor}`}>
                      {pattern.equipment_type || 'Equipment'}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {pattern.failure_mode || 'Historical Recurrence Signature'}
                    </h3>
                  </div>
                </div>

                {/* Card Body - 3 columns */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-5 border-b border-nexus-border">
                  {/* Column 1: Precursor Signals */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Warning Signs
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(pattern.precursor_signals || []).length > 0 ? (
                        pattern.precursor_signals.map((sig, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-xs font-medium text-amber-200"
                          >
                            ⚠ {sig}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-nexus-textMuted italic">No distinct warning signs isolated</span>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Contributing Conditions */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-nexus-textMuted uppercase tracking-wider block">
                      Risk Factors
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(pattern.contributing_conditions || []).length > 0 ? (
                        pattern.contributing_conditions.map((cond, cIdx) => (
                          <span
                            key={cIdx}
                            className="px-2.5 py-1 rounded-md bg-white/5 border border-nexus-border text-xs font-medium text-nexus-text"
                          >
                            {cond}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-nexus-textMuted italic">Standard operational variance</span>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Historical Fix / Resolution */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                      Historical Fix
                    </span>
                    <p className="text-xs text-emerald-300 leading-relaxed font-mono bg-emerald-500/[0.08] p-2.5 rounded-lg border border-emerald-500/20">
                      {pattern.recommended_resolution || 'Standard overhaul and preventive replacement of degraded components.'}
                    </p>
                  </div>
                </div>

                {/* Card Footer row */}
                <div className="px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 bg-black/30 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Lead Time */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${leadDaysColor}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Avg {leadDays} days to failure</span>
                    </span>

                    {/* Source Incidents Link */}
                    <button
                      onClick={() => onOpenSourceModal && onOpenSourceModal(pattern)}
                      className="inline-flex items-center gap-1.5 text-nexus-primary hover:text-indigo-400 font-semibold underline underline-offset-4 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{incidentsCount} source incidents</span>
                    </button>
                  </div>

                  {/* Confidence Bar */}
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <span className="text-[11px] font-mono text-nexus-textMuted">
                      Confidence: {Math.round(confidence * 100)}%
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden w-16">
                      <div
                        style={{ width: `${Math.round(confidence * 100)}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
