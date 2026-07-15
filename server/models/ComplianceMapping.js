const mongoose = require('mongoose');

const complianceMappingSchema = new mongoose.Schema({
  regulation_id: {
    type: String,
    required: true,
    trim: true,
  },
  clause_id: {
    type: String,
    required: true,
    trim: true,
  },
  clause_text: {
    type: String,
    required: true,
  },
  clause_embedding: {
    type: [Number],
    default: [],
  },
  affected_sop_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
  ],
  gap_severity: {
    type: String,
    enum: ['Critical', 'Major', 'Minor'],
    default: 'Minor',
  },
  gap_description: {
    type: String,
    default: null,
  },
  ai_suggested_amendment: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved'],
    default: 'open',
  },
  assigned_to: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

complianceMappingSchema.index({ regulation_id: 1, clause_id: 1 });
complianceMappingSchema.index({ status: 1 });
complianceMappingSchema.index({ gap_severity: 1 });

module.exports = mongoose.model('ComplianceMapping', complianceMappingSchema);
