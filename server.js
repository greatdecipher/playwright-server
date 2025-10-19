import express from "express";
import cors from "cors";
import { getAppliedJobs } from './getAppliedJobs.js';

const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware to track requests
app.use((req, res, next) => {
  const oldJson = res.json;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  res.json = function (data) {
    console.log(`[${new Date().toISOString()}] Response:`, JSON.stringify(data));
    return oldJson.apply(res, arguments);
  };

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
    const { timeline } = req.query; // Optional: ?timeline=2w
    
    console.log(`Starting LinkedIn scraping... (timeline: ${timeline || 'default'})`);
    
    const jobsData = await getAppliedJobs({ 
      headless: true,
      timeline 
    });
    
    res.status(200).json({ 
      status: 'success',
      message: 'Scraping completed successfully',
      count: jobsData.length,
      data: jobsData
    });
  } catch (error) {
    console.error('Automation failed:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

// ✅ Catch-all for unknown routes (404 handler)
app.use((req, res) => {
  console.warn(`[${new Date().toISOString()}] Unknown route: ${req.originalUrl}`);
  res.status(404).json({
    status: "error",
    message: `Route not found: ${req.originalUrl}`,
  });
});

// ✅ Global error handler for unexpected exceptions
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Uncaught error:`, err);
  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
    details: err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Playwright server running on port ${PORT}`)
);
