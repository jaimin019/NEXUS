/**
 * integrationTest.js
 * Comprehensive integration test suite for NEXUS backend architecture.
 * Verifies 10 critical system components and integration points.
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
const { embedTexts } = require(path.join(__dirname, '../ingestion/embedder'));

async function runTests() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`[INFO] NEXUS Backend Integration Test Suite`);
  console.log(`${'='.repeat(70)}\n`);

  let passedCount = 0;
  let failedCount = 0;

  function pass(testNum, testName, detail) {
    passedCount++;
    console.log(`[PASS] Test ${testNum}/10: ${testName} — ${detail}`);
  }

  function fail(testNum, testName, errorMsg) {
    failedCount++;
    console.error(`[FAIL] Test ${testNum}/10: ${testName} — ${errorMsg}`);
  }

  // Test 1: Environment Variables Validation
  try {
    const requiredEnv = ['MONGODB_URI', 'GROQ_API_KEY', 'PORT', 'JWT_SECRET'];
    const missing = requiredEnv.filter(k => !process.env[k]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    pass(1, 'Environment Variables Configuration', `All ${requiredEnv.length} essential environment variables present (PORT=${process.env.PORT})`);
  } catch (err) {
    fail(1, 'Environment Variables Configuration', err.message);
  }

  // Test 2: MongoDB Connection & Schema Initialization
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    const modelNames = Object.keys(mongoose.models);
    if (modelNames.length < 6) {
      throw new Error(`Expected at least 6 registered models, found ${modelNames.length}`);
    }
    pass(2, 'MongoDB Connection & Schema Initialization', `Connected to Atlas, ${modelNames.length} Mongoose models registered`);
  } catch (err) {
    fail(2, 'MongoDB Connection & Schema Initialization', err.message);
  }

  // Test 3: Local Vector Embedding Generation (Xenova/all-MiniLM-L6-v2)
  try {
    const embeddings = await embedTexts(['NEXUS industrial knowledge verification']);
    if (!Array.isArray(embeddings) || embeddings.length !== 1 || !Array.isArray(embeddings[0]) || embeddings[0].length !== 384) {
      throw new Error(`Expected 384-dimensional embedding vector, got dimension ${embeddings[0]?.length || 'unknown'}`);
    }
    pass(3, 'Local Vector Embedding Engine (384-dim)', `Successfully generated 384-dim semantic embedding via Xenova/all-MiniLM-L6-v2`);
  } catch (err) {
    fail(3, 'Local Vector Embedding Engine (384-dim)', err.message);
  }

  // Test 4: Demo User & Role Verification
  try {
    const demoUser = await User.findOne({ email: 'demo@nexus.ai' });
    if (!demoUser) {
      throw new Error("Demo user 'demo@nexus.ai' not found in database. Run 'npm run seed' first.");
    }
    if (demoUser.role !== 'admin' || demoUser.plant !== 'Bharat Refinery Unit-3') {
      throw new Error(`Demo user attributes incorrect: role=${demoUser.role}, plant=${demoUser.plant}`);
    }
    pass(4, 'User Authentication & Role Integrity', `Verified user ${demoUser.name} (${demoUser.email}) with role: ${demoUser.role}`);
  } catch (err) {
    fail(4, 'User Authentication & Role Integrity', err.message);
  }

  // Test 5: SYNAPSE Asset Topology & Relationship Integrity
  try {
    const assetCount = await Asset.countDocuments();
    if (assetCount < 8) {
      throw new Error(`Expected at least 8 seeded assets, found ${assetCount}`);
    }
    const p101 = await Asset.findOne({ tag: 'P-101' });
    if (!p101 || !Array.isArray(p101.relationships) || p101.relationships.length < 1) {
      throw new Error("Asset 'P-101' missing or lacks relationship edges.");
    }
    pass(5, 'SYNAPSE Asset Topology & Graph Relationships', `${assetCount} assets indexed, P-101 has ${p101.relationships.length} topological relationship(s)`);
  } catch (err) {
    fail(5, 'SYNAPSE Asset Topology & Graph Relationships', err.message);
  }

  // Test 6: Document Ingestion & Chunk Indexing Verification
  try {
    const docCount = await Document.countDocuments();
    const chunkCount = await Chunk.countDocuments();
    if (docCount < 6 || chunkCount < 14) {
      throw new Error(`Expected >=6 documents and >=14 chunks, found ${docCount} docs and ${chunkCount} chunks`);
    }
    const incompleteDocs = await Document.countDocuments({ ingestion_status: { $ne: 'complete' } });
    if (incompleteDocs > 0) {
      throw new Error(`${incompleteDocs} document(s) have incomplete ingestion status`);
    }
    pass(6, 'Document Ingestion Pipeline & Chunk Indexing', `${docCount} complete documents and ${chunkCount} vector-indexed chunks verified`);
  } catch (err) {
    fail(6, 'Document Ingestion Pipeline & Chunk Indexing', err.message);
  }

  // Test 7: Expert Capture & Tacit Knowledge Indexing
  try {
    const tacitChunks = await Chunk.find({ is_tacit_knowledge: true });
    if (tacitChunks.length < 1) {
      throw new Error("No tacit knowledge chunks found with 'is_tacit_knowledge: true'");
    }
    const sample = tacitChunks[0];
    if (!Array.isArray(sample.embedding) || sample.embedding.length !== 384) {
      throw new Error("Tacit knowledge chunk missing 384-dimensional embedding vector");
    }
    pass(7, 'Expert Capture & Tacit Knowledge Indexing', `${tacitChunks.length} tacit knowledge chunk(s) found and verified with 384-dim embeddings`);
  } catch (err) {
    fail(7, 'Expert Capture & Tacit Knowledge Indexing', err.message);
  }

  // Test 8: CHRONICLE Failure Signatures & Precursor Signals
  try {
    const sigCount = await FailureSignature.countDocuments();
    if (sigCount < 3) {
      throw new Error(`Expected >=3 failure signatures, found ${sigCount}`);
    }
    const bearingSig = await FailureSignature.findOne({ failure_mode: 'bearing_failure' });
    if (!bearingSig || !bearingSig.precursor_signals.includes('bearing_temperature_rise')) {
      throw new Error("Bearing failure signature missing or lacks required precursor signals.");
    }
    pass(8, 'CHRONICLE Failure Signatures & Precursor Analysis', `${sigCount} failure signatures verified, bearing failure includes precursor tracking`);
  } catch (err) {
    fail(8, 'CHRONICLE Failure Signatures & Precursor Analysis', err.message);
  }

  // Test 9: SpectraSync Compliance Gap Detection & AI Amendments
  try {
    const mappingCount = await ComplianceMapping.countDocuments();
    if (mappingCount < 4) {
      throw new Error(`Expected >=4 compliance mappings, found ${mappingCount}`);
    }
    const criticalGap = await ComplianceMapping.findOne({ clause_id: '4.3.2', gap_severity: 'Critical' });
    if (!criticalGap || !criticalGap.ai_suggested_amendment) {
      throw new Error("Critical compliance gap for clause 4.3.2 missing or lacks ai_suggested_amendment.");
    }
    pass(9, 'SpectraSync Compliance Audit & AI Amendment Drafting', `${mappingCount} regulatory mappings verified, critical gas testing gap includes AI corrective text`);
  } catch (err) {
    fail(9, 'SpectraSync Compliance Audit & AI Amendment Drafting', err.message);
  }

  // Test 10: Semantic Similarity & Keyword Retrieval Readiness
  try {
    const p101Chunks = await Chunk.find({ equipment_tags: 'P-101' });
    if (p101Chunks.length < 1) {
      throw new Error("No chunks tagged with equipment tag 'P-101' found for retrieval test.");
    }
    const hasProcedureText = p101Chunks.some(c => c.text.toLowerCase().includes('isolation') || c.text.toLowerCase().includes('bearing'));
    if (!hasProcedureText) {
      throw new Error("Chunks for P-101 lack expected isolation or bearing procedure text.");
    }
    pass(10, 'ORACLE Retrieval Readiness & Equipment Tag Indexing', `${p101Chunks.length} chunks tagged with P-101 verified for hybrid semantic search`);
  } catch (err) {
    fail(10, 'ORACLE Retrieval Readiness & Equipment Tag Indexing', err.message);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`[SUMMARY] Total Tests: 10 | Passed: ${passedCount} | Failed: ${failedCount}`);
  if (failedCount === 0) {
    console.log(`[SUCCESS] All 10 integration tests PASSED! Backend architecture is healthy.`);
  } else {
    console.error(`[FAILURE] ${failedCount} integration test(s) FAILED. Please review above.`);
  }
  console.log(`${'='.repeat(70)}\n`);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(failedCount === 0 ? 0 : 1);
}

runTests();
