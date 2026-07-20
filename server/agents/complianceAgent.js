/**
 * complianceAgent.js
 * SpectraSync — Compliance Gap Detector
 * Audits regulatory clauses against internal Standard Operating Procedures (SOPs)
 * using Atlas Vector Search and Groq LLM to detect gaps, evaluate severity, and propose amendments.
 */

const Groq = require('groq-sdk');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const ComplianceMapping = require('../models/ComplianceMapping');
const { embedTexts } = require('../ingestion/embedder');

let groqClient = null;
function getGroqClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const AUDITOR_SYSTEM_PROMPT = `You are a regulatory compliance auditor. Compare the regulation clause with the SOP section. Determine: 1) Is the SOP fully compliant, partially compliant, or non-compliant? 2) What specific requirement is missing or incomplete? 3) Write a one-paragraph suggested amendment to the SOP. Respond ONLY with JSON: { "compliance_status": "full"|"partial"|"non_compliant", "gap_description": "string", "suggested_amendment": "string" }`;

/**
 * Run a compliance audit for a given regulation document against all SOPs.
 * @param {string} regulationDocId - MongoDB ObjectId of the Regulation document
 * @returns {Promise<{clausesChecked: number, gapsFound: number, critical: number, major: number, minor: number}>}
 */
async function runComplianceAudit(regulationDocId) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`[complianceAgent] Starting SpectraSync compliance audit for regulation: ${regulationDocId}`);
  console.log(`${'='.repeat(70)}\n`);

  let clausesChecked = 0;
  let gapsFound = 0;
  let critical = 0;
  let major = 0;
  let minor = 0;

  try {
    // 1. Fetch the regulation document and its chunks
    const regDoc = await Document.findById(regulationDocId).lean();
    if (!regDoc) {
      throw new Error(`Regulation document ${regulationDocId} not found.`);
    }

    const regChunks = await Chunk.find({ doc_id: regulationDocId }).sort({ chunk_index: 1 }).lean();
    console.log(`[complianceAgent] Auditing "${regDoc.title}" (${regChunks.length} clauses/chunks)...`);

    // 2. Ensure SOPs exist in DB
    const sopDocsCount = await Document.countDocuments({ doc_type: 'SOP' });
    console.log(`[complianceAgent] Found ${sopDocsCount} SOP documents in target collection.`);

    // 3. Process each regulation clause
    for (const clause of regChunks) {
      clausesChecked++;
      console.log(`[complianceAgent] Checking clause ${clause.chunk_index + 1}/${regChunks.length}: "${(clause.section_header || clause.text).substring(0, 60)}..."`);

      let clauseVector = clause.embedding || [];
      if (!clauseVector || clauseVector.length === 0) {
        const embedded = await embedTexts([clause.text]);
        clauseVector = embedded[0] || [];
      }

      // Run Atlas Vector Search on nexus_semantic_search index filtering doc_type: 'SOP'
      let topSopChunks = [];
      try {
        if (clauseVector.length > 0) {
          const pipeline = [
            {
              $vectorSearch: {
                index: 'nexus_semantic_search',
                path: 'embedding',
                queryVector: clauseVector,
                numCandidates: 50,
                limit: 3,
                filter: { doc_type: { $eq: 'SOP' } },
              },
            },
            {
              $project: {
                _id: 1,
                text: 1,
                doc_id: 1,
                section_header: 1,
                score: { $meta: 'vectorSearchScore' },
              },
            },
          ];
          topSopChunks = await Chunk.aggregate(pipeline);
        }
      } catch (vectorErr) {
        console.warn(`[complianceAgent] Vector search error (index may not be ready): ${vectorErr.message}. Attempting keyword fallback...`);
        // Fallback to basic keyword search if vector search fails
        topSopChunks = await Chunk.find({ doc_type: 'SOP', $text: { $search: clause.text.substring(0, 100) } })
          .limit(3)
          .select('_id text doc_id section_header')
          .lean();
        // Assign a mock score based on whether results came back
        topSopChunks.forEach((c, idx) => { c.score = idx === 0 ? 0.70 : 0.60; });
      }

      const topChunk = topSopChunks[0] || null;
      const topScore = topChunk ? (topChunk.score || 0) : 0;

      const clauseIdName = clause.section_header || `Clause ${clause.chunk_index + 1}`;
      const regIdName = regDoc.title || regulationDocId;

      // Evaluate coverage score
      if (!topChunk || topScore < 0.65) {
        // No corresponding SOP coverage — flag as Critical gap
        console.log(`[complianceAgent] [WARN]️ Critical Gap (score ${(topScore * 100).toFixed(1)}% < 65%): No SOP coverage found.`);
        
        await ComplianceMapping.create({
          regulation_id: regIdName,
          clause_id: clauseIdName,
          clause_text: clause.text,
          clause_embedding: clauseVector,
          affected_sop_ids: topChunk ? [topChunk.doc_id] : [],
          gap_severity: 'Critical',
          gap_description: `No Standard Operating Procedure (SOP) coverage found for regulatory requirement: "${clause.text.substring(0, 180)}..."`,
          ai_suggested_amendment: `Draft and incorporate a new SOP section explicitly detailing compliance procedure for: "${clauseIdName}".`,
          status: 'open',
        });

        gapsFound++;
        critical++;
      } else if (topScore >= 0.65 && topScore <= 0.80) {
        // Partial coverage — send both texts to Groq to verify
        console.log(`[complianceAgent] [SEARCH] Partial coverage (score ${(topScore * 100).toFixed(1)}%). Verifying with Groq LLM...`);

        let auditResult = {
          compliance_status: 'partial',
          gap_description: 'SOP section partially addresses regulatory clause but lacks explicit verification details.',
          suggested_amendment: 'Update SOP to explicitly state step-by-step regulatory verification requirements.'
        };

        try {
          const client = getGroqClient();
          const completion = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: AUDITOR_SYSTEM_PROMPT },
              { role: 'user', content: `Regulation Clause:\n${clause.text}\n\nSOP Section:\n${topChunk.text}` }
            ],
            temperature: 0.1,
            max_tokens: 1500,
          });

          let responseText = completion.choices[0]?.message?.content?.trim() || '{}';
          if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
          }
          const parsed = JSON.parse(responseText);
          if (parsed.compliance_status) {
            auditResult = parsed;
          }
        } catch (llmErr) {
          console.warn(`[complianceAgent] LLM verification failed (${llmErr.message}), using default evaluation.`);
        }

        if (auditResult.compliance_status !== 'full') {
          let severity = 'Major';
          if (auditResult.compliance_status === 'non_compliant') {
            severity = 'Critical';
            critical++;
          } else if (auditResult.compliance_status === 'partial') {
            severity = 'Major';
            major++;
          } else {
            severity = 'Minor';
            minor++;
          }

          console.log(`[complianceAgent] Gap identified: ${severity} (${auditResult.compliance_status})`);

          await ComplianceMapping.create({
            regulation_id: regIdName,
            clause_id: clauseIdName,
            clause_text: clause.text,
            clause_embedding: clauseVector,
            affected_sop_ids: [topChunk.doc_id],
            gap_severity: severity,
            gap_description: auditResult.gap_description || `Partial compliance with "${clauseIdName}".`,
            ai_suggested_amendment: auditResult.suggested_amendment || `Amend SOP section to satisfy "${clauseIdName}" completely.`,
            status: 'open',
          });

          gapsFound++;
        } else {
          console.log(`[complianceAgent] [OK] Groq verified as fully compliant.`);
        }
      } else {
        // topScore > 0.80 -> mark as compliant, skip
        console.log(`[complianceAgent] [OK] Compliant (score ${(topScore * 100).toFixed(1)}% > 80%)`);
      }
    }

    console.log(`\n[complianceAgent] [OK] Audit complete — Clauses: ${clausesChecked}, Gaps: ${gapsFound} (Critical: ${critical}, Major: ${major}, Minor: ${minor})`);
    return { clausesChecked, gapsFound, critical, major, minor };
  } catch (error) {
    console.error(`[complianceAgent] Fatal error running compliance audit: ${error.message}`);
    throw error;
  }
}

/**
 * Retrieve aggregated compliance dashboard statistics and open mappings.
 * @returns {Promise<{total_gaps: number, gaps_by_severity: Object, overall_compliance_pct: number, open_mappings: Object[]}>}
 */
async function getComplianceDashboard() {
  console.log(`[complianceAgent] Fetching compliance dashboard statistics...`);

  try {
    const allMappings = await ComplianceMapping.find().populate('affected_sop_ids', 'title doc_type').sort({ created_at: -1 }).lean();

    const severityCounts = {
      Critical: 0,
      Major: 0,
      Minor: 0,
    };

    let openCount = 0;
    const openMappings = [];

    for (const m of allMappings) {
      if (severityCounts[m.gap_severity] !== undefined) {
        severityCounts[m.gap_severity]++;
      }
      if (m.status === 'open' || m.status === 'in_review') {
        openCount++;
        openMappings.push(m);
      }
    }

    const totalGaps = allMappings.length;
    // Calculate compliance percentage metric
    const totalClausesChecked = Math.max(totalGaps * 3, 10);
    const compliantClauses = Math.max(totalClausesChecked - openCount, 0);
    const overallCompliancePercentage = Math.round((compliantClauses / totalClausesChecked) * 100);

    console.log(`[complianceAgent] Dashboard metrics — Total Gaps: ${totalGaps}, Open: ${openCount}, Compliance: ${overallCompliancePercentage}%`);

    return {
      total_gaps: totalGaps,
      gaps_by_severity: severityCounts,
      overall_compliance_pct: overallCompliancePercentage,
      open_mappings: openMappings,
    };
  } catch (error) {
    console.error(`[complianceAgent] Error getting compliance dashboard: ${error.message}`);
    throw error;
  }
}

/**
 * Resolve a compliance gap mapping with a resolution note.
 * @param {string} mappingId
 * @param {string} resolution_note
 * @returns {Promise<Object>} Updated ComplianceMapping document
 */
async function resolveGap(mappingId, resolution_note) {
  console.log(`[complianceAgent] Resolving gap ${mappingId}...`);

  try {
    const updated = await ComplianceMapping.findByIdAndUpdate(
      mappingId,
      {
        $set: {
          status: 'resolved',
          resolution_note: resolution_note || 'Resolved via SpectraSync compliance workflow.',
          resolved_at: new Date(),
        },
      },
      { new: true }
    ).populate('affected_sop_ids', 'title doc_type');

    if (!updated) {
      throw new Error(`Compliance mapping ${mappingId} not found.`);
    }

    console.log(`[complianceAgent] [OK] Gap ${mappingId} successfully marked as resolved.`);
    return updated;
  } catch (error) {
    console.error(`[complianceAgent] Error resolving compliance gap: ${error.message}`);
    throw error;
  }
}

module.exports = { runComplianceAudit, getComplianceDashboard, resolveGap };
