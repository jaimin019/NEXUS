/**
 * routes/assets.js
 * Asset (equipment) registry API for NEXUS.
 *
 * Endpoints:
 *   GET    /api/assets          — all assets sorted by knowledge_completeness asc
 *   GET    /api/assets/:tag     — single asset with linked docs and failure signatures
 *   PATCH  /api/assets/:tag     — update mutable asset fields
 */

const express = require('express');
const router = express.Router();

const Asset = require('../models/Asset');
const Chunk = require('../models/Chunk');
const FailureSignature = require('../models/FailureSignature');

// ---------------------------------------------------------------------------
// GET /api/assets
// Returns all assets sorted by knowledge_completeness ascending
// (lowest completeness first — surfaces knowledge gaps to the UI)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  const t0 = Date.now();

  try {
    const assets = await Asset.find({})
      .sort({ knowledge_completeness: 1 }) // gaps first
      .lean();

    res.setHeader('X-Response-Time', `${Date.now() - t0}ms`);
    return res.json({
      assets,
      total: assets.length,
      queryTime: Date.now() - t0,
    });
  } catch (err) {
    console.error('[assets/GET /] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to fetch assets' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/assets/:tag
// Returns a single asset enriched with:
//   - All its relationships
//   - Linked document chunks (via equipment_tags lookup)
//   - All failure signatures
// ---------------------------------------------------------------------------
router.get('/:tag', async (req, res) => {
  const t0 = Date.now();
  const { tag } = req.params;

  try {
    const asset = await Asset.findOne({ tag: tag.toUpperCase() })
      .populate('failure_signatures')
      .lean();

    if (!asset) {
      return res.status(404).json({ error: `Asset with tag "${tag}" not found` });
    }

    // Fetch linked document chunks that reference this tag
    const linkedChunks = await Chunk.find(
      { equipment_tags: tag.toUpperCase() },
      {
        _id: 1,
        doc_id: 1,
        doc_type: 1,
        section_header: 1,
        page_number: 1,
        chunk_index: 1,
        text: 1,
        confidence_score: 1,
      }
    )
      .limit(50) // cap for response size
      .lean();

    // Group chunks by doc_id for a cleaner response
    const docMap = {};
    for (const chunk of linkedChunks) {
      const docKey = chunk.doc_id?.toString();
      if (!docMap[docKey]) {
        docMap[docKey] = {
          doc_id: chunk.doc_id,
          doc_type: chunk.doc_type,
          chunks: [],
        };
      }
      docMap[docKey].chunks.push({
        chunk_index: chunk.chunk_index,
        section_header: chunk.section_header,
        page_number: chunk.page_number,
        text: chunk.text,
        confidence_score: chunk.confidence_score,
      });
    }

    res.setHeader('X-Response-Time', `${Date.now() - t0}ms`);
    return res.json({
      asset,
      linked_documents: Object.values(docMap),
      failure_signatures: asset.failure_signatures || [],
      queryTime: Date.now() - t0,
    });
  } catch (err) {
    console.error(`[assets/GET /:tag] Error for tag "${tag}":`, err.message);
    return res.status(500).json({ error: err.message || 'Failed to fetch asset' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/assets/:tag
// Update mutable operational fields on an asset.
// Allowed fields: open_work_orders, active_permits, health_indicators,
//                 knowledge_completeness, criticality, last_maintenance
// ---------------------------------------------------------------------------
const ALLOWED_PATCH_FIELDS = new Set([
  'open_work_orders',
  'active_permits',
  'health_indicators',
  'knowledge_completeness',
  'criticality',
  'last_maintenance',
  'name',
  'plant_area',
  'asset_type',
]);

router.patch('/:tag', async (req, res) => {
  const t0 = Date.now();
  const { tag } = req.params;

  try {
    // Filter out any disallowed / non-patchable keys
    const updates = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (ALLOWED_PATCH_FIELDS.has(key)) {
        updates[key] = value;
      } else {
        console.warn(`[assets/PATCH /:tag] Ignoring disallowed field: "${key}"`);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
        allowed_fields: [...ALLOWED_PATCH_FIELDS],
      });
    }

    const updated = await Asset.findOneAndUpdate(
      { tag: tag.toUpperCase() },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: `Asset with tag "${tag}" not found` });
    }

    res.setHeader('X-Response-Time', `${Date.now() - t0}ms`);
    return res.json({
      asset: updated,
      updated_fields: Object.keys(updates),
      queryTime: Date.now() - t0,
    });
  } catch (err) {
    console.error(`[assets/PATCH /:tag] Error for tag "${tag}":`, err.message);

    if (err.name === 'ValidationError') {
      return res.status(422).json({ error: 'Validation failed', details: err.message });
    }
    return res.status(500).json({ error: err.message || 'Failed to update asset' });
  }
});

module.exports = router;
