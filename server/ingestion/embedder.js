/**
 * Stage 3b — Text Embedder
 * Generates 384-dimensional embeddings using Xenova/all-MiniLM-L6-v2 (fully local, no API cost).
 * Caches the pipeline instance so the model loads only once.
 */

let pipelineInstance = null;

/**
 * Lazily load and cache the feature-extraction pipeline.
 * Uses dynamic import since @xenova/transformers is ESM.
 */
async function getPipeline() {
  if (pipelineInstance) {
    return pipelineInstance;
  }

  console.log('Downloading embedding model (~23MB if not cached)...');
  console.log('[embedder] Loading model: Xenova/all-MiniLM-L6-v2...');

  // @xenova/transformers is ESM-only, use dynamic import
  const { pipeline } = await import('@xenova/transformers');
  pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  console.log('[embedder] Model loaded and cached');
  return pipelineInstance;
}

/**
 * Generate embeddings for an array of text strings.
 * Processes in batches of 10 to avoid memory issues.
 * @param {string[]} texts - Array of text strings to embed
 * @returns {Promise<number[][]>} Array of embedding arrays (each 384 numbers)
 */
async function embedTexts(texts) {
  console.log(`[embedder] Starting embedding — ${texts.length} texts`);

  try {
    const pipe = await getPipeline();
    const BATCH_SIZE = 10;
    const allEmbeddings = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

      console.log(`[embedder] Processing batch ${batchNum}/${totalBatches} (${batch.length} texts)`);

      for (const text of batch) {
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        // Convert the Tensor output to a plain array
        const embedding = Array.from(output.data);
        allEmbeddings.push(embedding);
      }
    }

    console.log(`[embedder] Embedding complete — ${allEmbeddings.length} embeddings of dim ${allEmbeddings[0]?.length || 0}`);
    return allEmbeddings;
  } catch (error) {
    console.error(`[embedder] Error during embedding: ${error.message}`);
    throw new Error(`Text embedding failed: ${error.message}`);
  }
}

module.exports = { embedTexts };
