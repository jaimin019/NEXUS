/**
 * StatusBadge — styled pill for doc_type and ingestion_status. Golden Parchment palette.
 */
import { Loader2 } from 'lucide-react';

const PROCESSING_STATUSES = new Set(['parsing', 'chunking', 'embedding', 'graphing']);

export default function StatusBadge({ value, type = 'status' }) {
  if (!value) return null;

  let badgeClass = 'badge ';

  if (type === 'doc_type') {
    badgeClass += 'badge-muted';
  } else {
    if (value === 'complete') {
      badgeClass += 'badge-positive';
    } else if (value === 'failed') {
      badgeClass += 'badge-critical';
    } else if (value === 'pending' || PROCESSING_STATUSES.has(value)) {
      badgeClass += 'badge-caution';
    } else {
      badgeClass += 'badge-muted';
    }
  }

  const isProcessing = type === 'status' && PROCESSING_STATUSES.has(value);

  return (
    <span className={badgeClass}>
      {isProcessing && (
        <Loader2 className="w-3 h-3 animate-spin" />
      )}
      {value}
    </span>
  );
}
