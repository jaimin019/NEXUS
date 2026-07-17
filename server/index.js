// Load environment variables first
require('dotenv').config();

// Register async error handler — must be required before routes
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Route imports
// ---------------------------------------------------------------------------
const documentsRouter = require('./routes/documents');
const queryRouter = require('./routes/query');
const assetsRouter = require('./routes/assets');
const complianceRouter = require('./routes/compliance');
const chronicleRouter = require('./routes/chronicle');
const healthRouter = require('./routes/health');

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
app.use('/api/health', healthRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/query', queryRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/compliance', complianceRouter);
app.use('/api/chronicle', chronicleRouter);

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
// Database connection & server start
// ---------------------------------------------------------------------------
async function start() {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log('✅  Connected to MongoDB');
    } catch (err) {
      console.error('❌  MongoDB connection failed:', err.message);
      console.warn('⚠️   Server will start without database — some routes will fail.');
    }
  } else {
    console.warn('⚠️   MONGODB_URI not set — skipping database connection.');
  }

  // Boot Bull queue workers (imported for side-effects — processor registers on import)
  try {
    require('./queues/ingestionQueue');
    console.log('✅  Ingestion queue worker registered');
  } catch (err) {
    console.warn('⚠️   Could not start ingestion queue:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀  NEXUS server listening on http://localhost:${PORT}\n`);
  });
}

start();
