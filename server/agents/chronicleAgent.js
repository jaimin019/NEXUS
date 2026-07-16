/**
 * chronicleAgent.js
 * CHRONICLE — Failure Pattern Miner
 * Mines maintenance logs, incident reports, and inspection records
 * to extract historical failure signatures using Groq LLM and Xenova embeddings.
 */

const Groq = require('groq-sdk');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const FailureSignature = require('../models/FailureSignature');
const { embedTexts } = require('../ingestion/embedder');

let groqClient = null;
function getGroqClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const SYSTEM_PROMPT = `You are an industrial failure pattern analyst. Analyze these maintenance/incident documents and extract failure signatures. For each failure event found, return a JSON array of objects with: { equipment_type, failure_mode, precursor_signals: [], contributing_conditions: [], avg_days_to_failure (estimate if not explicit, use null if unknown), detection_method, resolution }. Respond ONLY with a valid JSON array. No markdown.`;

/**
 * Mine failure patterns from IncidentReport, WorkOrder, and InspectionRecord documents.
 * @returns {Promise<{patternsFound: number, patternsNew: number, patternsUpdated: number}>}
 */
async function mineFailurePatterns() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`[chronicleAgent] Starting failure pattern mining job...`);
  console.log(`${'='.repeat(70)}\n`);

  let patternsFound = 0;
  let patternsNew = 0;
  let patternsUpdated = 0;

  try {
    // 1. Fetch all relevant documents
    const targetDocTypes = ['IncidentReport', 'WorkOrder', 'InspectionRecord'];
    const documents = await Document.find({ doc_type: { $in: targetDocTypes } }).lean();

    console.log(`[chronicleAgent] Found ${documents.length} target documents for mining (${targetDocTypes.join(', ')})`);

    if (documents.length === 0) {
      console.log(`[chronicleAgent] No documents found to mine.`);
      return { patternsFound: 0, patternsNew: 0, patternsUpdated: 0 };
    }

    // 2. Fetch chunks for each document and group into batches of 5
    const docDataList = [];
    for (const doc of documents) {
      const chunks = await Chunk.find({ doc_id: doc._id }).sort({ chunk_index: 1 }).lean();
      const combinedText = chunks.map(c => c.text || c.raw_text || '').join('\n\n');
      docDataList.push({
        _id: doc._id,
        title: doc.title,
        doc_type: doc.doc_type,
        equipment_tags: doc.equipment_tags || [],
        text: combinedText || doc.title,
      });
    }

    const BATCH_SIZE = 5;
    for (let i = 0; i < docDataList.length; i += BATCH_SIZE) {
      const batch = docDataList.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(docDataList.length / BATCH_SIZE);

      console.log(`[chronicleAgent] Processing batch ${batchNum}/${totalBatches} (${batch.length} documents)...`);

      const batchContext = batch.map((d, idx) => `--- Document ${idx + 1}: ${d.title} [Type: ${d.doc_type}, Equipment: ${d.equipment_tags.join(', ') || 'N/A'}] ---\n${d.text}`).join('\n\n');

      let extractedSignatures = [];
      try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Analyze the following documents and extract all failure signatures:\n\n${batchContext}` }
          ],
          temperature: 0.1,
          max_tokens: 3000,
        });

        let responseText = completion.choices[0]?.message?.content?.trim() || '[]';
        // Clean markdown code fence if present
        if (responseText.startsWith('```')) {
          responseText = responseText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
        }

        extractedSignatures = JSON.parse(responseText);
        if (!Array.isArray(extractedSignatures)) {
          console.warn(`[chronicleAgent] Groq returned non-array JSON, defaulting to empty array.`);
          extractedSignatures = [];
        }
      } catch (llmErr) {
        console.error(`[chronicleAgent] LLM extraction error for batch ${batchNum}: ${llmErr.message}`);
        continue;
      }

      console.log(`[chronicleAgent] Extracted ${extractedSignatures.length} failure signatures from batch ${batchNum}`);
      patternsFound += extractedSignatures.length;

      // Process each extracted signature
      const batchDocIds = batch.map(d => d._id);
      for (const sig of extractedSignatures) {
        try {
          if (!sig.equipment_type || !sig.failure_mode) {
            continue;
          }

          const eqTypeClean = sig.equipment_type.trim();
          const failModeClean = sig.failure_mode.trim();
          const precursors = Array.isArray(sig.precursor_signals) ? sig.precursor_signals : [];
          const conditions = Array.isArray(sig.contributing_conditions) ? sig.contributing_conditions : [];

          // Embed the failure_mode + precursor_signals joined as a single string
          const textToEmbed = `${failModeClean} ${precursors.join(' ')}`.trim();
          const embeddings = await embedTexts([textToEmbed]);
          const embeddingVector = embeddings[0] || [];

          // Check if a similar FailureSignature already exists (match by equipment_type + failure_mode)
          const existingPattern = await FailureSignature.findOne({
            equipment_type: { $regex: new RegExp(`^${eqTypeClean}$`, 'i') },
            failure_mode: { $regex: new RegExp(`^${failModeClean}$`, 'i') }
          });

          if (existingPattern) {
            // Increment occurrence_count, merge precursor_signals (deduplicate)
            const mergedPrecursors = Array.from(new Set([...(existingPattern.precursor_signals || []), ...precursors]));
            const mergedConditions = Array.from(new Set([...(existingPattern.contributing_conditions || []), ...conditions]));
            
            await FailureSignature.findByIdAndUpdate(existingPattern._id, {
              $inc: { occurrence_count: 1 },
              $set: {
                precursor_signals: mergedPrecursors,
                contributing_conditions: mergedConditions,
                avg_days_to_failure: sig.avg_days_to_failure !== null && sig.avg_days_to_failure !== undefined ? sig.avg_days_to_failure : existingPattern.avg_days_to_failure,
                detection_method: sig.detection_method || existingPattern.detection_method,
                resolution: sig.resolution || existingPattern.resolution,
                embedding: embeddingVector.length > 0 ? embeddingVector : existingPattern.embedding,
              },
              $addToSet: { source_incidents: { $each: batchDocIds } }
            });

            patternsUpdated++;
            console.log(`[chronicleAgent] Updated existing signature: "${failModeClean}" on "${eqTypeClean}" (occurrence: ${existingPattern.occurrence_count + 1})`);
          } else {
            // Insert FailureSignature document with embedding
            await FailureSignature.create({
              equipment_type: eqTypeClean,
              failure_mode: failModeClean,
              precursor_signals: precursors,
              contributing_conditions: conditions,
              avg_days_to_failure: typeof sig.avg_days_to_failure === 'number' ? sig.avg_days_to_failure : null,
              detection_method: sig.detection_method || null,
              resolution: sig.resolution || null,
              occurrence_count: 1,
              source_incidents: batchDocIds,
              embedding: embeddingVector,
            });

            patternsNew++;
            console.log(`[chronicleAgent] Created new signature: "${failModeClean}" on "${eqTypeClean}"`);
          }
        } catch (itemErr) {
          console.error(`[chronicleAgent] Error saving pattern "${sig.failure_mode}": ${itemErr.message}`);
        }
      }
    }

    console.log(`\n[chronicleAgent] ✅ Mining complete — Found: ${patternsFound}, New: ${patternsNew}, Updated: ${patternsUpdated}`);
    return { patternsFound, patternsNew, patternsUpdated };
  } catch (error) {
    console.error(`[chronicleAgent] Fatal error during failure pattern mining: ${error.message}`);
    throw error;
  }
}

module.exports = { mineFailurePatterns };
