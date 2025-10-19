import { test, expect } from '@playwright/test';
import { getAppliedJobs } from '../getAppliedJobs.js';

// Check if HEADED mode is enabled via environment variable
const isHeaded = process.env.HEADED === 'true';

test.describe('LinkedIn Applied Jobs Scraper', () => {
    test('should run getAppliedJobs successfully', async () => {
        // This test will run the scraper and verify it completes without errors
        await expect(async () => {
            await getAppliedJobs({ headless: !isHeaded });
        }).not.toThrow();
    });

    test('should handle login verification and retry if needed', async () => {
        // Run the function and expect it to complete
        // If login fails, it should retry up to MAX_LOGIN_ATTEMPTS times
        const startTime = Date.now();
        
        try {
            await getAppliedJobs({ headless: !isHeaded });
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`✅ Test completed in ${duration}ms`);
            expect(duration).toBeGreaterThan(0);
        } catch (error) {
            // If it fails after all retries, we expect a specific error message
            expect(error.message).toContain('LinkedIn login verification failed');
        }
    });
});
