/**
 * StatusBadge — colored pill for doc_type and ingestion_status.
 */
import { Loader2 } from 'lucide-react';

const DOC_TYPE_COLORS = {
  SOP: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  Regulation: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  OEMManual: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  WorkOrder: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  IncidentReport: 'bg-red-500/15 text-red-300 border-red-500/30',
  ExpertInterview: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PIIDocument: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

const STATUS_COLORS = {
  complete: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  failed: 'bg-red-500/15 text-red-300 border-red-500/30',
  pending: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  parsing: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  chunking: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  embedding: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  graphing: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

const PROCESSING_STATUSES = new Set(['parsing', 'chunking', 'embedding', 'graphing']);

export default function StatusBadge({ value, type = 'status' }) {
  if (!value) return null;

  const colorClass =
    type === 'doc_type'
      ? (DOC_TYPE_COLORS[value] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30')
      : (STATUS_COLORS[value] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30');

  const isProcessing = type === 'status' && PROCESSING_STATUSES.has(value);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {isProcessing && (
        <Loader2 className="w-3 h-3 animate-spin" />
      )}
      {value}
    </span>
  );
}
