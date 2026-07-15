/**
 * Stage 3a — Document Chunker
 * Splits document text into semantically meaningful chunks using LangChain's
 * RecursiveCharacterTextSplitter with doc-type-aware parameters.
 */

const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

/**
 * Get chunk parameters based on document type.
 */
function getChunkParams(docType) {
  switch (docType) {
    case 'SOP':
    case 'Regulation':
    case 'OEMManual':
      return { chunkSize: 800, chunkOverlap: 200 };
    case 'WorkOrder':
    case 'IncidentReport':
      return { chunkSize: 600, chunkOverlap: 150 };
    default:
      return { chunkSize: 700, chunkOverlap: 150 };
  }
}

/**
 * Detect section header from chunk text (looks for ## or ### patterns).
 */
function detectSectionHeader(text) {
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Match markdown-style headers
    const match = trimmed.match(/^#{1,4}\s+(.+)/);
    if (match) {
      return match[1].trim();
    }
    // Match all-caps section headers (common in industrial docs)
    if (trimmed.length > 3 && trimmed.length < 100 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

/**
 * Chunk a document's text into smaller segments with metadata prepended.
 * @param {string} text - Full document text
 * @param {string} docType - Document type
 * @param {Object} metadata - Metadata from entity extraction
 * @param {string[]} metadata.equipment_tags
 * @param {string} metadata.title
 * @returns {Promise<Array<{text: string, raw_text: string, chunk_index: number, section_header: string|null, page_number: number}>>}
 */
async function chunkDocument(text, docType, metadata) {
  console.log(`[chunker] Starting chunking — docType: ${docType}, textLen: ${text.length}`);

  try {
    const { chunkSize, chunkOverlap } = getChunkParams(docType);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n##', '\n###', '\n\n', '\n'],
    });

    const rawChunks = await splitter.splitText(text);
    console.log(`[chunker] Split into ${rawChunks.length} raw chunks (size=${chunkSize}, overlap=${chunkOverlap})`);

    const equipmentStr = (metadata.equipment_tags || []).join(',');
    const sourceTitle = metadata.title || 'Unknown';
    const totalTextLen = text.length;

    const chunks = rawChunks.map((rawText, index) => {
      // Prepend metadata context to the chunk text
      const prefix = `[DOC_TYPE: ${docType}] [EQUIPMENT: ${equipmentStr}] [SOURCE: ${sourceTitle}]\n\n`;
      const enrichedText = prefix + rawText;

      // Estimate page number based on character position
      const charPosition = text.indexOf(rawText.substring(0, 50));
      const estimatedPage = charPosition >= 0
        ? Math.floor((charPosition / totalTextLen) * 10) + 1  // rough estimate
        : index + 1;

      return {
        text: enrichedText,
        raw_text: rawText,
        chunk_index: index,
        section_header: detectSectionHeader(rawText),
        page_number: estimatedPage,
      };
    });

    console.log(`[chunker] Chunking complete — ${chunks.length} enriched chunks`);
    return chunks;
  } catch (error) {
    console.error(`[chunker] Error during chunking: ${error.message}`);
    throw new Error(`Document chunking failed: ${error.message}`);
  }
}

module.exports = { chunkDocument };
