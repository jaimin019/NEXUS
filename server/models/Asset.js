const mongoose = require('mongoose');

const relationshipSchema = new mongoose.Schema(
  {
    target_tag: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'FEEDS_INTO',
        'FED_BY',
        'CONTROLLED_BY',
        'INTERLOCKED_WITH',
        'GOVERNED_BY',
        'REFERENCED_IN',
      ],
    },
    confidence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    source_doc_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    inferred_by: {
      type: String,
      enum: ['llm', 'manual', 'piid_parse'],
      default: 'llm',
    },
  },
  { _id: false }
);

const assetSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  asset_type: {
    type: String,
    trim: true,
  },
  plant_area: {
    type: String,
    trim: true,
  },
  criticality: {
    type: String,
    enum: ['A', 'B', 'C'],
    default: 'C',
  },
  relationships: {
    type: [relationshipSchema],
    default: [],
  },
  failure_signatures: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'FailureSignature',
    default: [],
  },
  knowledge_completeness: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  open_work_orders: {
    type: Number,
    default: 0,
  },
  active_permits: {
    type: Number,
    default: 0,
  },
  last_maintenance: {
    type: Date,
    default: null,
  },
  health_indicators: {
    vibration_trend: { type: String, default: null },
    last_inspection_result: { type: String, default: null },
    days_since_last_maintenance: { type: Number, default: null },
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

assetSchema.index({ plant_area: 1 });
assetSchema.index({ criticality: 1 });

module.exports = mongoose.model('Asset', assetSchema);
