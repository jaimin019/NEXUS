/**
 * chronicle.js
 * CHRONICLE API routes
 * Endpoints for Failure Pattern Mining, Pattern Retrieval, and Expert Knowledge Capture.
 */

const express = require('express');
const router = express.Router();
const FailureSignature = require('../models/FailureSignature');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const cacheMiddleware = require('../middleware/cache');
const { mineFailurePatterns } = require('../agents/chronicleAgent');
const { generateExpertQuestions, saveExpertResponse } = require('../agents/expertCaptureAgent');

// ---------------------------------------------------------------------------
// POST /api/chronicle/mine
// Triggers mineFailurePatterns() asynchronously in the background
// ---------------------------------------------------------------------------
router.post('/mine', async (req, res) => {
  console.log(`[POST /api/chronicle/mine] Triggering background failure pattern mining...`);

  // Run asynchronously without awaiting so API responds immediately
  mineFailurePatterns().catch((err) => {
    console.error(`[chronicle/mine] Background job error:`, err.message);
  });

  return res.json({ status: 'mining_started', message: 'Failure pattern mining started in background.' });
});

// ---------------------------------------------------------------------------
// GET /api/chronicle/patterns
// Returns all FailureSignature documents sorted by occurrence_count desc
// ---------------------------------------------------------------------------
router.get('/patterns', cacheMiddleware(30), async (req, res) => {
  console.log(`[GET /api/chronicle/patterns] Fetching all mined failure patterns...`);

  const patterns = await FailureSignature.find()
    .sort({ occurrence_count: -1 })
    .populate('source_incidents', 'title doc_type created_at')
    .lean();

  return res.json({
    patterns,
    total: patterns.length,
  });
});

// ---------------------------------------------------------------------------
// GET /api/chronicle/patterns/:id
// Returns single failure pattern with full source incident details
// ---------------------------------------------------------------------------
router.get('/patterns/:id', async (req, res) => {
  console.log(`[GET /api/chronicle/patterns/${req.params.id}] Fetching pattern details...`);

  const pattern = await FailureSignature.findById(req.params.id)
    .populate('source_incidents')
    .lean();

  if (!pattern) {
    return res.status(404).json({ error: 'Failure pattern not found.' });
  }

  return res.json({ pattern });
});

// ---------------------------------------------------------------------------
// POST /api/chronicle/expert/questions
// Body: { engineerId, engineerName }
// Generates 5 targeted interview questions (supports POST and GET)
// ---------------------------------------------------------------------------
router.all('/expert/questions', async (req, res) => {
  const engineerId = req.body.engineerId || req.body.engineer_id || req.query.engineerId || req.query.engineer_id || 'retiring-expert';
  const engineerName = req.body.engineerName || req.body.engineer_name || req.query.engineerName || req.query.engineer_name || 'Senior Engineer';
  console.log(`[${req.method} /api/chronicle/expert/questions] Generating questions for ${engineerName}`);

  const questions = await generateExpertQuestions(engineerId, engineerName);
  return res.json({ questions });
});

// ---------------------------------------------------------------------------
// POST /api/chronicle/expert/save
// Body: { engineerId, engineerName, question, answer, equipmentTags[] }
// Saves expert response into semantic index and updates asset completeness
// ---------------------------------------------------------------------------
router.post('/expert/save', async (req, res) => {
  const engineerId = req.body.engineerId || req.body.engineer_id || 'expert';
  const engineerName = req.body.engineerName || req.body.engineer_name || 'Senior Engineer';
  const question = req.body.question || req.body.question_text;
  const answer = req.body.answer || req.body.answer_text;
  const equipmentTags = req.body.equipmentTags || req.body.equipment_tags || req.body.related_assets || [];

  if (!question || !answer) {
    return res.status(400).json({ error: 'Both question and answer are required.' });
  }

  console.log(`[POST /api/chronicle/expert/save] Saving response from ${engineerName || engineerId}`);
  const result = await saveExpertResponse(
    engineerId || 'expert',
    engineerName || 'Senior Engineer',
    question,
    answer,
    Array.isArray(equipmentTags) ? equipmentTags : [equipmentTags].filter(Boolean)
  );

  return res.status(201).json(result);
});

// ---------------------------------------------------------------------------
// GET /api/chronicle/expert/interviews
// Returns all ExpertInterview documents with their chunks, sorted by created_at desc
// ---------------------------------------------------------------------------
router.get('/expert/interviews', async (req, res) => {
  console.log(`[GET /api/chronicle/expert/interviews] Fetching all expert interviews...`);

  const interviews = await Document.find({ doc_type: 'ExpertInterview' })
    .sort({ created_at: -1 })
    .lean();

  const docIds = interviews.map((d) => d._id);
  const chunks = await Chunk.find({ doc_id: { $in: docIds } }).lean();

  // Attach chunks to each interview document
  const chunkMap = new Map();
  chunks.forEach((c) => {
    const idStr = c.doc_id.toString();
    if (!chunkMap.has(idStr)) {
      chunkMap.set(idStr, []);
    }
    chunkMap.get(idStr).push(c);
  });

  const enrichedInterviews = interviews.map((d) => ({
    ...d,
    chunks: chunkMap.get(d._id.toString()) || [],
  }));

  return res.json({
    interviews: enrichedInterviews,
    total: enrichedInterviews.length,
  });
});

// ---------------------------------------------------------------------------
// GET /api/chronicle (General overview / summary)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  const [patternsCount, interviewsCount] = await Promise.all([
    FailureSignature.countDocuments(),
    Document.countDocuments({ doc_type: 'ExpertInterview' }),
  ]);

  return res.json({
    status: 'ok',
    patterns_mined: patternsCount,
    expert_interviews: interviewsCount,
  });
});

module.exports = router;
