/**
 * AlertCard — failure pattern / active alert card.
 */
import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const SEVERITY_STYLES = {
  HIGH: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/15 text-red-300',
    icon: 'text-red-400',
  },
  MEDIUM: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/15 text-amber-300',
    icon: 'text-amber-400',
  },
  LOW: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/5',
    badge: 'bg-emerald-500/15 text-emerald-300',
    icon: 'text-emerald-400',
  },
};

export default function AlertCard({ severity = 'MEDIUM', title, message, equipment, occurrences, avgDaysToFailure, onDismiss, onViewDetails }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.MEDIUM;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={`flex-shrink-0 w-72 glass-card border-l-4 ${s.border} ${s.bg} p-4 relative`}
    >
      {/* Dismiss */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-nexus-muted hover:text-nexus-text transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-2 mb-3 pr-5">
        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${s.icon}`} />
        <div>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${s.badge} mr-2`}>
            {severity}
          </span>
          <p className="text-sm font-semibold text-nexus-text mt-1 leading-snug">{title}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="space-y-1 mb-3">
        {equipment && (
          <p className="text-xs text-nexus-textMuted">
            <span className="text-nexus-text font-medium">Equipment:</span> {equipment}
          </p>
        )}
        {occurrences !== undefined && (
          <p className="text-xs text-nexus-textMuted">
            <span className="text-nexus-text font-medium">{occurrences}</span> occurrences recorded
          </p>
        )}
        {avgDaysToFailure !== null && avgDaysToFailure !== undefined && (
          <p className="text-xs text-nexus-textMuted">
            Avg time to failure: <span className="text-nexus-warning font-medium">{avgDaysToFailure}d</span>
          </p>
        )}
      </div>

      {message && (
        <p className="text-xs text-nexus-textMuted mb-3 line-clamp-2">{message}</p>
      )}

      {/* Action */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="flex items-center gap-1 text-xs text-nexus-primary hover:text-nexus-accent transition-colors font-medium"
        >
          View Details <ExternalLink className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
}
