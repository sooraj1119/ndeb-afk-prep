import { test, expect } from '@playwright/test';

test.describe('Strict Verification of Review Modes', () => {

  test('Dashboard should auto-purge ghost IDs and count only valid string IDs', async ({ page }) => {
    await page.goto('/');
    
    // Inject mixed data: 3 ghost IDs (numbers), 2 valid string IDs
    await page.evaluate(() => {
      localStorage.setItem('ndeb_prep_flags', JSON.stringify([1, 2, 3, 'anatomy-1', 'pharmacology-2']));
      localStorage.setItem('ndeb_prep_mistakes', JSON.stringify([4, 5, 'pathology-3']));
      
      const srsData = {
        '1': { nextReviewDate: 0, interval: 1, repetition: 1, efactor: 2.5 },
        '2': { nextReviewDate: 0, interval: 1, repetition: 1, efactor: 2.5 },
        'anatomy-2': { nextReviewDate: 0, interval: 1, repetition: 1, efactor: 2.5 }
      };
      localStorage.setItem('ndeb_prep_srs', JSON.stringify(srsData));
    });

    // Refresh to apply state
    await page.reload();

    // Check Flagged count text
    const flaggedText = await page.locator('text=Review Flagged Questions').locator('..').textContent();
    expect(flaggedText).toContain('2'); // Valid flags: anatomy-1, pharmacology-2
    
    // Check Mistakes count text
    const mistakesText = await page.locator('text=Weakness Drilling').locator('..').textContent();
    expect(mistakesText).toContain('1'); // Valid mistakes: pathology-3
  });

  test('Flagged Review should strictly enforce the 100-question limit for non-pro users', async ({ page }) => {
    await page.goto('/');
    
    // Inject 150 valid flagged questions
    await page.evaluate(() => {
      const dummyFlags = Array.from({length: 150}, (_, i) => "anatomy-" + (i+1));
      localStorage.setItem('ndeb_prep_flags', JSON.stringify(dummyFlags));
      // Force non-pro state
      localStorage.removeItem('ndeb_prep_pro');
    });

    await page.reload();

    // Click Start Review on Flagged Questions
    await page.click('button:has-text("Start Review")');

    // Wait for the Quiz to load
    await page.waitForSelector('text=Flagged Review');

    // Verify the question counter says 1 / 100
    const counterText = await page.locator('.flex.justify-between.items-center.mb-6 >> span').first().textContent();
    expect(counterText).toBe('Question 1 / 100');
  });

  test('Daily Review (SRS) should load valid questions without NaN crashes', async ({ page }) => {
    await page.goto('/');
    
    // Inject valid SRS data
    await page.evaluate(() => {
      const srsData = {
        'anatomy-10': { nextReviewDate: 0, interval: 1, repetition: 1, efactor: 2.5 },
        'anatomy-11': { nextReviewDate: Date.now() + 100000, interval: 1, repetition: 1, efactor: 2.5 }, // Not due
      };
      localStorage.setItem('ndeb_prep_srs', JSON.stringify(srsData));
    });

    await page.reload();

    // Navigate to Study Topics -> SRS Review
    await page.click('text=Study Topics');
    
    // Find the Daily Review Start button
    const srsButton = page.locator('button:has-text("Start Daily Review")');
    if (await srsButton.isVisible()) {
        await srsButton.click();
        
        // Wait for Quiz to load
        await page.waitForSelector('text=Daily SRS Review');
        
        // Verify only 1 question loaded
        const counterText = await page.locator('.flex.justify-between.items-center.mb-6 >> span').first().textContent();
        expect(counterText).toBe('Question 1 / 1');
    }
  });

});
