import express from "express";
import cors from "cors";
import { getAppliedJobs } from './getAppliedJobs.js';

const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware to track requests
app.use((req, res, next) => {
  const oldSend = res.send;
  const oldJson = res.json;
  
  // Capture response data
  res.send = function(data) {
    console.log(`[${new Date().toISOString()}] Response:`, data);
    return oldSend.apply(res, arguments);
  };
  
  res.json = function(data) {
    console.log(`[${new Date().toISOString()}] Response:`, JSON.stringify(data));
    return oldJson.apply(res, arguments);
  };

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Root endpoint redirect to health
app.get("/", (req, res) => {
  res.redirect('/health');
});

// Playwright automation endpoint
app.get('/applied', async (req, res) => {
  try {
    console.log('Starting LinkedIn automation...');
    await getAppliedJobs();
    res.status(200).json({ 
      status: 'success',
      message: 'Playwright script executed successfully'
    });
  } catch (error) {
    console.error('Automation failed:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Playwright server running on port ${PORT}`)
);
