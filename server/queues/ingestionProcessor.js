/**
 * Main Ingestion Pipeline Processor
 * Orchestrates the 4-stage sequential pipeline:
 *   pending → parsing → chunking → embedding → graphing → complete
 */

const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { parseDocument } = require('../ingestion/parser');
const { extractEntities } = require('../ingestion/entityExtractor');
const { chunkDocument } = require('../ingestion/chunker');
const { embedTexts } = require('../ingestion/embedder');
const { buildGraph } = require('../ingestion/graphBuilder');

/**
 * Update document ingestion status in MongoDB.
 */
async function updateStatus(docId, status, extra = {}) {
  await Document.findByIdAndUpdate(docId, { ingestion_status: status, ...extra });
  console.log(`[pipeline] Status updated → ${status}${Object.keys(extra).length ? ` (${JSON.stringify(extra)})` : ''}`);
}

/**
 * Save chunks to MongoDB in batches of 50.
 */
async function saveChunksInBatches(chunks, batchSize = 50) {
  let totalSaved = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    await Chunk.insertMany(batch, { ordered: false });
    totalSaved += batch.length;
    console.log(`[pipeline] Saved chunk batch ${Math.floor(i / batchSize) + 1} (${totalSaved}/${chunks.length})`);
  }

  return totalSaved;
}

/**
 * Process a single document ingestion job through all 4 stages.
 * @param {Object} job - Bull queue job
 * @param {string} job.data.docId - MongoDB document ID
 * @param {string} job.data.filePath - Path to uploaded file
 * @param {string} job.data.docType - Document type enum value
 */
async function processIngestionJob(job) {
  const { docId, filePath, docType } = job.data;

  console.log(`\n${'='.repeat(70)}`);
  console.log(`[pipeline] Starting ingestion — docId: ${docId}`);
  console.log(`[pipeline] File: ${filePath}`);
  console.log(`[pipeline] Type: ${docType}`);
  console.log(`${'='.repeat(70)}\n`);

  try {
    // ─────────────────────────────────────────────────────────────────────
    // Stage 1: PARSING
    // ─────────────────────────────────────────────────────────────────────
    console.log('[pipeline] ▶ Stage 1/4: PARSING');
    await updateStatus(docId, 'parsing');

    const { text, pageCount, ocrUsed } = await parseDocument(filePath, docType);

    await Document.findByIdAndUpdate(docId, {
      page_count: pageCount,
      ocr_used: ocrUsed,
    });

    console.log(`[pipeline] ✓ Stage 1 complete — ${text.length} chars extracted\n`);

    // ─────────────────────────────────────────────────────────────────────
    // Stage 2: ENTITY EXTRACTION
    // ─────────────────────────────────────────────────────────────────────
    console.log('[pipeline] ▶ Stage 2/4: ENTITY EXTRACTION');

    const entities = await extractEntities(text, docType);

    // Persist entities to the document
    await Document.findByIdAndUpdate(docId, {
      equipment_tags: entities.equipment_tags,
      regulatory_refs: entities.regulatory_refs,
      entity_count:
        entities.equipment_tags.length +
        entities.regulatory_refs.length +
        entities.relationships.length,
    });

    console.log(`[pipeline] ✓ Stage 2 complete — ${entities.equipment_tags.length} tags, ${entities.regulatory_refs.length} refs\n`);

    // ─────────────────────────────────────────────────────────────────────
    // Stage 3a: CHUNKING
    // ─────────────────────────────────────────────────────────────────────
    console.log('[pipeline] ▶ Stage 3/4: CHUNKING + EMBEDDING');
    await updateStatus(docId, 'chunking');

    // Fetch the document title for metadata
    const doc = await Document.findById(docId).select('title').lean();
    const metadata = {
      equipment_tags: entities.equipment_tags,
      title: doc?.title || 'Unknown',
    };

    const chunks = await chunkDocument(text, docType, metadata);
    console.log(`[pipeline] Chunking produced ${chunks.length} chunks`);

    // ─────────────────────────────────────────────────────────────────────
    // Stage 3b: EMBEDDING
    // ─────────────────────────────────────────────────────────────────────
    await updateStatus(docId, 'embedding');

    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await embedTexts(chunkTexts);

    // Prepare chunk documents for MongoDB
    const chunkDocs = chunks.map((chunk, idx) => ({
      doc_id: docId,
      chunk_index: chunk.chunk_index,
      text: chunk.text,
      raw_text: chunk.raw_text,
      embedding: embeddings[idx] || [],
      doc_type: docType,
      equipment_tags: entities.equipment_tags,
      regulatory_refs: entities.regulatory_refs,
      section_header: chunk.section_header,
      page_number: chunk.page_number,
      confidence_score: 1.0,
      is_tacit_knowledge: docType === 'ExpertInterview',
    }));

    // Save chunks in batches
    const savedCount = await saveChunksInBatches(chunkDocs);

    await Document.findByIdAndUpdate(docId, {
      chunk_count: savedCount,
    });

    console.log(`[pipeline] ✓ Stage 3 complete — ${savedCount} chunks embedded & saved\n`);

    // ─────────────────────────────────────────────────────────────────────
    // Stage 4: GRAPH BUILDING
    // ─────────────────────────────────────────────────────────────────────
    console.log('[pipeline] ▶ Stage 4/4: GRAPH BUILDING');
    await updateStatus(docId, 'graphing');

    const graphResult = await buildGraph(entities, docId);

    await Document.findByIdAndUpdate(docId, {
      graph_edges_created: graphResult.edgesCreated,
    });

    console.log(`[pipeline] ✓ Stage 4 complete — ${graphResult.assetsUpserted} assets, ${graphResult.edgesCreated} edges\n`);

    // ─────────────────────────────────────────────────────────────────────
    // COMPLETE
    // ─────────────────────────────────────────────────────────────────────
    await updateStatus(docId, 'complete');

    console.log(`${'='.repeat(70)}`);
    console.log(`[pipeline] ✅ Ingestion COMPLETE for docId: ${docId}`);
    console.log(`${'='.repeat(70)}\n`);

    return {
      docId,
      status: 'complete',
      pageCount,
      ocrUsed,
      entityCount: entities.equipment_tags.length + entities.regulatory_refs.length,
      chunkCount: savedCount,
      assetsUpserted: graphResult.assetsUpserted,
      edgesCreated: graphResult.edgesCreated,
    };
  } catch (error) {
    console.error(`\n[pipeline] ❌ FAILED for docId: ${docId}`);
    console.error(`[pipeline] Error: ${error.message}`);
    console.error(`[pipeline] Stack: ${error.stack}\n`);

    // Mark document as failed with error details
    try {
      await updateStatus(docId, 'failed', {
        ingestion_error: error.message,
      });
    } catch (updateErr) {
      console.error(`[pipeline] Could not update failure status: ${updateErr.message}`);
    }

    // Re-throw so Bull marks the job as failed
    throw error;
  }
}

module.exports = { processIngestionJob };
