const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source', required: true },
  researchRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchRun', required: true },
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  vector: { type: [Number] }, // Storing embedding vector
  tokenCount: { type: Number },
  charCount: { type: Number }
});

// Since we are not using a dedicated vector DB, we'll store the vectors here.
// MongoDB (Atlas) supports vector search natively now, but the prompt says 
// "implement application-level semantic retrieval using JavaScript-based vector similarity".
// We will fetch chunks and do cosine similarity in memory, so we just store the array.

module.exports = mongoose.model('Chunk', chunkSchema);
