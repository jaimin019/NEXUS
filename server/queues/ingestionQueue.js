const Bull = require('bull');
const Document = require('../models/Document');

// Parse Upstash Redis URL for Bull connection
// Upstash provides a redis:// or rediss:// URL
const redisUrl = process.env.UPSTASH_REDIS_URL;

let queueConfig = {};

if (redisUrl) {
  // Upstash Redis typically uses TLS (rediss://)
  const url = new URL(redisUrl);
  queueConfig = {
    redis: {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
      password: process.env.UPSTASH_REDIS_TOKEN || url.password,
      tls: url.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    },
  };
} else {
  // Fallback: local Redis for development
  queueConfig = {
    redis: {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: 3,
    },
  };
}

const ingestionQueue = new Bull('document-ingestion', queueConfig);

// ---------------------------------------------------------------------------
// Processor — placeholder: logs the job and advances status to 'parsing'
// ---------------------------------------------------------------------------
ingestionQueue.process(async (job) => {
  const { docId, filePath, docType } = job.data;
  console.log(`[ingestion-queue] Processing job ${job.id}`);
  console.log(`  docId    : ${docId}`);
  console.log(`  filePath : ${filePath}`);
  console.log(`  docType  : ${docType}`);

  // Advance ingestion status → parsing
  await Document.findByIdAndUpdate(docId, { ingestion_status: 'parsing' });

  // TODO: implement actual parsing, chunking, embedding, graphing pipeline
  return { docId, status: 'parsing' };
});

ingestionQueue.on('completed', (job, result) => {
  console.log(`[ingestion-queue] Job ${job.id} completed —`, result);
});

ingestionQueue.on('failed', (job, err) => {
  console.error(`[ingestion-queue] Job ${job.id} failed —`, err.message);
});

// ---------------------------------------------------------------------------
// Helper — add a new ingestion job to the queue
// ---------------------------------------------------------------------------
async function addIngestionJob(docId, filePath, docType) {
  const job = await ingestionQueue.add(
    { docId, filePath, docType },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    }
  );
  console.log(`[ingestion-queue] Enqueued job ${job.id} for doc ${docId}`);
  return job;
}

module.exports = { ingestionQueue, addIngestionJob };
