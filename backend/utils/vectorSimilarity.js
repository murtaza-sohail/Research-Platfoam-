/**
 * Computes the cosine similarity between two vectors.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} The cosine similarity score (-1 to 1).
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must be of the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0; // Prevent division by zero
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Ranks chunks by cosine similarity to a query vector.
 * @param {number[]} queryVector
 * @param {Array<{vector: number[], text: string, [key: string]: any}>} chunks
 * @param {number} topK - Number of results to return
 * @returns {Array} Top K most similar chunks
 */
function rankBySimilarity(queryVector, chunks, topK = 5) {
  const scoredChunks = chunks.map(chunk => {
    return {
      ...chunk,
      score: cosineSimilarity(queryVector, chunk.vector)
    };
  });

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, topK);
}

module.exports = {
  cosineSimilarity,
  rankBySimilarity
};
