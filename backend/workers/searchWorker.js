const ResearchRun = require('../models/ResearchRun');
const Source = require('../models/Source');
const academicSearchService = require('../services/academicSearchService');
const universalSearchService = require('../services/universalSearchService');
const { addResearchJob, registerHandler } = require('./queue');

async function handleExecuteSearch(job) {
  const { researchRunId, subQuestions } = job.data;

  try {
    await ResearchRun.findByIdAndUpdate(researchRunId, { status: 'collecting', progress: 28 });
    
    const seenUrls = new Set();
    let totalSaved = 0;
    let scholarSaved = 0;
    let webSaved = 0;

    console.log(`[SearchWorker] Executing academic & universal web search across ${subQuestions.length} tracks...`);

    for (let i = 0; i < subQuestions.length; i++) {
      const sq = subQuestions[i];
      console.log(`[SearchWorker] [${i + 1}/${subQuestions.length}] Searching: "${sq}"`);

      // Query Academic (Google Scholar/arXiv/OpenAlex) & Universal Web in parallel
      const [academicResults, webResults] = await Promise.all([
        academicSearchService.searchAcademic(sq, 4).catch(() => []),
        universalSearchService.searchWeb(sq, 4).catch(() => [])
      ]);

      const combinedResults = [...academicResults, ...webResults];

      for (const result of combinedResults) {
        if (!result.url) continue;

        const normalizedUrl = result.url.trim().toLowerCase();
        if (seenUrls.has(normalizedUrl)) continue;
        seenUrls.add(normalizedUrl);

        try {
          const parsed = new URL(result.url);
          if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)) continue;
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue;
        } catch { 
          continue; 
        }

        const source = new Source({
          researchRunId,
          url: result.url,
          title: result.title || result.url,
          domain: result.domain || (new URL(result.url).hostname),
          snippet: result.snippet || '',
          authors: result.authors || result.author || '',
          year: result.year || null,
          citationCount: result.citationCount || 0,
          pdfUrl: result.pdfUrl || null,
          sourceType: result.sourceType || 'webpage',
          status: 'pending'
        });

        await source.save();
        totalSaved++;

        if (['scholar', 'arxiv', 'academic'].includes(result.sourceType)) {
          scholarSaved++;
        } else {
          webSaved++;
        }
      }

      const progressPercent = 28 + Math.round(((i + 1) / subQuestions.length) * 15);
      await ResearchRun.findByIdAndUpdate(researchRunId, { progress: progressPercent });
    }

    console.log(`[SearchWorker] Search complete. Total sources harvested: ${totalSaved} (${scholarSaved} Scholar/Academic, ${webSaved} Web)`);
    
    await ResearchRun.findByIdAndUpdate(researchRunId, { 
      status: 'processing', 
      progress: 45 
    });

    await addResearchJob('processSources', { researchRunId });

  } catch (err) {
    console.error('[SearchWorker] Worker error:', err.message);
    await ResearchRun.findByIdAndUpdate(researchRunId, { status: 'failed', error: err.message });
  }
}

registerHandler('executeSearch', handleExecuteSearch);

module.exports = { handleExecuteSearch };
