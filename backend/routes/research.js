const express = require('express');
const router = express.Router();
const ResearchRun = require('../models/ResearchRun');
const Report = require('../models/Report');
const Source = require('../models/Source');
const { addResearchJob } = require('../workers/queue');

// Start a new research run
router.post('/', async (req, res) => {
  try {
    let { projectId, query } = req.body;
    
    // Ensure Mongoose is connected before querying
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('[Research Route] Waiting for database connection...');
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) return resolve();
        mongoose.connection.once('open', resolve);
        setTimeout(resolve, 6000);
      });
    }

    // Auto-resolve or create default Project if missing or invalid
    const Project = require('../models/Project');
    if (!projectId || !projectId.match(/^[0-9a-fA-F]{24}$/)) {
      let defaultProject = await Project.findOne({ name: 'Default Research Workspace' }).catch(() => null);
      if (!defaultProject) {
        defaultProject = new Project({
          name: 'Default Research Workspace',
          description: 'Auto-generated workspace for research runs',
          userId: new mongoose.Types.ObjectId()
        });
        await defaultProject.save().catch(() => {});
      }
      projectId = defaultProject ? defaultProject._id : new mongoose.Types.ObjectId();
    }
    
    // Create DB entry
    const run = new ResearchRun({
      projectId,
      query: query || 'Default Query',
      status: 'pending'
    });
    await run.save();

    // Queue the background job
    await addResearchJob('planResearch', {
      researchRunId: run._id,
      query: run.query
    });

    res.status(202).json({ message: 'Research started', run });
  } catch (error) {
    console.error('Error starting research:', error.message || error);
    res.status(500).json({ error: error.message || 'Server Error' });
  }
});

// Get research run status and telemetry
router.get('/:id', async (req, res) => {
  try {
    const run = await ResearchRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    let responseData = run.toObject();

    // Calculate source counts
    const sources = await Source.find({ researchRunId: run._id }).select('sourceType title url authors year citationCount domain status');
    const scholarSources = sources.filter(s => ['scholar', 'arxiv', 'academic'].includes(s.sourceType));
    const webSources = sources.filter(s => !['scholar', 'arxiv', 'academic'].includes(s.sourceType));

    responseData.stats = {
      totalSources: sources.length,
      scholarSourcesCount: scholarSources.length,
      webSourcesCount: webSources.length,
      extractedCount: sources.filter(s => s.status === 'chunked' || s.status === 'extracted').length
    };
    
    // If completed, attach the report and populated citations
    if (run.status === 'completed') {
      const report = await Report.findOne({ researchRunId: run._id }).populate('citations.sourceId');
      if (report) {
        responseData.report = report;
      }
    }
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching research run:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get all discovered sources for a research run
router.get('/:id/sources', async (req, res) => {
  try {
    const { type } = req.query;
    let query = { researchRunId: req.params.id };

    if (type === 'scholar') {
      query.sourceType = { $in: ['scholar', 'arxiv', 'academic'] };
    } else if (type === 'web') {
      query.sourceType = { $nin: ['scholar', 'arxiv', 'academic'] };
    }

    const sources = await Source.find(query).sort({ citationCount: -1, retrievalTimestamp: -1 });
    res.json(sources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
