/**
 * Documents — Full document management page with upload and status polling.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Search, Filter, Trash2, ChevronDown, FileText,
  AlertCircle, CheckCircle2, RefreshCw, X
} from 'lucide-react';

import StatusBadge from '@/components/ui/StatusBadge';
import ProgressStepper from '@/components/ui/ProgressStepper';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import useNexusStore from '@/store/nexusStore';
import { getDocuments, uploadDocument, deleteDocument, getDocumentStatus } from '@/lib/api';
import { format } from 'date-fns';

const DOC_TYPES = ['All', 'SOP', 'Regulation', 'OEMManual', 'WorkOrder', 'IncidentReport', 'ExpertInterview', 'PIIDocument'];
const STATUSES = ['All', 'pending', 'parsing', 'chunking', 'embedding', 'graphing', 'complete', 'failed'];

function fmtDate(d) {
  try { return format(new Date(d), 'MMM d, yyyy HH:mm'); } catch { return '—'; }
}

export default function Documents() {
  const { documents, setDocuments, addDocument, updateDocumentStatus } = useNexusStore();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [docType, setDocType] = useState('SOP');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const pollingRefs = useRef({});

  const startPolling = useCallback((docId) => {
    if (pollingRefs.current[docId]) return;
    const interval = setInterval(async () => {
      const { data } = await getDocumentStatus(docId);
      if (data) {
        updateDocumentStatus(docId, data.ingestion_status, {
          entity_count: data.entity_count,
          chunk_count: data.chunk_count,
          graph_edges_created: data.graph_edges_created,
        });
        if (data.ingestion_status === 'complete' || data.ingestion_status === 'failed') {
          clearInterval(pollingRefs.current[docId]);
          delete pollingRefs.current[docId];
        }
      }
    }, 2000);
    pollingRefs.current[docId] = interval;
  }, [updateDocumentStatus]);

  const loadDocuments = useCallback(async () => {
    const { data } = await getDocuments(1, 100);
    if (data) {
      setDocuments(data.documents || []);
      // Resume polling for in-progress docs
      (data.documents || []).forEach((doc) => {
        if (!['complete', 'failed'].includes(doc.ingestion_status)) {
          startPolling(doc._id);
        }
      });
    }
    setLoading(false);
  }, [setDocuments, startPolling]);

  useEffect(() => {
    loadDocuments();
    return () => Object.values(pollingRefs.current).forEach(clearInterval);
  }, [loadDocuments]);

  // Drop zone
  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { data, error } = await uploadDocument(file, docType);
      if (!error && data) {
        const newDoc = {
          _id: data.docId,
          title: file.name,
          doc_type: docType,
          ingestion_status: 'pending',
          created_at: new Date().toISOString(),
        };
        addDocument(newDoc);
        startPolling(data.docId);
      }
    }
    setUploading(false);
  }, [docType, addDocument, startPolling]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.tiff'] },
    noClick: false,
  });

  // Delete
  const handleDelete = async (docId) => {
    await deleteDocument(docId);
    setDocuments(documents.filter((d) => d._id !== docId));
    setDeleteConfirm(null);
    selectedIds.delete(docId);
    setSelectedIds(new Set(selectedIds));
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) await deleteDocument(id);
    setDocuments(documents.filter((d) => !selectedIds.has(d._id)));
    setSelectedIds(new Set());
  };

  // Filtered documents
  const filtered = documents.filter((d) => {
    const matchSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || d.doc_type === filterType;
    const matchStatus = filterStatus === 'All' || d.ingestion_status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const allSelected = filtered.length > 0 && filtered.every((d) => selectedIds.has(d._id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((d) => d._id)));
  };

  const toggleOne = (id) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-5 max-w-[1600px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-nexus-text">Document Library</h2>
          <p className="text-sm text-nexus-textMuted mt-0.5">
            {documents.length} documents indexed · {documents.filter(d => d.ingestion_status === 'complete').length} complete
          </p>
        </div>
        <button onClick={loadDocuments} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-nexus-border text-nexus-textMuted hover:text-nexus-text text-xs transition-all duration-200">
          <RefreshCw style={{ color: "#9B8B70", width: "14px", height: "14px" }} />Refresh
        </button>
      </div>

      {/* Upload Zone */}
      <div className="card p-5">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-sm font-semibold text-nexus-text flex-1">Upload New Documents</h3>
          <div className="relative">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="nexus-input border border-nexus-border rounded-lg pl-3 pr-8 py-1.5 text-xs appearance-none cursor-pointer focus:outline-none focus:border-nexus-primary transition-colors"
            >
              {DOC_TYPES.slice(1).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nexus-muted pointer-events-none" />
          </div>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
            ${isDragActive || isDragOver
              ? 'border-nexus-primary bg-nexus-primary/5 scale-[1.01]'
              : 'border-nexus-border hover:border-nexus-primary/50 hover:bg-nexus-primary/3'}`}
        >
          <input {...getInputProps()} />
          <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${isDragActive ? 'text-nexus-primary' : 'text-nexus-muted'}`} />
          <p className="text-sm text-nexus-text font-medium">
            {uploading ? 'Uploading…' : isDragActive ? 'Drop files here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-nexus-textMuted mt-1">PDF, PNG, JPG, TIFF — Type: {docType}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="nexus-input w-full border border-nexus-border rounded-lg pl-9 pr-4 py-2
              text-sm placeholder:text-nexus-muted
              focus:outline-none focus:border-nexus-primary transition-colors"
          />
        </div>

        {/* Type filter */}
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nexus-muted" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="nexus-input border border-nexus-border rounded-lg pl-8 pr-6 py-2 text-xs appearance-none cursor-pointer focus:outline-none focus:border-nexus-primary transition-colors">
            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-nexus-muted pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="nexus-input border border-nexus-border rounded-lg px-3 py-2 text-xs appearance-none cursor-pointer focus:outline-none focus:border-nexus-primary transition-colors">
            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-nexus-muted pointer-events-none" />
        </div>

        {/* Bulk delete */}
        {selectedIds.size > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'rgba(194,59,46,0.1)', border: '1px solid rgba(194,59,46,0.2)', color: '#B87070' }}
          >
            <Trash2 style={{ color: "#9B8B70", width: "14px", height: "14px" }} />
            Delete {selectedIds.size} selected
          </motion.button>
        )}
      </div>

      {/* Document Table */}
      <div style={{ background: "#FDFAF6", border: "1px solid #E2D9C8", borderRadius: "12px", overflow: "hidden" }} style={{ background: "#FDFAF6", border: "1px solid #E2D9C8" }}>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3,4,5].map(i => <LoadingSkeleton key={i} height={52} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-nexus-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-nexus-textMuted">No documents found</p>
            <p className="text-xs text-nexus-muted mt-1">
              {search || filterType !== 'All' || filterStatus !== 'All'
                ? 'Try adjusting your filters'
                : 'Upload documents using the zone above'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-nexus-border bg-nexus-bg/50">
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="rounded border-nexus-border bg-nexus-bg accent-nexus-primary cursor-pointer" />
                  </th>
                  {['Title', 'Type', 'Pipeline Status', 'Entities', 'Chunks', 'Uploaded', ''].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-nexus-muted py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((doc, i) => (
                    <motion.tr
                      key={doc._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="table-row-hover border-b border-nexus-border/40 last:border-0 group"
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <input type="checkbox" checked={selectedIds.has(doc._id)} onChange={() => toggleOne(doc._id)}
                          className="rounded border-nexus-border bg-nexus-bg accent-nexus-primary cursor-pointer" />
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-nexus-muted flex-shrink-0 mt-0.5" />
                          <span className="text-nexus-text text-xs font-medium truncate" title={doc.title}>{doc.title}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge value={doc.doc_type} type="doc_type" />
                      </td>

                      {/* Pipeline stepper */}
                      <td className="py-3.5 px-4">
                        {doc.ingestion_status === 'failed' ? (
                          <div className="flex items-center gap-1 text-xs" style={{ color: '#B87070' }}>
                            <AlertCircle style={{ color: "#9B8B70", width: "14px", height: "14px" }} /> Failed
                          </div>
                        ) : doc.ingestion_status === 'complete' ? (
                          <div className="flex items-center gap-1 text-xs" style={{ color: '#D4B896' }}>
                            <CheckCircle2 style={{ color: "#9B8B70", width: "14px", height: "14px" }} /> Complete
                          </div>
                        ) : (
                          <ProgressStepper currentStep={doc.ingestion_status} compact />
                        )}
                      </td>

                      {/* Entities */}
                      <td className="py-3.5 px-4 text-nexus-textMuted text-xs">{doc.entity_count ?? '—'}</td>

                      {/* Chunks */}
                      <td className="py-3.5 px-4 text-nexus-textMuted text-xs">{doc.chunk_count ?? '—'}</td>

                      {/* Uploaded */}
                      <td className="py-3.5 px-4 text-nexus-muted text-xs whitespace-nowrap">{fmtDate(doc.created_at)}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        {deleteConfirm === doc._id ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleDelete(doc._id)} className="text-xs font-medium" style={{ color: '#B87070' }}>Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-nexus-muted hover:text-nexus-text">
                              <X style={{ color: "#9B8B70", width: "14px", height: "14px" }} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(doc._id)}
                            className="opacity-0 group-hover:opacity-100 text-nexus-muted transition-all"
                            style={{ color: 'var(--text-faint)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#B87070'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
