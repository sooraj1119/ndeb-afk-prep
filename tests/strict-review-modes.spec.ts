import { test, expect } from '@playwright/test';

test.describe('Strict Verification of Review Modes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true'));
    await page.reload();
  });

  test('Flagged Review should strictly enforce the 100-question limit for non-pro users', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const flags = Array.from({length: 105}, (_, i) => `anatomy-${i}`);
      localStorage.setItem('ndeb_prep_flags', JSON.stringify(flags));
    });
    await page.reload();

    await page.click('text=Dashboard');
    const flaggedText = await page.locator('text=Review Flagged Questions').locator('..').textContent();
    expect(flaggedText).toContain('105');

    await page.click('text=Review Flagged Questions');
    
    const paywallHeading = page.locator('h2:has-text("Unlock Pro")');
    await expect(paywallHeading).toBeVisible();
  });
});
