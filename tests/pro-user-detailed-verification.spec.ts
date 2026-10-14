import { test, expect } from '@playwright/test';

test.describe('Detailed Verification for Pro Users', () => {

  test.beforeEach(async ({ page }) => {
    // Start with a clean base and set Pro user state
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_is_premium', 'true');
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.topic-card', { timeout: 15000 });
  });

  test('1. Topic Selection: Top Pro Banner and Lock Badges are completely removed', async ({ page }) => {
    // "Unlock All 22 NDEB Topic Banks" upsell banner should NOT exist
    await expect(page.locator('h3:has-text("Unlock All 22 NDEB Topic Banks")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Upgrade to Pro")')).toHaveCount(0);

    // Lock badges across all topic cards should be 0
    const lockBadges = page.locator('.lock-badge');
    await expect(lockBadges).toHaveCount(0);
  });

  test('2. Daily Review (SRS): No PRO tag, no lock icon, and launches seamlessly when items due', async ({ page }) => {
    // When 0 items due
    const srsBanner = page.locator('div:has-text("Daily Review (Spaced Repetition)")').first();
    await expect(srsBanner).toBeVisible();
    await expect(page.locator('[data-testid="srs-pro-badge"]')).toHaveCount(0);
    await expect(page.locator('text=You\'re all caught up for today!')).toBeVisible();

    // Now inject 2 due SRS questions with valid SM-2 nextReviewDate in the past
    await page.evaluate(() => {
      const now = Date.now();
      const srsData = {
        'operative-dentistry-1': { questionId: 'operative-dentistry-1', interval: 1, repetition: 1, efactor: 2.5, nextReviewDate: now - 100000 },
        'pharmacology-1': { questionId: 'pharmacology-1', interval: 1, repetition: 1, efactor: 2.5, nextReviewDate: now - 50000 }
      };
      localStorage.setItem('ndeb_prep_srs', JSON.stringify(srsData));
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // Should indicate 2 due questions
    await expect(page.locator('text=questions due for review today')).toBeVisible();
    await expect(page.locator('[data-testid="srs-pro-badge"]')).toHaveCount(0);

    // Clicking Daily Review enters quiz immediately without paywall
    await page.locator('h3:has-text("Daily Review (Spaced Repetition)")').click();
    await expect(page.locator('h2:has-text("Daily SRS Review")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);

    // Back to topics
    await page.locator('button:has-text("Back")').first().click();
    await page.waitForSelector('.topic-card', { timeout: 10000 });
  });

  test('3. Premium Topics Access: Can open Endodontics & Pharmacology with no paywall or preview banner', async ({ page }) => {
    // 3a. Endodontics (Premium)
    await page.locator('h3:has-text("Endodontics")').click();
    await expect(page.locator('h2:has-text("Endodontics")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Free Tier Preview')).toHaveCount(0);
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);

    // Return to study topics
    await page.locator('button:has-text("Back")').first().click();
    await page.waitForSelector('.topic-card', { timeout: 10000 });

    // 3b. Pharmacology (Premium)
    await page.locator('h3:has-text("Pharmacology")').click();
    await expect(page.locator('h2:has-text("Pharmacology")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Free Tier Preview')).toHaveCount(0);
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);

    await page.locator('button:has-text("Back")').first().click();
    await page.waitForSelector('.topic-card', { timeout: 10000 });
  });

  test('4. Weakness Drilling (Mistakes): Launches without paywall', async ({ page }) => {
    // Inject a mistake
    await page.evaluate(() => {
      localStorage.setItem('ndeb_prep_mistakes', JSON.stringify([{ id: 'biochemistry-1', topicId: 'biochemistry' }]));
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    const reviewMistakesBanner = page.locator('h3:has-text("Review Mistakes")');
    await expect(reviewMistakesBanner).toBeVisible();
    await expect(page.locator('[data-testid="mistakes-pro-badge"]')).toHaveCount(0);

    // Clicking opens mistakes list or quiz
    await reviewMistakesBanner.click();
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);
  });

  test('5. Search: Pro user has full search across questions without 5-result limit or paywall banner', async ({ page }) => {
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(800);

    // Search for a common clinical keyword
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('nerve');
    await page.waitForTimeout(1000);

    // Free users see "Subscribe to Pro to search the entire..." banner
    await expect(page.locator('text=Subscribe to Pro to search')).toHaveCount(0);
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);
  });

  test('6. Dashboard: Clean Pro experience without upsell button', async ({ page }) => {
    await page.click('button:has-text("Dashboard")');
    await page.waitForTimeout(800);

    // Top Upgrade to Pro button should NOT be visible
    await expect(page.locator('button:has-text("Upgrade to Pro")')).toHaveCount(0);

    // Pacing engine and achievements visible
    await expect(page.locator('text=Dynamic Study Pacer')).toBeVisible();
    await expect(page.locator('text=Achievements & Badges')).toBeVisible();
  });

});
