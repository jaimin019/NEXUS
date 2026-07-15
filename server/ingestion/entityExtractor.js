/**
 * Stage 2 — Entity Extractor
 * Uses Groq LLM (llama-3.3-70b-versatile) to extract industrial entities from document text.
 */

const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `You are an industrial document entity extractor. Extract:
1) equipment_tags: ISA-standard tags like P-101, HX-204, RV-204A, V-302
2) regulatory_refs: standards like OISD-GDN-206, FactoryAct-Sec31, PESO-2016
3) relationships: array of {source, target, type} where type is one of FEEDS_INTO/FED_BY/CONTROLLED_BY/INTERLOCKED_WITH/GOVERNED_BY.
Respond ONLY with valid JSON: {"equipment_tags":[], "regulatory_refs":[], "relationships":[]}.
No markdown, no explanation.`;

// Lazy-init Groq client
let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

/**
 * Extract entities from document text using Groq LLM.
 * @param {string} text - Full document text
 * @param {string} docType - Document type for context
 * @returns {Promise<{equipment_tags: string[], regulatory_refs: string[], relationships: Array<{source: string, target: string, type: string}>}>}
 */
async function extractEntities(text, docType) {
  console.log(`[entity-extractor] Starting extraction — docType: ${docType}, textLen: ${text.length}`);

  const emptyResult = { equipment_tags: [], regulatory_refs: [], relationships: [] };

  if (!text || text.length < 10) {
    console.warn('[entity-extractor] Text too short for extraction, returning empty result');
    return emptyResult;
  }

  try {
    const client = getGroqClient();
    const truncatedText = text.substring(0, 3000);

    const chatCompletion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Extract entities from this ${docType} document:\n\n${truncatedText}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '{}';
    console.log(`[entity-extractor] Raw LLM response length: ${responseText.length}`);

    // Safely parse JSON
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      console.error(`[entity-extractor] JSON parse error: ${parseErr.message}`);
      console.error(`[entity-extractor] Raw response: ${responseText.substring(0, 500)}`);
      return emptyResult;
    }

    const result = {
      equipment_tags: Array.isArray(parsed.equipment_tags) ? parsed.equipment_tags : [],
      regulatory_refs: Array.isArray(parsed.regulatory_refs) ? parsed.regulatory_refs : [],
      relationships: Array.isArray(parsed.relationships) ? parsed.relationships : [],
    };

    // Validate relationship objects
    result.relationships = result.relationships.filter(
      (r) => r && typeof r.source === 'string' && typeof r.target === 'string' && typeof r.type === 'string'
    );

    console.log(
      `[entity-extractor] Extracted — equipment: ${result.equipment_tags.length}, ` +
      `regulatory: ${result.regulatory_refs.length}, relationships: ${result.relationships.length}`
    );

    return result;
  } catch (error) {
    console.error(`[entity-extractor] Groq API error: ${error.message}`);
    // Return empty on failure — don't crash the pipeline
    return emptyResult;
  }
}

module.exports = { extractEntities };
