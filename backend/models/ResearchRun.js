const mongoose = require('mongoose');

const researchRunSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  query: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'planning', 'searching', 'collecting', 'processing', 'embedding', 'retrieving', 'verifying', 'synthesizing', 'validating', 'generating', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  progress: { type: Number, default: 0 },
  subQuestions: [{ type: String }],
  researchPlan: { type: String },
  logs: [{
    message: String,
    level: { type: String, enum: ['info', 'warn', 'error'] },
    timestamp: { type: Date, default: Date.now }
  }],
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ResearchRun', researchRunSchema);
