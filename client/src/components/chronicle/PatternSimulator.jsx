import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Zap, AlertTriangle, CheckCircle2, Loader2, ArrowRight, Clock } from 'lucide-react';
import { searchQuery } from '@/lib/api';

export default function PatternSimulator({ onOpenSourceModal }) {
  const [inputText, setInputText] = useState('bearing vibration increasing on pump');
  const [loading, setLoading] = useState(false);
  const [matchedAlert, setMatchedAlert] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSimulate = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    setHasSearched(true);
    setMatchedAlert(null);

    const { data, error } = await searchQuery(inputText.trim());
    setLoading(false);

    if (!error && data && data.failureAlert) {
      setMatchedAlert(data.failureAlert);
    } else {
      setMatchedAlert(null);
    }
  };

  return (
    <div className="glass-card p-6 border border-nexus-border space-y-4 shadow-xl bg-gradient-to-br from-white/[0.02] to-transparent">
      <div className="flex items-center justify-between border-b border-nexus-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Test Pattern Matcher</h3>
            <p className="text-xs text-nexus-textMuted">
              Simulate real-time symptom matching against historical CHRONICLE failure signatures.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-amber-400/80 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 hidden sm:inline-block">
          Live Vector & LLM Evaluation
        </span>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Describe current equipment symptoms or paste work order text (e.g., 'bearing vibration increasing on pump with thermal spike')..."
            rows={2}
            className="w-full bg-black/50 border border-nexus-border rounded-xl p-3.5 text-xs text-white placeholder:text-nexus-textMuted focus:outline-none focus:border-amber-500/60 transition-colors font-mono resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-[11px] text-nexus-textMuted">
              <span>Demo Quick Symptoms:</span>
              <button
                onClick={() => setInputText('bearing vibration increasing on pump with thermal runaway signs')}
                className="hover:text-amber-400 underline font-mono"
              >
                Bearing Vibration
              </button>
              <span>·</span>
              <button
                onClick={() => setInputText('tube fouling detected with pressure drop across heat exchanger')}
                className="hover:text-cyan-400 underline font-mono"
              >
                Tube Fouling
              </button>
            </div>

            <button
              onClick={handleSimulate}
              disabled={loading || !inputText.trim()}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Symptoms...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Match Patterns</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Result */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-8 rounded-xl bg-black/30 border border-nexus-border flex flex-col items-center justify-center text-center space-y-2"
          >
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-nexus-textMuted">
              Computing semantic distance across historical precursors & failure embeddings...
            </span>
          </motion.div>
        )}

        {!loading && hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pt-2"
          >
            {matchedAlert ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/50 shadow-2xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      CHRONICLE Failure Alert Matched
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                    High Precursor Similarity
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {matchedAlert.equipment_type || 'Equipment'}
                      </span>
                      <span className="font-bold text-white text-sm">
                        {matchedAlert.failure_mode || 'Detected Failure Mode'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono font-bold bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Avg {matchedAlert.avg_days_to_failure || 5} days to failure</span>
                  </div>
                </div>

                {Array.isArray(matchedAlert.precursor_signals) && matchedAlert.precursor_signals.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-amber-300/80 uppercase tracking-wider block">
                      Matched Warning Signs
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchedAlert.precursor_signals.map((sig, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[11px] font-medium text-amber-200">
                          ⚠ {sig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">No Significant Failure Pattern Match</h4>
                    <p className="text-[11px] text-nexus-textMuted">
                      The described symptoms do not strongly match any known critical historical failure signature.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
