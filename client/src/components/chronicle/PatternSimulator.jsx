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
    <div className="card p-6 space-y-4 shadow-xl bg-gradient-to-br from-white/[0.02] to-transparent">
      <div className="flex items-center justify-between border-b border-nexus-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg border text-[#C4A882]" style={{ background: 'rgba(196,124,47,0.1)', borderColor: 'rgba(196,124,47,0.2)' }}>
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-nexus-text tracking-tight">Test Pattern Matcher</h3>
            <p className="text-xs text-nexus-textMuted">
              Simulate real-time symptom matching against historical CHRONICLE failure signatures.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-full border hidden sm:inline-block" style={{ background: 'rgba(196,124,47,0.1)', borderColor: 'rgba(196,124,47,0.2)', color: 'rgba(196,124,47,0.8)' }}>
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
            className="w-full bg-nexus-surface border border-nexus-border rounded-xl p-3.5 text-xs text-nexus-text placeholder:text-nexus-textMuted focus:outline-none focus:border-[#C4A882] transition-colors font-mono resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-[11px] text-nexus-textMuted">
              <span>Demo Quick Symptoms:</span>
              <button
                onClick={() => setInputText('bearing vibration increasing on pump with thermal runaway signs')}
                className="hover:text-[#C4A882] underline font-mono"
              >
                Bearing Vibration
              </button>
              <span>·</span>
              <button
                onClick={() => setInputText('tube fouling detected with pressure drop across heat exchanger')}
                className="hover:text-[#C49A3C] underline font-mono"
              >
                Tube Fouling
              </button>
            </div>

            <button
              onClick={handleSimulate}
              disabled={loading || !inputText.trim()}
              className="px-5 py-2 rounded-xl text-black font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-[0.98]" style={{ background: '#C4A882', boxShadow: '0 4px 14px 0 rgba(196,124,47,0.2)' }}
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
            className="p-8 rounded-xl bg-nexus-surface border border-nexus-border flex flex-col items-center justify-center text-center space-y-2"
          >
            <div className="w-8 h-8 rounded-full border-2 border-[#C4A882] border-t-transparent animate-spin" />
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
              <div className="p-4 rounded-xl border-2 shadow-2xl space-y-3 relative overflow-hidden" style={{ background: 'rgba(196,124,47,0.1)', borderColor: 'rgba(196,124,47,0.5)' }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(196,124,47,0.1)' }} />

                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'rgba(196,124,47,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#C4A882] animate-pulse" />
                    <span className="text-xs font-bold text-[#C4A882] uppercase tracking-wider">
                      CHRONICLE Failure Alert Matched
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border" style={{ color: '#C4A882', background: 'rgba(196,124,47,0.2)', borderColor: 'rgba(196,124,47,0.3)' }}>
                    High Precursor Similarity
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border" style={{ background: 'rgba(196,124,47,0.2)', color: '#C4A882', borderColor: 'rgba(196,124,47,0.3)' }}>
                        {matchedAlert.equipment_type || 'Equipment'}
                      </span>
                      <span className="font-bold text-nexus-text text-sm">
                        {matchedAlert.failure_mode || 'Detected Failure Mode'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded border" style={{ color: '#B87070', background: 'rgba(194,59,46,0.1)', borderColor: 'rgba(194,59,46,0.2)' }}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Avg {matchedAlert.avg_days_to_failure || 5} days to failure</span>
                  </div>
                </div>

                {Array.isArray(matchedAlert.precursor_signals) && matchedAlert.precursor_signals.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: 'rgba(196,124,47,0.8)' }}>
                      Matched Warning Signs
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchedAlert.precursor_signals.map((sig, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md border text-[11px] font-medium" style={{ background: 'rgba(196,124,47,0.15)', borderColor: 'rgba(196,124,47,0.3)', color: '#C4A882' }}>
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: 'rgba(107,143,78,0.1)', borderColor: 'rgba(107,143,78,0.3)' }}>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#D4B896' }} />
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: '#D4B896' }}>No Significant Failure Pattern Match</h4>
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
