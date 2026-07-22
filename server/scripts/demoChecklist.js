/**
 * demoChecklist.js
 * Pre-demo verification script for NEXUS.
 * Verifies all 11 prerequisites and data points required for the live demonstration.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const Asset = require(path.join(__dirname, '../models/Asset'));
const Document = require(path.join(__dirname, '../models/Document'));
const Chunk = require(path.join(__dirname, '../models/Chunk'));
const FailureSignature = require(path.join(__dirname, '../models/FailureSignature'));
const ComplianceMapping = require(path.join(__dirname, '../models/ComplianceMapping'));
const User = require(path.join(__dirname, '../models/User'));

async function runChecklist() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`[INFO] NEXUS Live Demo Readiness Verification Suite`);
  console.log(`${'='.repeat(70)}\n`);

  let passedCount = 0;
  let failedCount = 0;

  function check(num, name, condition, successMsg, failMsg) {
    if (condition) {
      passedCount++;
      console.log(`[OK] Check ${num}/11: ${name} — ${successMsg}`);
    } else {
      failedCount++;
      console.error(`[FAIL] Check ${num}/11: ${name} — ${failMsg}`);
    }
  }

  try {
    // Check 1: MongoDB Connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    check(1, 'MongoDB Atlas Connection', mongoose.connection.readyState === 1, 'Connected successfully to Atlas cluster', 'Could not connect to MongoDB Atlas');

    // Check 2: Demo User Exists
    const demoUser = await User.findOne({ email: 'demo@nexus.ai' });
    check(2, 'Demo User Credentials Check', demoUser && demoUser.role === 'admin' && demoUser.plant === 'Bharat Refinery Unit-3',
      `User ${demoUser?.name} (${demoUser?.email}) verified for demo login`, 'Demo user demo@nexus.ai not found or invalid attributes');

    // Check 3: Assets Count Check
    const assetCount = await Asset.countDocuments();
    check(3, 'Seeded Assets Check', assetCount >= 8,
      `${assetCount} industrial assets verified (minimum 8 required)`, `Only ${assetCount} assets found`);

    // Check 4: P-101 Asset & Relationships Check
    const p101 = await Asset.findOne({ tag: 'P-101' });
    check(4, 'P-101 Graph Topology Check', p101 && Array.isArray(p101.relationships) && p101.relationships.length >= 1,
      `P-101 verified with ${p101?.relationships?.length || 0} topological relationship(s)`, 'P-101 missing or has no relationship edges');

    // Check 5: Documents Count & Complete Status Check
    const docCount = await Document.countDocuments({ ingestion_status: 'complete' });
    check(5, 'Indexed Documents Check', docCount >= 6,
      `${docCount} complete documents verified across SOPs, WOs, and regulations`, `Only ${docCount} complete documents found`);

    // Check 6: Chunks Count Check
    const chunkCount = await Chunk.countDocuments();
    check(6, 'Knowledge Chunks Check', chunkCount >= 14,
      `${chunkCount} text chunks verified (minimum 14 required)`, `Only ${chunkCount} chunks found`);

    // Check 7: Tacit Knowledge Chunks Check
    const tacitChunk = await Chunk.findOne({ is_tacit_knowledge: true });
    check(7, 'Retiring Engineer Tacit Knowledge Check', !!tacitChunk,
      `Found expert interview chunks with is_tacit_knowledge: true (Rajesh Kumar insights)`, 'No tacit knowledge chunks found');

    // Check 8: Failure Signatures Check
    const sigCount = await FailureSignature.countDocuments();
    check(8, 'CHRONICLE Failure Patterns Check', sigCount >= 3,
      `${sigCount} failure signatures verified for pattern simulator`, `Only ${sigCount} failure signatures found`);

    // Check 9: Compliance Mappings Check
    const mapCount = await ComplianceMapping.countDocuments();
    const resolvedMap = await ComplianceMapping.findOne({ status: 'resolved' });
    check(9, 'SpectraSync Compliance Gaps Check', mapCount >= 4 && !!resolvedMap,
      `${mapCount} regulatory gap mappings verified (including resolved items and AI fixes)`, `Only ${mapCount} mappings found or no resolved items`);

    // Check 10: Vector Embeddings Dimensionality Check
    const sampleChunk = await Chunk.findOne();
    const hasValidVector = sampleChunk && Array.isArray(sampleChunk.embedding) && sampleChunk.embedding.length === 384;
    check(10, '384-Dimensional Vector Embedding Check', hasValidVector,
      `Verified 384-dimensional vector embedding arrays on stored chunks`, `Chunk embedding invalid or not 384-dim`);

    // Check 11: External API & Queue Configuration Check
    const groqKeyValid = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_');
    const redisUrlPresent = !!process.env.UPSTASH_REDIS_URL;
    check(11, 'Groq API & Upstash Redis Credentials Check', groqKeyValid && redisUrlPresent,
      `GROQ_API_KEY and UPSTASH_REDIS_URL properly configured for demo execution`, `GROQ_API_KEY or UPSTASH_REDIS_URL missing/invalid`);

  } catch (error) {
    console.error(`[ERROR] Fatal error during checklist execution:`, error.message);
    failedCount++;
  } finally {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`[SUMMARY] Total Checks: 11 | Passed: ${passedCount} | Failed: ${failedCount}`);
    if (failedCount === 0) {
      console.log(`[SUCCESS] All 11 demo checks PASSED! NEXUS is 100% ready for live demonstration.`);
    } else {
      console.error(`[FAILURE] ${failedCount} demo check(s) FAILED. Please rectify before recording.`);
    }
    console.log(`${'='.repeat(70)}\n`);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(failedCount === 0 ? 0 : 1);
  }
}

runChecklist();
