/**
 * AppShell — Root layout: Sidebar + TopBar + main content area.
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, ChevronDown } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import useNexusStore from '@/store/nexusStore';
import { uploadDocument, getDocumentStatus } from '@/lib/api';

const DOC_TYPES = ['SOP', 'Regulation', 'OEMManual', 'WorkOrder', 'IncidentReport', 'ExpertInterview', 'PIIDocument'];

// Upload Modal
function UploadModal({ onClose }) {
  const { addDocument, updateDocumentStatus } = useNexusStore();
  const [docType, setDocType] = useState('SOP');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const startPolling = (docId) => {
    const interval = setInterval(async () => {
      const { data } = await getDocumentStatus(docId);
      if (data) {
        updateDocumentStatus(docId, data.ingestion_status, {
          entity_count: data.entity_count,
          chunk_count: data.chunk_count,
        });
        if (data.ingestion_status === 'complete' || data.ingestion_status === 'failed') {
          clearInterval(interval);
          setUploadedFiles((prev) =>
            prev.map((f) => f.docId === docId ? { ...f, status: data.ingestion_status } : f)
          );
        }
      }
    }, 2000);
    return interval;
  };

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    setUploading(true);

    for (const file of acceptedFiles) {
      const entry = { name: file.name, status: 'uploading', docId: null };
      setUploadedFiles((prev) => [...prev, entry]);

      const { data, error } = await uploadDocument(file, docType);
      if (error) {
        setUploadedFiles((prev) =>
          prev.map((f) => f.name === file.name ? { ...f, status: 'error' } : f)
        );
        continue;
      }

      const docId = data.docId;
      addDocument({ _id: docId, title: file.name, doc_type: docType, ingestion_status: 'pending' });
      setUploadedFiles((prev) =>
        prev.map((f) => f.name === file.name ? { ...f, docId, status: 'queued' } : f)
      );
      startPolling(docId);
    }
    setUploading(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.tiff'] },
    multiple: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card w-full max-w-lg mx-4 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-nexus-text">Index Documents</h2>
            <p className="text-sm text-nexus-textMuted mt-0.5">Upload PDFs or images to the NEXUS knowledge base</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-nexus-muted hover:text-nexus-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Doc type selector */}
        <div className="mb-4">
          <label className="text-xs font-medium text-nexus-textMuted mb-1.5 block">Document Type</label>
          <div className="relative">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2
                text-sm text-nexus-text appearance-none cursor-pointer
                focus:outline-none focus:border-nexus-primary transition-colors"
            >
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-muted pointer-events-none" />
          </div>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive
              ? 'border-nexus-primary bg-nexus-primary/5'
              : 'border-nexus-border hover:border-nexus-primary/50 hover:bg-nexus-primary/3'}`}
        >
          <input {...getInputProps()} />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-nexus-primary' : 'text-nexus-muted'}`} />
          <p className="text-sm text-nexus-text font-medium">
            {isDragActive ? 'Drop files here…' : 'Drag & drop files, or click to browse'}
          </p>
          <p className="text-xs text-nexus-textMuted mt-1">PDF, PNG, JPG, TIFF supported</p>
        </div>

        {/* Upload list */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-nexus-bg rounded-lg">
                <span className="text-xs text-nexus-text truncate flex-1">{f.name}</span>
                <span className={`text-xs font-medium ml-2 flex-shrink-0
                  ${f.status === 'complete' ? 'text-emerald-400'
                    : f.status === 'error' ? 'text-red-400'
                    : 'text-amber-400'}`}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function AppShell() {
  const [showUpload, setShowUpload] = useState(false);
  const { sidebarCollapsed } = useNexusStore();
  const sidebarW = sidebarCollapsed ? 64 : 240;

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <Sidebar />
      <TopBar onUploadClick={() => setShowUpload(true)} />

      {/* Main content */}
      <motion.main
        animate={{ marginLeft: sidebarW }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{ marginTop: 56, minHeight: 'calc(100vh - 56px)', padding: 24 }}
        className="gradient-bg"
      >
        <Outlet />
      </motion.main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      </AnimatePresence>
    </div>
  );
}
