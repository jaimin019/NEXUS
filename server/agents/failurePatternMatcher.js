/**
 * failurePatternMatcher.js
 * Matches incoming query context against historical failure signatures
 * using Atlas Vector Search on the failure_signatures collection.
 */

const mongoose = require('mongoose');
const FailureSignature = require('../models/FailureSignature');
const Asset = require('../models/Asset');

/** Minimum cosine similarity score to consider a match significant */
const MATCH_THRESHOLD = 0.75;

/**
 * Match a query against stored failure signatures using vector similarity.
 *
 * @param {string}   queryText      - Raw query text (for logging / fallback)
 * @param {number[]} queryEmbedding - 384-dim embedding of the query
 * @param {string}   [equipmentTag] - Optional asset tag to scope the search
 * @returns {Promise<{matched: boolean, pattern?: Object, alert?: Object}>}
 */
async function matchFailurePattern(queryText, queryEmbedding, equipmentTag = null) {
  try {
    // -------------------------------------------------------------------------
    // Optionally resolve equipment_type from the Assets collection
    // -------------------------------------------------------------------------
    let equipmentTypeFilter = null;

    if (equipmentTag) {
      try {
        const asset = await Asset.findOne({ tag: equipmentTag }).lean();
        if (asset?.asset_type) {
          equipmentTypeFilter = asset.asset_type;
          console.log(
            `[failurePatternMatcher] Resolved tag "${equipmentTag}" → asset_type "${equipmentTypeFilter}"`
          );
        }
      } catch (err) {
        console.warn(
          `[failurePatternMatcher] Could not resolve equipment type for tag "${equipmentTag}":`,
          err.message
        );
      }
    }

    // -------------------------------------------------------------------------
    // Build Atlas Vector Search pipeline on failure_signatures
    // -------------------------------------------------------------------------
    const vectorFilter = equipmentTypeFilter
      ? { equipment_type: { $eq: equipmentTypeFilter } }
      : {};

    const pipeline = [
      {
        $vectorSearch: {
          index: 'nexus_failure_patterns',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 5,
          ...(Object.keys(vectorFilter).length > 0 && { filter: vectorFilter }),
        },
      },
      {
        $project: {
          _id: 1,
          equipment_type: 1,
          failure_mode: 1,
          precursor_signals: 1,
          contributing_conditions: 1,
          avg_days_to_failure: 1,
          detection_method: 1,
          resolution: 1,
          occurrence_count: 1,
          source_incidents: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    const results = await FailureSignature.aggregate(pipeline);

    if (!results || results.length === 0) {
      console.log('[failurePatternMatcher] No failure patterns found in index');
      return { matched: false };
    }

    const topResult = results[0];
    const score = topResult.score || 0;

    console.log(
      `[failurePatternMatcher] Top pattern score: ${(score * 100).toFixed(1)}% — "${topResult.failure_mode}" on "${topResult.equipment_type}"`
    );

    // -------------------------------------------------------------------------
    // Threshold check
    // -------------------------------------------------------------------------
    if (score < MATCH_THRESHOLD) {
      console.log(
        `[failurePatternMatcher] Score ${(score * 100).toFixed(1)}% below threshold (${MATCH_THRESHOLD * 100}%) — no match`
      );
      return { matched: false };
    }

    // -------------------------------------------------------------------------
    // Build alert using template (no extra LLM call)
    // -------------------------------------------------------------------------
    const severity = score >= 0.90 ? 'HIGH' : 'MEDIUM';

    const avgDays = topResult.avg_days_to_failure != null
      ? `Average time to failure: ${topResult.avg_days_to_failure} days.`
      : '';

    const alertMessage =
      `Pattern match (${(score * 100).toFixed(1)}% similarity): ` +
      `Historical ${topResult.failure_mode} pattern detected. ` +
      `${topResult.occurrence_count || 0} previous occurrence(s). ` +
      avgDays;

    const recommendedAction =
      topResult.resolution ||
      `Inspect ${topResult.equipment_type} immediately. Check precursors: ${
        (topResult.precursor_signals || []).join(', ') || 'none on record'
      }.`;

    return {
      matched: true,
      pattern: topResult,
      alert: {
        severity,
        message: alertMessage,
        recommended_action: recommendedAction,
        avg_days_to_failure: topResult.avg_days_to_failure || null,
        source_incidents: topResult.source_incidents || [],
        similarity_score: score,
      },
    };
  } catch (err) {
    // Don't fail the whole query if pattern matching breaks (index may not be ready)
    console.warn('[failurePatternMatcher] Pattern match failed (non-fatal):', err.message);
    return { matched: false };
  }
}

module.exports = { matchFailurePattern };
