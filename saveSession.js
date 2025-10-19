import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true }); // visible browser
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
