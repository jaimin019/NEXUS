/**
 * ragAgent.js
 * ORACLE — Groq-powered RAG agent.
 * Generates grounded, source-cited answers from retrieved document chunks.
 */

const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const ORACLE_SYSTEM_PROMPT = `You are ORACLE, the AI knowledge copilot for an industrial plant. You answer maintenance, safety, and engineering queries using ONLY the provided source documents.

Rules:
1) Always cite sources as [SOURCE N] inline whenever you reference information from a document.
2) If a procedure has steps, format them as numbered steps.
3) If information is not in the sources, say "This information is not available in the indexed documents."
4) For safety-critical procedures, always add a WARNING prefix if hazards are mentioned in the sources.
5) Be concise but complete. Never hallucinate equipment tags or procedure steps.
6) Do not make up regulations, standards, or specifications not present in the context.`;

/**
 * Generate a grounded answer using Groq LLM with retrieved context.
 *
 * @param {string}   query               - The user's natural language query
 * @param {Object[]} retrievedChunks     - Chunks returned from hybridSearch
 * @param {Object[]} conversationHistory - Prior conversation turns [{role, content}, ...]
 * @returns {Promise<{answer: string, sources: Object[], model: string}>}
 */
async function generateAnswer(query, retrievedChunks, conversationHistory = []) {
  const startTime = Date.now();

  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }

  // ---------------------------------------------------------------------------
  // Build context string from retrieved chunks
  // ---------------------------------------------------------------------------
  const context = retrievedChunks
    .map(
      (chunk, i) =>
        `[SOURCE ${i + 1} | ${chunk.doc_type || 'DOCUMENT'} | Equipment: ${
          (chunk.equipment_tags || []).join(', ') || 'N/A'
        } | Section: ${chunk.section_header || 'General'}]\n${chunk.raw_text}`
    )
    .join('\n\n---\n\n');

  // ---------------------------------------------------------------------------
  // Build messages array — include last 4 conversation turns for multi-turn
  // ---------------------------------------------------------------------------
  const recentHistory = conversationHistory.slice(-4).map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));

  const messages = [
    { role: 'system', content: ORACLE_SYSTEM_PROMPT },
    ...recentHistory,
    {
      role: 'user',
      content: `CONTEXT DOCUMENTS:\n\n${context}\n\nQUESTION: ${query}`,
    },
  ];

  // ---------------------------------------------------------------------------
  // Call Groq API
  // ---------------------------------------------------------------------------
  console.log(
    `[ragAgent] Calling Groq (llama-3.3-70b-versatile) with ${retrievedChunks.length} context chunks…`
  );

  let answer;
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.1,
      max_tokens: 1024,
    });

    answer = completion.choices[0]?.message?.content?.trim() || 'No response generated.';
  } catch (err) {
    console.error('[ragAgent] Groq API call failed:', err.message);
    throw new Error(`LLM generation failed: ${err.message}`);
  }

  console.log(`[ragAgent] Answer generated in ${Date.now() - startTime}ms`);

  // ---------------------------------------------------------------------------
  // Build source attribution list
  // ---------------------------------------------------------------------------
  const sources = retrievedChunks.map((chunk) => ({
    doc_id: chunk.doc_id,
    doc_type: chunk.doc_type || null,
    equipment_tags: chunk.equipment_tags || [],
    section_header: chunk.section_header || null,
    page_number: chunk.page_number || null,
    rrf_score: chunk.rrf_score || null,
  }));

  return {
    answer,
    sources,
    model: 'llama-3.3-70b-versatile',
  };
}

module.exports = { generateAnswer };
