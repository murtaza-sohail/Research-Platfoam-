const ResearchRun = require('../models/ResearchRun');
const Source = require('../models/Source');
const Chunk = require('../models/Chunk');
const Report = require('../models/Report');
const llmService = require('../services/llmService');
const { rankBySimilarity } = require('../utils/vectorSimilarity');
const { registerHandler } = require('./queue');

async function handleSynthesizeReport(job) {
  const { researchRunId } = job.data;

  try {
    await ResearchRun.findByIdAndUpdate(researchRunId, { status: 'synthesizing', progress: 75 });
    const run = await ResearchRun.findById(researchRunId);

    console.log(`[SynthesisWorker] Starting 2-3 page comprehensive synthesis for: "${run.query}"`);

    // 1. Generate query embedding
    const queryVector = await llmService.generateEmbeddings(run.query);

    // 2. Retrieve all chunks and populate source details
    const allChunks = await Chunk.find({ researchRunId }).populate('sourceId').lean();

    if (allChunks.length === 0) {
      throw new Error('No chunks available for synthesis. All sources may have failed to process.');
    }

    // 3. Rank by semantic similarity (retrieve top 18 most relevant chunks)
    const rankedChunks = rankBySimilarity(queryVector, allChunks, Math.min(18, allChunks.length));

    console.log(`[SynthesisWorker] Retrieved top ${rankedChunks.length} evidence chunks`);
    await ResearchRun.findByIdAndUpdate(researchRunId, { status: 'verifying', progress: 85 });

    // 4. Build evidence context with scholarly and web metadata
    const citationMap = {};
    const contextParts = rankedChunks.map((chunk, idx) => {
      const refId = `[${idx + 1}]`;
      const source = chunk.sourceId || {};
      const sourceUrl = source.url || 'Unknown Source';
      const sourceTitle = source.title || sourceUrl;
      const authors = source.authors ? `Authors: ${source.authors}` : '';
      const year = source.year ? `(${source.year})` : '';
      const type = source.sourceType === 'scholar' || source.sourceType === 'arxiv' ? '[Google Scholar / Academic Literature]' : '[Web Source]';

      citationMap[refId] = { chunk, source, sourceUrl, sourceTitle };

      return `Evidence ${refId} ${type} - ${sourceTitle} ${authors} ${year} (URL: ${sourceUrl}):\n"${chunk.text.replace(/"/g, "'")}"`;
    });

    const evidenceText = contextParts.join('\n\n---\n\n');

    // 5. Generate structured 2-3 page comprehensive report
    const systemPrompt = `You are a Principal Research Scientist and Lead Analyst. Synthesize an exhaustive, publication-grade, highly comprehensive 2-to-3 page research report (approx. 1,800 to 2,500 words) based STRICTLY on the retrieved evidence passages and query context.

CRITICAL MANDATES:
- Write an extensive, deep, authoritative multi-page report with in-depth technical substance.
- Thoroughly integrate peer-reviewed and Google Scholar academic insights alongside industry developments.
- Embed numbered citations like [1], [2], [3] throughout every section when asserting findings, metrics, and comparisons.
- Include comparison markdown tables, structured taxonomies, and numbered findings.
- Never fabricate sources or claims not corroborated by the evidence. Note contradictions transparently.
- Structure the report with clean Markdown headers and clear subsection divisions.`;

    const userPrompt = `Research Question: ${run.query}

Sub-questions investigated across Google Scholar and the Global Internet:
${(run.subQuestions || []).map((q, i) => `${i + 1}. ${q}`).join('\n')}

Retrieved Academic & Web Evidence:
${evidenceText}

Generate a full 2-to-3 page comprehensive research report with the following detailed sections:
# Comprehensive Deep Research Report: ${run.query}

**Document Classification:** Advanced Technical Synthesis & Literature Review
**Date of Synthesis:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Investigation Framework:** Multi-Source Evidence Extraction (Google Scholar, Semantic Scholar, arXiv, Open Web)

---

## 1. Executive Summary & Strategic Synthesis
[3 thorough paragraphs summarizing foundational context, key breakthroughs, and overarching conclusions with citations]

### Key Executive Takeaways:
- Bullet points summarizing core findings with citations [1], [2], etc.

---

## 2. Research Methodology & Evidence Telemetry
[Detailed overview of sub-question decomposition, academic scraping, vector retrieval, and corroboration]
[Include a summary markdown table of evidence telemetry, sources investigated, and confidence score]

---

## 3. Theoretical Foundations & Scholarly Literature (Google Scholar Analysis)
[In-depth synthesis of peer-reviewed literature, academic models, mathematical/algorithmic paradigms, citing specific papers and authors]

### 3.1 Algorithmic & Architectural Paradigms
[Deep technical breakdown of mechanisms]

### 3.2 Peer-Reviewed Benchmark Outcomes
[Empirical validation metrics, efficiency scaling, and comparative academic findings]

---

## 4. Industry Architectures & Real-World Implementations
[How industry frameworks deploy and scale these solutions]

### 4.1 System Topology & Operational Stacks
[Multi-layer architecture breakdown]

### 4.2 Comparative Architectural Matrix
[A detailed markdown comparison table comparing traditional, current, and next-gen approaches]

---

## 5. Critical Evaluation, Contradictions & Technical Bottlenecks
[Rigorous analysis of literature discrepancies, scalability bottlenecks, latency, memory, or security trade-offs]

---

## 6. Strategic Recommendations & Future Research Roadmap
[Phase 1 Immediate, Phase 2 Medium Term, Phase 3 Long Term actionable recommendations]

---

## 7. Conclusion
[Synthesis of overarching insights and closing perspective]

---

## 8. Annotated Bibliography & Citation Index
[Complete list of all cited evidence items [1], [2], etc. with paper/article titles, authors, and URLs]`;

    const reportContent = await llmService.generateCompletion(userPrompt, systemPrompt);

    await ResearchRun.findByIdAndUpdate(researchRunId, { status: 'validating', progress: 95 });

    // 6. Build citation records
    const citations = rankedChunks.map((chunk, idx) => ({
      chunkId: chunk._id,
      sourceId: chunk.sourceId?._id,
      referenceId: `[${idx + 1}]`,
      text: chunk.text.slice(0, 350),
    }));

    // 7. Detect research gaps
    const gaps = [];
    if (allChunks.length < 6) gaps.push('Limited primary evidence sample size collected');
    if ((run.subQuestions || []).length > rankedChunks.length) gaps.push('Some sub-investigation tracks required broader document extraction');

    // 8. Save final report
    const report = new Report({
      researchRunId,
      title: `Research Report: ${run.query}`,
      executiveSummary: reportContent.slice(0, 1200),
      methodology: `Autonomous multi-step research querying Google Scholar, Semantic Scholar, arXiv, and Universal Web search using ${allChunks.length} document chunks from ${new Set(allChunks.map(c => c.sourceId?.url)).size} sources, with dense vector similarity ranking.`,
      content: reportContent,
      citations,
      researchGaps: gaps,
      conflicts: [],
    });

    await report.save();
    await ResearchRun.findByIdAndUpdate(researchRunId, { status: 'completed', progress: 100 });

    console.log(`[SynthesisWorker] 2-3 page report generated successfully! ID: ${report._id}`);
    return { success: true, reportId: report._id };

  } catch (err) {
    console.error('[SynthesisWorker] Worker error:', err.message);
    await ResearchRun.findByIdAndUpdate(researchRunId, { status: 'failed', error: err.message });
  }
}

registerHandler('synthesizeReport', handleSynthesizeReport);

module.exports = { handleSynthesizeReport };
