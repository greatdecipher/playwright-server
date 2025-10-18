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

// Main scrape endpoint
app.post("/scrape", async (req, res) => {
  const { url, storageStatePath } = req.body;

  try {
    const browser = await chromium.launch({ headless: true });
    const context = storageStatePath
      ? await browser.newContext({ storageState: storageStatePath })
      : await browser.newContext();
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Example: scrape LinkedIn applied jobs
    const jobs = await page.$$eval(".job-card-container", (cards) =>
      cards.map((card) => ({
        title:
          card.querySelector(".job-card-list__title")?.innerText?.trim() || null,
        company:
          card.querySelector(".job-card-container__company-name")?.innerText?.trim() ||
          null,
        link: card.querySelector("a")?.href || null,
      }))
    );

    await browser.close();
    res.json({ success: true, jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Playwright server running on port ${PORT}`)
);
