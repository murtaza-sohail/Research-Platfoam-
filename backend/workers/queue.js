const EventEmitter = require('events');

const jobHandlers = {};

async function processJobInMemory(jobName, data) {
  console.log(`[Queue] Processing job: ${jobName}`);
  try {
    if (jobHandlers[jobName]) {
      await jobHandlers[jobName]({ name: jobName, data });
    } else {
      console.warn(`[Queue] No handler registered for: ${jobName}`);
    }
  } catch (err) {
    console.error(`[Queue] Job ${jobName} failed:`, err.message);
  }
}

async function addResearchJob(jobName, data) {
  setImmediate(() => processJobInMemory(jobName, data));
  return { id: `mem-${Date.now()}` };
}

function registerHandler(jobName, handler) {
  jobHandlers[jobName] = handler;
}

console.log('[Queue] In-memory job queue ready (zero external dependencies required)');

module.exports = {
  researchQueue: null,
  addResearchJob,
  registerHandler,
  useRealBullMQ: false,
};

