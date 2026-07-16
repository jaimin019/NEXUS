/**
 * expertCaptureAgent.js
 * CHRONICLE — Expert Knowledge Capture
 * Generates targeted interview questions for retiring/experienced engineers
 * and captures their tacit operational responses into the semantic index and knowledge graph.
 */

const Groq = require('groq-sdk');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const Asset = require('../models/Asset');
const { embedTexts } = require('../ingestion/embedder');

let groqClient = null;
function getGroqClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const INTERVIEW_SYSTEM_PROMPT = `You are helping capture retiring industrial engineer expertise. Generate 5 targeted interview questions to extract undocumented operational knowledge about the following equipment and situations. Questions must be specific, referencing actual equipment tags and document titles. Return ONLY a JSON array of question strings.`;

/**
 * Generate 5 targeted interview questions based on engineer activity and low-documentation assets.
 * @param {string} engineerId - ID or identifier of the engineer
 * @param {string} engineerName - Display name of the engineer
 * @returns {Promise<string[]>} Array of 5 question strings
 */
async function generateExpertQuestions(engineerId, engineerName) {
  console.log(`[expertCaptureAgent] Generating interview questions for ${engineerName} (${engineerId})...`);

  try {
    // 1. Query documents uploaded by engineer or where engineer might be noted
    const docs = await Document.find({
      $or: [
        { uploaded_by: engineerId },
        { uploaded_by: engineerName },
        { title: { $regex: new RegExp(engineerName, 'i') } }
      ]
    }).select('title equipment_tags').lean();

    let docTitles = docs.map(d => d.title);
    let tagsFromDocs = [];
    docs.forEach(d => {
      if (Array.isArray(d.equipment_tags)) {
        tagsFromDocs.push(...d.equipment_tags);
      }
    });

    // If no specific docs found, fetch general recent maintenance/incident docs for context
    if (docTitles.length === 0) {
      const recentDocs = await Document.find().sort({ created_at: -1 }).limit(5).select('title equipment_tags').lean();
      docTitles = recentDocs.map(d => d.title);
      recentDocs.forEach(d => {
        if (Array.isArray(d.equipment_tags)) {
          tagsFromDocs.push(...d.equipment_tags);
        }
      });
    }

    tagsFromDocs = Array.from(new Set(tagsFromDocs));

    // 2. Find Asset nodes with knowledge_completeness < 0.5 that appear in those documents (or overall low-doc assets)
    let lowDocAssets = [];
    if (tagsFromDocs.length > 0) {
      lowDocAssets = await Asset.find({
        tag: { $in: tagsFromDocs },
        knowledge_completeness: { $lt: 0.5 }
      }).select('tag name knowledge_completeness').lean();
    }

    // If fewer than 3 low-doc assets found, pull the lowest completeness assets across the plant
    if (lowDocAssets.length < 3) {
      const moreAssets = await Asset.find({ knowledge_completeness: { $lt: 0.5 } })
        .sort({ knowledge_completeness: 1 })
        .limit(5)
        .select('tag name knowledge_completeness')
        .lean();
      
      const existingTags = new Set(lowDocAssets.map(a => a.tag));
      moreAssets.forEach(a => {
        if (!existingTags.has(a.tag)) {
          lowDocAssets.push(a);
        }
      });
    }

    // If still no assets in DB, fallback to demo equipment tags
    if (lowDocAssets.length === 0) {
      lowDocAssets = [
        { tag: 'P-101', name: 'Centrifugal Pump P-101' },
        { tag: 'HX-204', name: 'Heat Exchanger HX-204' },
        { tag: 'V-302', name: 'Control Valve V-302' }
      ];
    }

    if (docTitles.length === 0) {
      docTitles = ['Unit-3 Turnaround Report', 'SOP-MAINT-017 Centrifugal Pump Overhaul'];
    }

    console.log(`[expertCaptureAgent] Context ready — Low-doc assets: ${lowDocAssets.map(a => a.tag).join(', ')}, Docs: ${docTitles.length}`);

    // 3. Send to Groq
    const userMessage = `Engineer: ${engineerName}. Low-documentation equipment: ${lowDocAssets.map(a => a.tag).join(', ')}. Related documents: ${docTitles.slice(0, 5).join(', ')}`;

    const client = getGroqClient();
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: INTERVIEW_SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    let responseText = completion.choices[0]?.message?.content?.trim() || '[]';
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
    }

    let questions = [];
    try {
      questions = JSON.parse(responseText);
      if (!Array.isArray(questions)) {
        questions = [responseText];
      }
    } catch (parseErr) {
      console.warn(`[expertCaptureAgent] Failed to parse JSON questions, extracting lines...`);
      questions = responseText.split('\n').map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean).slice(0, 5);
    }

    console.log(`[expertCaptureAgent] Generated ${questions.length} questions for ${engineerName}`);
    return questions;
  } catch (error) {
    console.error(`[expertCaptureAgent] Error generating expert questions: ${error.message}`);
    throw error;
  }
}

/**
 * Save an expert's response to a question into Document, Chunk, and Asset collections.
 * @param {string} engineerId
 * @param {string} engineerName
 * @param {string} question
 * @param {string} answer
 * @param {string[]} equipmentTags
 * @returns {Promise<{saved: boolean, docId: string, chunksCreated: number}>}
 */
async function saveExpertResponse(engineerId, engineerName, question, answer, equipmentTags = []) {
  console.log(`[expertCaptureAgent] Saving expert response from ${engineerName} for tags: ${equipmentTags.join(', ')}`);

  try {
    const title = `Expert Interview — ${engineerName} — ${new Date().toISOString()}`;

    // 1. Create Document record
    const doc = await Document.create({
      title,
      doc_type: 'ExpertInterview',
      source_system: 'CHRONICLE Expert Capture',
      uploaded_by: engineerId || engineerName,
      equipment_tags: equipmentTags,
      ingestion_status: 'complete',
      entity_count: equipmentTags.length,
      chunk_count: 1,
    });

    // 2. Embed the answer text
    const textToEmbed = `Question: ${question}\n\nTacit Answer: ${answer}`;
    const embeddings = await embedTexts([textToEmbed]);
    const embeddingVector = embeddings[0] || [];

    // 3. Create Chunk record with is_tacit_knowledge: true
    await Chunk.create({
      doc_id: doc._id,
      chunk_index: 0,
      text: textToEmbed,
      raw_text: answer,
      embedding: embeddingVector,
      doc_type: 'ExpertInterview',
      equipment_tags: equipmentTags,
      section_header: `Expert Knowledge: ${engineerName}`,
      is_tacit_knowledge: true,
      confidence_score: 1.0,
    });

    // 4. Upsert Asset records for each equipmentTag and increment completeness by 0.1
    for (const tag of equipmentTags) {
      try {
        if (!tag || typeof tag !== 'string') continue;
        const cleanTag = tag.trim();

        const asset = await Asset.findOne({ tag: cleanTag });
        if (asset) {
          const newCompleteness = Math.min((asset.knowledge_completeness || 0) + 0.1, 1.0);
          await Asset.findByIdAndUpdate(asset._id, {
            $set: { knowledge_completeness: newCompleteness },
            $inc: { graph_edges_created: 1 },
          });
        } else {
          // If asset doesn't exist yet, create it
          await Asset.create({
            tag: cleanTag,
            name: `Equipment ${cleanTag}`,
            asset_type: 'Equipment',
            knowledge_completeness: 0.1,
          });
        }
      } catch (assetErr) {
        console.warn(`[expertCaptureAgent] Could not update asset "${tag}": ${assetErr.message}`);
      }
    }

    console.log(`[expertCaptureAgent] ✅ Response saved cleanly under Doc ID: ${doc._id}`);
    return {
      saved: true,
      docId: doc._id.toString(),
      chunksCreated: 1,
    };
  } catch (error) {
    console.error(`[expertCaptureAgent] Error saving expert response: ${error.message}`);
    throw error;
  }
}

module.exports = { generateExpertQuestions, saveExpertResponse };
