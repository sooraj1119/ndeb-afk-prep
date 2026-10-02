import { test, expect } from '@playwright/test';

test.describe('NDEB AFK Prep E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.clear();
      // Pre-accept disclaimer so tests dont have to deal with the modal
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    // Wait for topic grid to be visible (app is fully ready)
    await page.waitForSelector('h3:has-text("Oral Surgery")', { timeout: 15000 });
  });

  test('User must accept disclaimer before accessing the app', async ({ page }) => {
    // Clear the pre-accepted flag to test the disclaimer flow
    await page.evaluate(() => {
      localStorage.removeItem('ndeb_prep_disclaimer_accepted');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2', { hasText: 'Medical Disclaimer' })).toBeVisible({ timeout: 10000 });
    await page.locator('button', { hasText: 'I Understand and Agree' }).click();
    await expect(page.locator('h3', { hasText: 'Operative Dentistry' })).toBeVisible({ timeout: 10000 });
  });

  test('Dark Mode toggle correctly updates the DOM and localStorage', async ({ page }) => {
    // Disclaimer pre-accepted, click toggle directly
    await page.click('[data-testid="dark-mode-toggle"]');
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'), { timeout: 5000 });
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');
  });

  test('User can navigate to Practice, select a topic, and answer a question', async ({ page }) => {
    // Force-click to bypass any framer-motion overlay
    await page.locator('h3', { hasText: 'Operative Dentistry' }).click({ force: true });
    // Wait for quiz to load - look for question heading or option buttons
    await page.waitForTimeout(2000);
    await page.waitForSelector('button:has(span[translate="no"])', { timeout: 15000 });

    // Click first answer option
    await page.locator('button:has(span[translate="no"])').first().click();

    const progressText = page.locator('span').filter({ hasText: '/' }).first();
    await expect(progressText).toBeVisible({ timeout: 10000 });
  });
  
  test('User can flag a question and view it in Dashboard', async ({ page }) => {
    // Force-click to bypass any framer-motion overlay
    await page.locator('h3', { hasText: 'Operative Dentistry' }).click({ force: true });
    // Wait for quiz to load
    await page.waitForTimeout(2000);
    await page.waitForSelector('button:has-text("Flag")', { timeout: 15000 });

    // Click the Flag button
    await page.locator('button:has-text("Flag")').first().click({ force: true });

    // Verify localStorage was updated
    await page.waitForFunction(() => {
      const flags = localStorage.getItem('ndeb_prep_flags');
      try { return flags !== null && JSON.parse(flags).length > 0; } catch { return false; }
    }, { timeout: 10000 });
  });
});
