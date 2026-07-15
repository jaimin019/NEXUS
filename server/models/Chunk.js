const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  doc_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true,
  },
  chunk_index: {
    type: Number,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  raw_text: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number],
    validate: {
      validator: function (arr) {
        return arr.length <= 384;
      },
      message: 'Embedding must have at most 384 dimensions.',
    },
  },
  doc_type: {
    type: String,
  },
  equipment_tags: {
    type: [String],
    default: [],
  },
  regulatory_refs: {
    type: [String],
    default: [],
  },
  section_header: {
    type: String,
    default: null,
  },
  page_number: {
    type: Number,
    default: null,
  },
  confidence_score: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 1,
  },
  is_tacit_knowledge: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

chunkSchema.index({ doc_id: 1, chunk_index: 1 });
chunkSchema.index({ doc_type: 1 });

module.exports = mongoose.model('Chunk', chunkSchema);
