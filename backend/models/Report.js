const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  researchRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchRun', required: true, unique: true },
  title: { type: String, required: true },
  executiveSummary: { type: String },
  methodology: { type: String },
  content: { type: String }, // Markdown format of the final report
  citations: [{
    chunkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chunk' },
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
    referenceId: { type: String }, // [1], [2], etc.
    text: { type: String } // the exact text cited
  }],
  researchGaps: [{ type: String }],
  conflicts: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
