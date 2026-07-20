require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Bull = require('bull');
const Document = require('../models/Document');
const { processIngestionJob } = require('./ingestionProcessor');

// Parse Upstash Redis URL for Bull connection.
// Upstash REST URLs use https:// — convert to rediss:// for ioredis/Bull.
// Upstash also exposes a native Redis endpoint on port 6379 (TLS).
let rawRedisUrl = process.env.UPSTASH_REDIS_URL || '';

// Normalise https:// -> rediss:// so URL parsing works
if (rawRedisUrl.startsWith('https://')) {
  rawRedisUrl = rawRedisUrl.replace('https://', 'rediss://');
} else if (rawRedisUrl.startsWith('http://')) {
  rawRedisUrl = rawRedisUrl.replace('http://', 'redis://');
}

let queueConfig = {};

if (rawRedisUrl) {
  try {
    const url = new URL(rawRedisUrl);
    queueConfig = {
      redis: {
        host: url.hostname,
        port: parseInt(url.port, 10) || 6379,
        password: process.env.UPSTASH_REDIS_TOKEN || url.password || undefined,
        tls: url.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        connectTimeout: 10000,
      },
    };
    console.log(`[ingestion-queue] Redis config -> host: ${url.hostname}, tls: ${url.protocol === 'rediss:'}`);
  } catch (e) {
    console.warn('[ingestion-queue] Could not parse UPSTASH_REDIS_URL, falling back to local Redis');
    queueConfig = { redis: { host: '127.0.0.1', port: 6379, maxRetriesPerRequest: 3 } };
  }
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
// Processor — runs the full 4-stage ingestion pipeline
// ---------------------------------------------------------------------------
ingestionQueue.process(async (job) => {
  console.log(`[ingestion-queue] Processing job ${job.id}`);
  console.log(`  docId    : ${job.data.docId}`);
  console.log(`  filePath : ${job.data.filePath}`);
  console.log(`  docType  : ${job.data.docType}`);

  return await processIngestionJob(job);
});

ingestionQueue.on('error', (err) => {
  console.warn('[ingestion-queue] Bull/Redis error (will fall back to sync ingestion if needed):', err.message);
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
  try {
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
  } catch (err) {
    console.warn(`[ingestion-queue] Redis queue unavailable (${err.message}). Running ingestion job synchronously in background...`);
    const mockJob = {
      id: `sync-${Date.now()}`,
      data: { docId, filePath, docType },
      progress: (p) => console.log(`[sync-job progress] ${p}%`),
      log: (msg) => console.log(`[sync-job log] ${msg}`)
    };
    // Run asynchronously in background without crashing
    processIngestionJob(mockJob).catch(e => console.error(`[sync-job error] ${e.message}`));
    return mockJob;
  }
}

module.exports = { ingestionQueue, addIngestionJob };
