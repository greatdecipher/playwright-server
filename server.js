import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check
app.get("/", (req, res) => {
  res.send("✅ Playwright server is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Playwright server running on port ${PORT}`)
);
