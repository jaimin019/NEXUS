const express = require('express');
const router = express.Router();

// ---------------------------------------------------------------------------
// POST /api/query
// Placeholder — will handle RAG queries against the knowledge base
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  return res.json({
    message: 'Query endpoint — not yet implemented.',
    query: req.body.query || null,
  });
});

// ---------------------------------------------------------------------------
// GET /api/query/history
// Placeholder — will return past queries for the session / user
// ---------------------------------------------------------------------------
router.get('/history', async (req, res) => {
  return res.json({ history: [] });
});

module.exports = router;
