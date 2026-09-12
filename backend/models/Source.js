const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  researchRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchRun', required: true },
  url: { type: String, required: true },
  title: { type: String },
  domain: { type: String },
  publisher: { type: String },
  author: { type: String },
  authors: { type: String },
  year: { type: Number },
  citationCount: { type: Number, default: 0 },
  pdfUrl: { type: String },
  snippet: { type: String },
  publicationDate: { type: Date },
  retrievalTimestamp: { type: Date, default: Date.now },
  sourceType: { type: String, enum: ['webpage', 'web', 'scholar', 'arxiv', 'wikipedia', 'academic'], default: 'webpage' },
  extractedText: { type: String },
  contentHash: { type: String },
  relevanceScore: { type: Number },
  qualityScore: { type: Number },
  status: { type: String, enum: ['pending', 'fetched', 'failed', 'extracted', 'chunked'], default: 'pending' }
});

module.exports = mongoose.model('Source', sourceSchema);
