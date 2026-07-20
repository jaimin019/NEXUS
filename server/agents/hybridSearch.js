/**
 * hybridSearch.js
 * Combines Atlas Vector Search (semantic) + MongoDB full-text search (keyword)
 * using Reciprocal Rank Fusion (RRF) for a best-of-both-worlds result set.
 */

const mongoose = require('mongoose');
const Chunk = require('../models/Chunk');

/**
 * Reciprocal Rank Fusion constant.
 * k=60 is the standard value from the original RRF paper (Cormack et al., 2009).
 */
const RRF_K = 60;

/**
 * Run Hybrid Search over the chunks collection.
 *
 * @param {string}   queryText       - Raw query string for keyword search
 * @param {number[]} queryEmbedding  - 384-dim embedding vector for semantic search
 * @param {Object}   filters         - Optional MongoDB filter object (e.g. { doc_type: { $eq: 'SOP' } })
 * @param {number}   topK            - Number of final results to return (default 8)
 * @returns {Promise<Object[]>}      - Ranked result objects with rrf_score
 */
async function hybridSearch(queryText, queryEmbedding, filters = {}, topK = 8) {
  const startTime = Date.now();

  // ---------------------------------------------------------------------------
  // Search A — Atlas Vector Search (semantic similarity)
  // ---------------------------------------------------------------------------
  const vectorSearchPromise = (async () => {
    try {
      // Build the vectorSearch filter — Atlas $vectorSearch filter must only include
      // indexed filter fields; strip any Mongoose-specific operators if needed.
      const vectorFilter = buildVectorFilter(filters);

      const pipeline = [
        {
          $vectorSearch: {
            index: 'nexus_semantic_search',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 150,
            limit: 20,
            ...(Object.keys(vectorFilter).length > 0 && { filter: vectorFilter }),
          },
        },
        {
          $project: {
            _id: 1,
            text: 1,
            raw_text: 1,
            doc_id: 1,
            doc_type: 1,
            equipment_tags: 1,
            section_header: 1,
            page_number: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ];

      const results = await Chunk.aggregate(pipeline);
      console.log(`[hybridSearch] Vector search returned ${results.length} results`);
      return results;
    } catch (err) {
      console.warn('[hybridSearch] Vector search failed (index may not be ready):', err.message);
      return [];
    }
  })();

  // ---------------------------------------------------------------------------
  // Search B — MongoDB Full-Text Search (keyword / BM25)
  // ---------------------------------------------------------------------------
  const textSearchPromise = (async () => {
    try {
      // Text search requires a $text operator; merge with caller filters
      const textQuery = { $text: { $search: queryText }, ...filters };

      const results = await Chunk.find(textQuery, {
        score: { $meta: 'textScore' },
        text: 1,
        raw_text: 1,
        doc_id: 1,
        doc_type: 1,
        equipment_tags: 1,
        section_header: 1,
        page_number: 1,
      })
        .sort({ score: { $meta: 'textScore' } })
        .limit(20)
        .lean();

      console.log(`[hybridSearch] Text search returned ${results.length} results`);
      return results;
    } catch (err) {
      console.warn('[hybridSearch] Text search failed (index may not exist yet):', err.message);
      return [];
    }
  })();

  // ---------------------------------------------------------------------------
  // Run both searches in parallel
  // ---------------------------------------------------------------------------
  const [vectorResults, textResults] = await Promise.all([
    vectorSearchPromise,
    textSearchPromise,
  ]);

  // ---------------------------------------------------------------------------
  // Reciprocal Rank Fusion (RRF)
  // ---------------------------------------------------------------------------
  const scoreMap = new Map(); // _id (string) -> { doc, rrf_score }

  const applyRRF = (results, searchLabel) => {
    results.forEach((doc, rank) => {
      const id = doc._id.toString();
      const rrfContribution = 1 / (RRF_K + rank + 1);

      if (scoreMap.has(id)) {
        scoreMap.get(id).rrf_score += rrfContribution;
      } else {
        scoreMap.set(id, {
          _id: doc._id,
          text: doc.text,
          raw_text: doc.raw_text,
          doc_id: doc.doc_id,
          doc_type: doc.doc_type,
          equipment_tags: doc.equipment_tags || [],
          section_header: doc.section_header || null,
          page_number: doc.page_number || null,
          rrf_score: rrfContribution,
        });
      }
    });
  };

  applyRRF(vectorResults, 'vector');
  applyRRF(textResults, 'text');

  // Sort by descending RRF score and take topK
  const ranked = Array.from(scoreMap.values())
    .sort((a, b) => b.rrf_score - a.rrf_score)
    .slice(0, topK);

  console.log(
    `[hybridSearch] RRF fusion complete — ${scoreMap.size} unique docs -> top ${ranked.length} returned (${Date.now() - startTime}ms)`
  );

  return ranked;
}

/**
 * Convert a generic Mongoose-style filter to a form safe for Atlas $vectorSearch filter.
 * Atlas vector search filter only supports simple equality / $eq / $in on indexed filter fields.
 */
function buildVectorFilter(filters) {
  const safe = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined) continue;
    // If value is already an operator object (e.g. { $eq: 'SOP' }), keep it
    if (typeof value === 'object' && !Array.isArray(value)) {
      safe[key] = value;
    } else {
      safe[key] = { $eq: value };
    }
  }

  return safe;
}

module.exports = { hybridSearch };
