/**
 * routes/query.js
 * ORACLE Query API — the core intelligence layer for NEXUS.
 *
 * Endpoints:
 *   POST /api/query/search   — full RAG pipeline with hybrid search
 *   POST /api/query/voice    — same as /search, marks response for TTS
 *   GET  /api/query/suggestions — smart query suggestions
 */

const express = require('express');
const router = express.Router();

const { embedTexts } = require('../ingestion/embedder');
const { hybridSearch } = require('../agents/hybridSearch');
const { generateAnswer } = require('../agents/ragAgent');
const { matchFailurePattern } = require('../agents/failurePatternMatcher');
const { checkSafetyPrecedence } = require('../agents/safetyChecker');

// ---------------------------------------------------------------------------
// Hardcoded smart suggestions
// ---------------------------------------------------------------------------
const SMART_SUGGESTIONS = [
  'What is the isolation procedure for HX-204?',
  'Show recent failures on centrifugal pumps',
  'Which SOPs conflict with OISD-GDN-206?',
  'What work orders are open on Unit 3?',
  'Explain the hot work permit procedure',
  'What did the last inspection of P-101 find?',
];

// ---------------------------------------------------------------------------
// Helper — extract all unique equipment tags from a set of chunks
// ---------------------------------------------------------------------------
function extractEquipmentTags(chunks) {
  const tagSet = new Set();
  for (const chunk of chunks) {
    for (const tag of chunk.equipment_tags || []) {
      if (tag) tagSet.add(tag);
    }
  }
  return [...tagSet];
}

// ---------------------------------------------------------------------------
// Core search pipeline — shared by /search and /voice
// ---------------------------------------------------------------------------
async function runSearchPipeline(query, filters = {}, conversationHistory = []) {
  const t0 = Date.now();

  // Step 1 — Embed the query
  console.log(`[query/search] Embedding query: "${query.slice(0, 80)}..."`);
  const [queryEmbedding] = await embedTexts([query]);

  // Build Atlas-safe filter from caller-supplied filters
  const atlasFilter = {};
  if (filters.doc_type) {
    atlasFilter.doc_type = { $eq: filters.doc_type };
  }
  if (filters.equipment_tags && filters.equipment_tags.length > 0) {
    // Atlas filter for arrays: $in operator on a filter-indexed field
    atlasFilter.equipment_tags = { $in: filters.equipment_tags };
  }

  // Step 2 — Hybrid search (vector + text, RRF fusion)
  console.log('[query/search] Running hybrid search…');
  const chunks = await hybridSearch(query, queryEmbedding, atlasFilter, 8);

  // Collect all equipment tags from retrieved chunks for downstream checks
  const allEquipmentTags = extractEquipmentTags(chunks);

  // Step 3 — Run failure pattern matcher + safety checker in parallel (non-blocking)
  // Primary equipment tag = first tag found in top chunk, or first filter tag
  const primaryTag =
    (chunks[0]?.equipment_tags?.[0]) ||
    (filters.equipment_tags?.[0]) ||
    null;

  console.log('[query/search] Running pattern matcher and safety checker in parallel…');
  const [failureResult, safetyResult] = await Promise.all([
    matchFailurePattern(query, queryEmbedding, primaryTag),
    checkSafetyPrecedence(allEquipmentTags),
  ]);

  // Step 4 — Generate answer with ORACLE (Groq RAG)
  console.log('[query/search] Generating answer with ORACLE…');
  const { answer, sources, model } = await generateAnswer(query, chunks, conversationHistory);

  const queryTime = Date.now() - t0;
  console.log(`[query/search] Pipeline complete in ${queryTime}ms`);

  return {
    answer,
    sources,
    model,
    ...(failureResult.matched && { failureAlert: failureResult.alert }),
    safetyWarnings: safetyResult.warnings,
    queryTime,
    chunksRetrieved: chunks.length,
  };
}

// ---------------------------------------------------------------------------
// POST /api/query and POST /api/query/search
// ---------------------------------------------------------------------------
router.post(['/', '/search'], async (req, res) => {
  const t0 = Date.now();

  const { query, filters = {}, conversationHistory = [] } = req.body;

  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: 'query is required and must be a non-empty string' });
  }

  try {
    const result = await runSearchPipeline(query.trim(), filters, conversationHistory);
    res.setHeader('X-Response-Time', `${Date.now() - t0}ms`);
    return res.json(result);
  } catch (err) {
    console.error('[query/search] Pipeline error:', err.message);
    return res.status(500).json({
      error: err.message || 'Search pipeline failed',
      queryTime: Date.now() - t0,
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/query/voice
// Same pipeline as /search — voiceMode flag tells the frontend to use
// Web Speech Synthesis to read the answer aloud.
// ---------------------------------------------------------------------------
router.post('/voice', async (req, res) => {
  const t0 = Date.now();

  const { transcript, filters = {}, conversationHistory = [] } = req.body;

  if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
    return res.status(400).json({ error: 'transcript is required and must be a non-empty string' });
  }

  try {
    const result = await runSearchPipeline(transcript.trim(), filters, conversationHistory);
    res.setHeader('X-Response-Time', `${Date.now() - t0}ms`);
    return res.json({ ...result, voiceMode: true });
  } catch (err) {
    console.error('[query/voice] Pipeline error:', err.message);
    return res.status(500).json({
      error: err.message || 'Voice query pipeline failed',
      voiceMode: true,
      queryTime: Date.now() - t0,
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/query/suggestions
// ---------------------------------------------------------------------------
router.get('/suggestions', (_req, res) => {
  return res.json({ suggestions: SMART_SUGGESTIONS });
});

module.exports = router;
