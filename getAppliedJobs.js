import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomDelay } from './utils/helper.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MAX_LOGIN_ATTEMPTS = 3;

export async function getAllElementJobCard(page, timeLine) {
    const appliedElements = await page.getByText(`Applied ${timeLine} ago`).all();
    return appliedElements;
}

export async function getJobData(page) {
    try {
        // Wait for and locate the expandable text box
        await page.waitForSelector('span[data-testid="expandable-text-box"]', { timeout: 10000 });
        
        // Click "… more" button if present to expand full content
        const moreButton = page.locator('button[data-testid="expandable-text-button"]');
        if (await moreButton.count() > 0) {
            await moreButton.first().click();
            await randomDelay(1000, 2000);
        }
        
        // Get the expandable text box element
        const jobDescriptionBox = page.locator('span[data-testid="expandable-text-box"]').first();
        
        // Extract plain text (easier for analysis/searching)
        const plainText = await jobDescriptionBox.textContent();
        
        return {
            plainText: plainText.trim(),
        };
    } catch (error) {
        console.error('Error extracting job data:', error.message);
        return {
            plainText: null,
            html: null,
            error: error.message
        };
    }
}

export async function getAppliedJobs(options = {}) {
    const { headless = true } = options;
    
    const browser = await chromium.launch({ 
        headless,
        slowMo: 100
    });

    let context = null;
    let loginVerified = false;
    let attemptCount = 0;

    // Retry loop for LinkedIn login verification
    while (!loginVerified && attemptCount < MAX_LOGIN_ATTEMPTS) {
        attemptCount++;
        
        try {
            context = await browser.newContext({
                storageState: join(__dirname, 'data/linkedin_state.json')
            });

            const page = await context.newPage();
            await page.goto('https://www.linkedin.com/jobs/', { timeout: 60000, waitUntil: 'domcontentloaded' });
            
            const dashboardText = await page.getByText('My Career Insights');
            const isVisible = await dashboardText.isVisible({ timeout: 20000 });
            
            if (isVisible) {
                console.log('✅ Successfully verified LinkedIn login - User is on dashboard');
                loginVerified = true;
            } else {
                console.log(`❌ Login verification failed (Attempt ${attemptCount}/${MAX_LOGIN_ATTEMPTS})`);
                await context.close();
                context = null;
                
                if (attemptCount < MAX_LOGIN_ATTEMPTS) {
                    console.log('🔄 Running saveSession to re-authenticate...');
                    await execAsync('node saveSession.js', { cwd: __dirname });
                }
            }
        } catch (error) {
            console.error(`❌ Error during login verification (Attempt ${attemptCount}/${MAX_LOGIN_ATTEMPTS}):`, error.message);
            if (context) {
                await context.close();
                context = null;
            }
            
            if (attemptCount < MAX_LOGIN_ATTEMPTS) {
                console.log('🔄 Running saveSession to re-authenticate...');
                await execAsync('node saveSession.js', { cwd: __dirname });
            }
        }
    }

    if (!loginVerified) {
        await browser.close();
        throw new Error(`LinkedIn login verification failed after ${MAX_LOGIN_ATTEMPTS} attempts`);
    }

    try {
        const page = context.pages()[0];
        
        const myJobsButton = await page.getByRole('link', { name: 'My jobs' });
        await myJobsButton.click();
        console.log('🌐 Navigated to My Jobs page');
        await page.waitForLoadState('domcontentloaded');
        await randomDelay();
        
        const appliedJobsButton = await page.getByRole('button', { name: 'Applied' });
        await appliedJobsButton.click();
        console.log('🌐 Filtered to Applied Jobs');
        await page.waitForLoadState('domcontentloaded');
        await randomDelay();
        
        const timeLine = options.timeline || '3w'; // ago
        const appliedElements = await getAllElementJobCard(page, timeLine);
        console.log(`🔍 Found ${appliedElements.length} applied job(s)`);
        
        // Array to collect all job data
        const allJobsData = [];
        
        // Filter and click only those containing '{n}' (weeks)
        for (let i = 0; i < appliedElements.length; i++) {
            const element = appliedElements[i];
            const text = await element.textContent();
            
            if (text.includes(timeLine)) {
                try {
                    await element.isVisible();
                    console.log(`📋 Processing job ${i + 1}/${appliedElements.length}: ${text.trim()}`);
                    
                    await element.click();
                    await randomDelay(2000, 4000);
                    
                    // Get the job data
                    const jobData = await getJobData(page);
                    
                    // Add metadata
                    const jobEntry = {
                        index: i + 1,
                        appliedDate: text.trim(),
                        ...jobData,
                        scrapedAt: new Date().toISOString()
                    };
                    
                    allJobsData.push(jobEntry);
                    console.log(`✅ Successfully scraped job ${i + 1}`);
                    
                    // Go back to previous page
                    await page.goBack();
                    await randomDelay(1000, 2000);
                } catch (error) {
                    console.error(`❌ Error processing job ${i + 1}:`, error.message);
                    // Continue with next job even if one fails
                    allJobsData.push({
                        index: i + 1,
                        appliedDate: text.trim(),
                        error: error.message,
                        scrapedAt: new Date().toISOString()
                    });
                }
            }
        }
        
        console.log(`🎉 Scraping complete! Collected ${allJobsData.length} job(s)`);
        return allJobsData;

    } catch (error) {
        console.error('Error during scraping:', error);
        throw error;
    } finally {
        if (context) {
            await context.close();
        }
        await browser.close();
    }
}
