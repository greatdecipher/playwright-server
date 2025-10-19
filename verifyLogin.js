import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function verifyLinkedInLogin() {
    const browser = await chromium.launch({ 
        headless: false, // Launch in headed mode
        slowMo: 100 // Add 100ms delay between actions
    });
    const context = await browser.newContext({
        storageState: join(__dirname, 'data/linkedin_state.json')
    });

    try {
        const page = await context.newPage();
        await page.goto('https://www.linkedin.com/jobs/', { timeout: 60000, waitUntil: 'domcontentloaded' });
        
        // Wait for the specific text that indicates we're on the dashboard
        const dashboardText = await page.getByText('My Career Insights');
        const isVisible = await dashboardText.isVisible({ timeout: 20000 });
        
        if (isVisible) {
            console.log('✅ Successfully verified LinkedIn login - User is on dashboard');
        } else {
            console.log('❌ Could not verify LinkedIn login - Dashboard text not found');
        }
    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await context.close();
        await browser.close();
    }
}

verifyLinkedInLogin().catch(console.error);
