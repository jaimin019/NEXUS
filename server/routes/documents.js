const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const Asset = require('../models/Asset');
const { addIngestionJob } = require('../queues/ingestionQueue');

const router = express.Router();

// Multer config — store uploads in server/uploads/
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ---------------------------------------------------------------------------
// POST /api/documents/upload
// Accepts multipart file, creates Document record, enqueues ingestion job
// ---------------------------------------------------------------------------
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const { title, doc_type, source_system, uploaded_by, equipment_tags, regulatory_refs } = req.body;

  const doc = await Document.create({
    title: title || req.file.originalname,
    doc_type: doc_type || 'SOP',
    source_system: source_system || null,
    uploaded_by: uploaded_by || 'system',
    file_path: req.file.path,
    equipment_tags: equipment_tags ? JSON.parse(equipment_tags) : [],
    regulatory_refs: regulatory_refs ? JSON.parse(regulatory_refs) : [],
    ingestion_status: 'pending',
  });

  // Enqueue for ingestion pipeline
  await addIngestionJob(doc._id.toString(), req.file.path, doc.doc_type);

  return res.status(201).json({ docId: doc._id, status: 'queued' });
});

// ---------------------------------------------------------------------------
// GET /api/documents/:id/status
// Returns ingestion progress for a single document
// ---------------------------------------------------------------------------
router.get('/:id/status', async (req, res) => {
  const doc = await Document.findById(req.params.id).select(
    'ingestion_status entity_count chunk_count graph_edges_created'
  );

  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  return res.json({
    ingestion_status: doc.ingestion_status,
    entity_count: doc.entity_count,
    chunk_count: doc.chunk_count,
    graph_edges_created: doc.graph_edges_created,
  });
});

// ---------------------------------------------------------------------------
// GET /api/documents
// Lists documents with pagination (page, limit), sorted by created_at desc
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [documents, total] = await Promise.all([
    Document.find().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Document.countDocuments(),
  ]);

  return res.json({
    documents,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/documents/:id
// Deletes document, all its chunks, removes from asset relationships
// ---------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const docId = req.params.id;

    const doc = await Document.findById(docId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    console.log(`[documents] Deleting document ${docId} and related data`);

    // 1. Delete all chunks associated with this document
    const chunkResult = await Chunk.deleteMany({ doc_id: docId });
    console.log(`[documents] Deleted ${chunkResult.deletedCount} chunks`);

    // 2. Remove this document's references from asset relationships
    if (doc.equipment_tags && doc.equipment_tags.length > 0) {
      for (const tag of doc.equipment_tags) {
        try {
          await Asset.findOneAndUpdate(
            { tag },
            {
              $pull: {
                relationships: { source_doc_id: docId },
              },
            }
          );
        } catch (assetErr) {
          console.warn(`[documents] Failed to clean asset "${tag}": ${assetErr.message}`);
        }
      }
      console.log(`[documents] Cleaned relationships from ${doc.equipment_tags.length} assets`);
    }

    // 3. Delete the uploaded file from disk
    if (doc.file_path) {
      try {
        if (fs.existsSync(doc.file_path)) {
          fs.unlinkSync(doc.file_path);
          console.log(`[documents] Deleted file: ${doc.file_path}`);
        }
      } catch (fsErr) {
        console.warn(`[documents] Could not delete file: ${fsErr.message}`);
      }
    }

    // 4. Delete the document record itself
    await Document.findByIdAndDelete(docId);

    console.log(`[documents] Document ${docId} fully deleted`);
    return res.json({ deleted: true });
  } catch (error) {
    console.error(`[documents] Delete error: ${error.message}`);
    return res.status(500).json({ error: `Failed to delete document: ${error.message}` });
  }
});

module.exports = router;
