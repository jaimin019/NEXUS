/**
 * createVectorIndex.js
 * One-time setup script — creates Atlas Vector Search indexes and text indexes.
 * Run with: node scripts/createVectorIndex.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = MONGODB_URI.match(/\/([^/?]+)(\?|$)/)?.[1] || 'test';

async function createVectorIndex() {
  if (!MONGODB_URI) {
    console.error('❌  MONGODB_URI not set in .env');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅  Connected to MongoDB Atlas\n');

    const db = client.db(DB_NAME);

    // -------------------------------------------------------------------------
    // Index 1 — nexus_semantic_search on chunks collection
    // -------------------------------------------------------------------------
    try {
      const chunksCollection = db.collection('chunks');
      await chunksCollection.createSearchIndex({
        name: 'nexus_semantic_search',
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'embedding',
              numDimensions: 384,
              similarity: 'cosine',
            },
            {
              type: 'filter',
              path: 'doc_type',
            },
            {
              type: 'filter',
              path: 'equipment_tags',
            },
            {
              type: 'filter',
              path: 'is_tacit_knowledge',
            },
          ],
        },
      });
      console.log('✅  [chunks] Atlas Vector Search index "nexus_semantic_search" created successfully');
    } catch (err) {
      if (err.codeName === 'IndexAlreadyExists' || err.message?.includes('already exists')) {
        console.log('ℹ️   [chunks] Index "nexus_semantic_search" already exists — skipping');
      } else {
        console.error('❌  [chunks] Failed to create "nexus_semantic_search":', err.message);
      }
    }

    // -------------------------------------------------------------------------
    // Index 2 — nexus_failure_patterns on failure_signatures collection
    // -------------------------------------------------------------------------
    try {
      const failureSigsCollection = db.collection('failuresignatures');
      await failureSigsCollection.createSearchIndex({
        name: 'nexus_failure_patterns',
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'embedding',
              numDimensions: 384,
              similarity: 'cosine',
            },
            {
              type: 'filter',
              path: 'equipment_type',
            },
            {
              type: 'filter',
              path: 'failure_mode',
            },
          ],
        },
      });
      console.log('✅  [failuresignatures] Atlas Vector Search index "nexus_failure_patterns" created successfully');
    } catch (err) {
      if (err.codeName === 'IndexAlreadyExists' || err.message?.includes('already exists')) {
        console.log('ℹ️   [failuresignatures] Index "nexus_failure_patterns" already exists — skipping');
      } else {
        console.error('❌  [failuresignatures] Failed to create "nexus_failure_patterns":', err.message);
      }
    }

    // -------------------------------------------------------------------------
    // Index 3 — Standard MongoDB text index on chunks for keyword search
    // -------------------------------------------------------------------------
    try {
      const chunksCollection = db.collection('chunks');
      await chunksCollection.createIndex(
        { raw_text: 'text', equipment_tags: 'text' },
        { name: 'nexus_text_search', default_language: 'english' }
      );
      console.log('✅  [chunks] Text index "nexus_text_search" created successfully');
    } catch (err) {
      if (err.codeName === 'IndexAlreadyExists' || err.message?.includes('already exists')) {
        console.log('ℹ️   [chunks] Text index "nexus_text_search" already exists — skipping');
      } else {
        console.error('❌  [chunks] Failed to create text index:', err.message);
      }
    }

    console.log('\n🚀  Index setup complete. Atlas Vector Search indexes may take a few minutes to become READY.');
    console.log('    Monitor status in: Atlas UI → Search Indexes');
  } catch (err) {
    console.error('❌  Fatal error during index setup:', err.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌  MongoDB connection closed.');
  }
}

createVectorIndex();
