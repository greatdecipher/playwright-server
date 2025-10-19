import express from "express";
import cors from "cors";
import { getAppliedJobs } from './getAppliedJobs.js';

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check
app.get("/", (req, res) => {
  res.send("✅ Playwright server is running!");
});

app.get('/run', async (req, res) => {
  await getAppliedJobs();
  res.send('Playwright script executed!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Playwright server running on port ${PORT}`)
);
