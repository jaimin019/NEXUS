/**
 * AlertCard — active alert card. Golden Parchment palette.
 */
import { AlertTriangle, X, ExternalLink, CalendarPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const formatTitle = (str) => {
  if (!str) return 'Alert';
  return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function AlertCard({ title, message, equipment, occurrences, avgDaysToFailure, onDismiss, onViewDetails }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex-shrink-0 w-80 card relative"
      style={{
        borderLeft: '3px solid #C49A3C',
        background: '#FDFAF6',
        padding: 20,
      }}
    >
      {/* Dismiss */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 flex items-center justify-center rounded-md transition-colors"
          style={{ color: '#C4B49A', background: 'transparent', width: 24, height: 24 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#F0EBE1'; e.currentTarget.style.color = '#2C2416'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C4B49A'; }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3 pr-6">
        <div>
          <span className="badge badge-caution mb-2">Attention</span>
          <p style={{ color: '#2C2416', fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{formatTitle(title)}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="space-y-1 mb-3">
        {equipment && (
          <p style={{ color: '#6B5B3E', fontSize: 13 }}>
            <span style={{ fontWeight: 700 }}>Equipment:</span> {equipment}
          </p>
        )}
        {occurrences !== undefined && (
          <p style={{ color: '#6B5B3E', fontSize: 13 }}>
            {occurrences} historical occurrences
          </p>
        )}
        {avgDaysToFailure && (
          <p style={{ color: '#6B5B3E', fontSize: 13 }}>
            Avg. time to failure: <span className="gradient-text font-bold">{avgDaysToFailure} days</span>
          </p>
        )}
      </div>

      {/* Message (Resolution text) */}
      {message && (
        <p className="line-clamp-2 mb-4" style={{ color: '#9B8B70', fontSize: 12, fontStyle: 'italic' }}>
          {message}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #E2D9C8' }}>
        <button
          onClick={() => {
            if (onViewDetails) onViewDetails();
            else navigate('/chronicle');
          }}
          className="btn-ghost flex-1 justify-center"
        >
          <ExternalLink size={14} /> View in CHRONICLE
        </button>
        <button className="btn-primary" style={{ padding: '8px 12px' }}>
          <CalendarPlus size={14} /> Schedule
        </button>
      </div>
    </motion.div>
  );
}
