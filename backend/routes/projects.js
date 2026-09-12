const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// Create a new project
router.post('/', async (req, res) => {
  try {
    const { name, description, userId } = req.body; // userId would normally come from auth middleware
    const project = new Project({ name, description, userId });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get all projects for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query; // temporary until auth is added
    const projects = await Project.find({ userId });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
