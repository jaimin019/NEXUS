/**
 * compliance.js
 * SpectraSync Compliance API routes
 * Endpoints for running compliance audits against SOPs, fetching gap dashboards,
 * filtering gaps, and resolving gap items.
 */

const express = require('express');
const router = express.Router();
const ComplianceMapping = require('../models/ComplianceMapping');
const { runComplianceAudit, getComplianceDashboard, resolveGap } = require('../agents/complianceAgent');

// ---------------------------------------------------------------------------
// POST /api/compliance/audit
// Body: { regulationDocId: string }
// Runs runComplianceAudit asynchronously in the background
// ---------------------------------------------------------------------------
router.post('/audit', async (req, res) => {
  const { regulationDocId } = req.body;

  if (!regulationDocId) {
    return res.status(400).json({ error: 'regulationDocId is required in request body.' });
  }

  console.log(`[POST /api/compliance/audit] Triggering background compliance audit for doc: ${regulationDocId}`);

  runComplianceAudit(regulationDocId).catch((err) => {
    console.error(`[compliance/audit] Background audit error for ${regulationDocId}:`, err.message);
  });

  return res.json({
    status: 'audit_started',
    regulationDocId,
    message: 'Compliance audit started asynchronously in background.',
  });
});

// ---------------------------------------------------------------------------
// GET /api/compliance/dashboard
// Returns getComplianceDashboard() result
// ---------------------------------------------------------------------------
router.get('/dashboard', async (req, res) => {
  console.log(`[GET /api/compliance/dashboard] Fetching compliance dashboard stats...`);
  const dashboard = await getComplianceDashboard();
  return res.json(dashboard);
});

// ---------------------------------------------------------------------------
// GET /api/compliance/gaps
// Query params: severity (Critical|Major|Minor), status (open|in_review|resolved)
// Returns filtered ComplianceMapping list with populated affected SOP titles
// ---------------------------------------------------------------------------
router.get('/gaps', async (req, res) => {
  const { severity, status } = req.query;
  console.log(`[GET /api/compliance/gaps] Fetching gaps (severity=${severity || 'ANY'}, status=${status || 'ANY'})...`);

  const filter = {};
  if (severity) {
    filter.gap_severity = severity;
  }
  if (status) {
    filter.status = status;
  }

  const gaps = await ComplianceMapping.find(filter)
    .populate('affected_sop_ids', 'title doc_type')
    .sort({ created_at: -1 })
    .lean();

  return res.json({
    gaps,
    total: gaps.length,
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/compliance/gaps/:id/resolve
// Body: { resolution_note: string }
// Resolves gap with note and timestamp
// ---------------------------------------------------------------------------
router.patch('/gaps/:id/resolve', async (req, res) => {
  const { resolution_note } = req.body;
  console.log(`[PATCH /api/compliance/gaps/${req.params.id}/resolve] Resolving gap...`);

  try {
    const updated = await resolveGap(req.params.id, resolution_note);
    return res.json({ gap: updated });
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/compliance/gaps/:id/status
// Body: { status: 'in_review'|'resolved' }
// Updates status field only
// ---------------------------------------------------------------------------
router.patch('/gaps/:id/status', async (req, res) => {
  const { status } = req.body;
  console.log(`[PATCH /api/compliance/gaps/${req.params.id}/status] Updating status -> ${status}`);

  if (!['open', 'in_review', 'resolved'].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be 'open', 'in_review', or 'resolved'." });
  }

  const updated = await ComplianceMapping.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true }
  ).populate('affected_sop_ids', 'title doc_type');

  if (!updated) {
    return res.status(404).json({ error: 'Compliance mapping not found.' });
  }

  return res.json({ gap: updated });
});

// ---------------------------------------------------------------------------
// GET /api/compliance (Fallback/general endpoint)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  const dashboard = await getComplianceDashboard();
  return res.json(dashboard);
});

module.exports = router;
