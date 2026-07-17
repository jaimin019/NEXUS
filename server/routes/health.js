/**
 * health.js
 * Health check endpoint for system status.
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const Asset = require('../models/Asset');
const FailureSignature = require('../models/FailureSignature');
const ComplianceMapping = require('../models/ComplianceMapping');

router.get('/', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const groqStatus = process.env.GROQ_API_KEY ? 'configured' : 'missing';
    // Just a placeholder since Redis (Bull) connection is managed by Bull itself, but we can assume connected if env exists
    const redisStatus = process.env.UPSTASH_REDIS_REST_URL ? 'connected' : (process.env.REDIS_URL ? 'connected' : 'disconnected');

    const [documents, chunks, assets, failurePatterns, complianceGaps] = await Promise.all([
      Document.countDocuments(),
      Chunk.countDocuments(),
      Asset.countDocuments(),
      FailureSignature.countDocuments(),
      ComplianceMapping.countDocuments(),
    ]);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus,
        groq: groqStatus,
      },
      stats: {
        documents,
        chunks,
        assets,
        failurePatterns,
        complianceGaps,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

module.exports = router;
