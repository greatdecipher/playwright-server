import { chromium } from "playwright";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

(async () => {
  // Set headless based on ENVIRONMENT variable (same logic as getAppliedJobs)
  const isProduction = process.env.ENVIRONMENT === 'production';
  const headless = isProduction;
  
  console.log(`🔧 Running saveSession in ${process.env.ENVIRONMENT || 'development'} mode (headless: ${headless})`);
  
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("🌐 Opening LinkedIn login page...");
  await page.goto("https://www.linkedin.com/login");

  console.log("🔐 Please log in manually in the opened window.");
  console.log("💡 After logging in and seeing your feed, return here and press ENTER.");

  // Wait for you to press Enter in the terminal
  await new Promise((resolve) => process.stdin.once("data", resolve));

  // Save session state
  await context.storageState({ path: "data/linkedin_state.json" });
  console.log("✅ Session saved to linkedin_state.json");

  await browser.close();
})();
