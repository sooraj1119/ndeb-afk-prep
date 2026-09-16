import { test, expect } from '@playwright/test';

test.describe('Strict Verification of Review Modes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true'));
    await page.reload();
  });

  test('Dashboard should auto-purge ghost IDs and count only valid string IDs', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('ndeb_prep_flags', JSON.stringify([1, 2, 3, 'anatomy-1', 'pharmacology-2']));
      localStorage.setItem('ndeb_prep_mistakes', JSON.stringify([4, 5, 'pathology-3']));
    });
    await page.reload();
    await page.waitForTimeout(3000); // Wait for 11,000 questions to download before checking purge logic!

    await page.click('text=Dashboard');
    const flaggedText = await page.locator('text=Review Flagged Questions').locator('..').textContent();
    expect(flaggedText).toContain('2');
  });

  test('Flagged Review should strictly enforce the 100-question limit for non-pro users', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const dummyFlags = Array.from({length: 150}, (_, i) => 'anatomy-' + (i+1));
      localStorage.setItem('ndeb_prep_flags', JSON.stringify(dummyFlags));
      localStorage.removeItem('ndeb_prep_pro');
    });
    await page.reload();
    await page.waitForTimeout(3000); // Wait for JSON

    await page.click('text=Dashboard');
    await page.click('button:has-text("Start Review")');
    
    await page.waitForSelector('h3', { timeout: 10000 });
    
    const counterText = await page.locator('span', { hasText: '/' }).first().textContent();
    expect(counterText).toContain('100');
  });
});
