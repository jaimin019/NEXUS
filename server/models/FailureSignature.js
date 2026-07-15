const mongoose = require('mongoose');

const failureSignatureSchema = new mongoose.Schema({
  equipment_type: {
    type: String,
    required: true,
    trim: true,
  },
  failure_mode: {
    type: String,
    required: true,
    trim: true,
  },
  precursor_signals: {
    type: [String],
    default: [],
  },
  contributing_conditions: {
    type: [String],
    default: [],
  },
  avg_days_to_failure: {
    type: Number,
    default: null,
  },
  detection_method: {
    type: String,
    default: null,
  },
  resolution: {
    type: String,
    default: null,
  },
  occurrence_count: {
    type: Number,
    default: 0,
  },
  source_incidents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
  ],
  embedding: {
    type: [Number],
    default: [],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

failureSignatureSchema.index({ equipment_type: 1 });
failureSignatureSchema.index({ failure_mode: 1 });

module.exports = mongoose.model('FailureSignature', failureSignatureSchema);
