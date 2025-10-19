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
