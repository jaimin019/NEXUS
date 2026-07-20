// Load environment variables from server/.env regardless of CWD
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Register async error handler — must be required before routes
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Route imports
// ---------------------------------------------------------------------------
const authRouter = require('./routes/auth');
const documentsRouter = require('./routes/documents');
const queryRouter = require('./routes/query');
const assetsRouter = require('./routes/assets');
const complianceRouter = require('./routes/compliance');
const chronicleRouter = require('./routes/chronicle');
const healthRouter = require('./routes/health');

// Auth middleware
const authMiddleware = require('./middleware/auth');

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5001;

// Ensure uploads/ directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
const requestLogger = require('./middleware/requestLogger');

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve uploaded files statically (dev convenience)
app.use('/uploads', express.static(uploadsDir));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
// Public routes — no auth required
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Protected routes — require auth
app.use('/api/documents', authMiddleware, documentsRouter);
app.use('/api/query', authMiddleware, queryRouter);
app.use('/api/assets', authMiddleware, assetsRouter);
app.use('/api/compliance', authMiddleware, complianceRouter);
app.use('/api/chronicle', authMiddleware, chronicleRouter);

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ---------------------------------------------------------------------------
// Graceful Error Handling
// ---------------------------------------------------------------------------
process.on('uncaughtException', (err) => {
  console.error('[ERROR] [NEXUS] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] [NEXUS] Unhandled Rejection at:', promise, 'reason:', reason);
});

// ---------------------------------------------------------------------------
// Database connection & server start
// ---------------------------------------------------------------------------
async function start() {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      console.log('[INFO] [NEXUS] Connecting to MongoDB...');
      await mongoose.connect(mongoUri);
      console.log('[OK] [NEXUS] MongoDB connected');
    } catch (err) {
      console.error('[ERROR] [NEXUS] MongoDB connection failed:', err.message);
      console.warn('[WARN] [NEXUS] Server will start without database — some routes will fail.');
    }
  } else {
    console.warn('[WARN] [NEXUS] MONGODB_URI not set — skipping database connection.');
  }

  // Warm up / load embedding model
  try {
    console.log('[INFO] [NEXUS] Embedding model loading...');
    const { embedTexts } = require('./ingestion/embedder');
    await embedTexts(['warmup']);
    console.log('[OK] [NEXUS] Embedding model ready');
  } catch (err) {
    console.warn('[WARN] [NEXUS] Could not load embedding model:', err.message);
  }

  // Boot Bull queue workers
  try {
    require('./queues/ingestionQueue');
    console.log('[OK] [NEXUS] Ingestion queue connected to Redis');
    console.log('[OK] [NEXUS] Queue processor registered');
  } catch (err) {
    console.warn('[WARN] [NEXUS] Could not start ingestion queue:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[OK] [NEXUS] Server running on port ${PORT}`);
  });
}

start();
