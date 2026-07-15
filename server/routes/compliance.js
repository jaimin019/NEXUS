const express = require('express');
const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/compliance
// Placeholder — will return compliance gap analysis
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  return res.json({ mappings: [], total: 0 });
});

// ---------------------------------------------------------------------------
// GET /api/compliance/:id
// Placeholder — will return a single compliance mapping
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  return res.json({
    message: `Compliance mapping ${req.params.id} — not yet implemented.`,
  });
});

// ---------------------------------------------------------------------------
// POST /api/compliance/scan
// Placeholder — will trigger a compliance scan against a regulation
// ---------------------------------------------------------------------------
router.post('/scan', async (req, res) => {
  return res.json({
    message: 'Compliance scan — not yet implemented.',
    regulation_id: req.body.regulation_id || null,
  });
});

module.exports = router;
