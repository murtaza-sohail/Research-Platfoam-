const ResearchRun = require('../models/ResearchRun');
const llmService = require('../services/llmService');
const { addResearchJob, registerHandler } = require('./queue');

async function handlePlanResearch(job) {
  const { researchRunId, query } = job.data;
  
  try {
    await ResearchRun.findByIdAndUpdate(researchRunId, { status: 'planning', progress: 10 });
    console.log(`[Planning] Breaking down query: ${query}`);

    const systemPrompt = `You are an expert research planner. Break down the user's research query into 3 specific focused sub-questions for deep academic (Google Scholar) and web investigation. Return ONLY a valid JSON array of 3 strings like: ["question 1","question 2","question 3"]`;
    
    let subQuestions = [];
    try {
      const response = await llmService.generateCompletion(query, systemPrompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        subQuestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (e) {
      console.warn('[Planning] Using structured sub-investigations:', e.message);
      const cleanTopic = query.replace(/^What (is|are)\s*/i, '').replace(/\?+$/, '').trim();
      subQuestions = [
        `Theoretical foundations and Google Scholar literature on ${cleanTopic}`,
        `Modern system architectures, benchmarks, and implementations of ${cleanTopic}`,
        `Technical bottlenecks, trade-offs, and future research roadmap for ${cleanTopic}`
      ];
    }

    if (!Array.isArray(subQuestions) || subQuestions.length === 0) {
      subQuestions = [
        `Academic literature and breakthroughs in ${query}`,
        `State of the art benchmarks and deployments for ${query}`,
        `Critical bottlenecks and future directions in ${query}`
      ];
    }

    // Limit to top 3 sub-questions for optimal depth and speed
    subQuestions = subQuestions.slice(0, 3);

    await ResearchRun.findByIdAndUpdate(researchRunId, { 
      subQuestions,
      status: 'searching',
      progress: 20
    });

    console.log(`[Planning] Generated ${subQuestions.length} focused sub-questions`);
    await addResearchJob('executeSearch', { researchRunId, subQuestions });

  } catch (err) {
    console.error('[Planning] Worker error:', err.message);
    await ResearchRun.findByIdAndUpdate(researchRunId, { status: 'failed', error: err.message });
  }
}

registerHandler('planResearch', handlePlanResearch);

module.exports = { handlePlanResearch };
