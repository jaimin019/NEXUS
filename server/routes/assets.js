const express = require('express');
const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/assets
// Placeholder — will return all assets (equipment) with optional filters
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  return res.json({ assets: [], total: 0 });
});

// ---------------------------------------------------------------------------
// GET /api/assets/:tag
// Placeholder — will return a single asset by tag
// ---------------------------------------------------------------------------
router.get('/:tag', async (req, res) => {
  return res.json({
    message: `Asset ${req.params.tag} — not yet implemented.`,
  });
});

// ---------------------------------------------------------------------------
// GET /api/assets/:tag/graph
// Placeholder — will return the relationship graph for an asset
// ---------------------------------------------------------------------------
router.get('/:tag/graph', async (req, res) => {
  return res.json({ nodes: [], edges: [] });
});

module.exports = router;
