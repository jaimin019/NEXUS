const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  doc_type: {
    type: String,
    required: true,
    enum: [
      'PIID',
      'SOP',
      'WorkOrder',
      'Regulation',
      'IncidentReport',
      'InspectionRecord',
      'EmailArchive',
      'ExpertInterview',
      'OEMManual',
    ],
  },
  source_system: {
    type: String,
    trim: true,
  },
  equipment_tags: {
    type: [String],
    default: [],
  },
  regulatory_refs: {
    type: [String],
    default: [],
  },
  ingestion_status: {
    type: String,
    enum: ['pending', 'parsing', 'chunking', 'embedding', 'graphing', 'complete', 'failed'],
    default: 'pending',
  },
  ingestion_error: {
    type: String,
    default: null,
  },
  language: {
    type: String,
    default: 'en',
  },
  version: {
    type: Number,
    default: 1,
  },
  supersedes: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    default: null,
  },
  uploaded_by: {
    type: String,
    trim: true,
  },
  file_path: {
    type: String,
  },
  page_count: {
    type: Number,
    default: 0,
  },
  ocr_used: {
    type: Boolean,
    default: false,
  },
  entity_count: {
    type: Number,
    default: 0,
  },
  chunk_count: {
    type: Number,
    default: 0,
  },
  graph_edges_created: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

documentSchema.index({ doc_type: 1 });
documentSchema.index({ ingestion_status: 1 });
documentSchema.index({ created_at: -1 });
documentSchema.index({ equipment_tags: 1 });

module.exports = mongoose.model('Document', documentSchema);
