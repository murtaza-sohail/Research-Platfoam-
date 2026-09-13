const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Connect Database
connectDB();

const app = express();

const projectsRouter = require('./routes/projects');
const researchRouter = require('./routes/research');

// Initialize Workers
require('./workers/planningWorker');
require('./workers/searchWorker');
require('./workers/processWorker');
require('./workers/synthesisWorker');

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // Secure HTTP headers
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev')); // Logging

// Routes
app.use('/api/projects', projectsRouter);
app.use('/api/research', researchRouter);

// Basic route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'DeepResearch Backend API is active!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
