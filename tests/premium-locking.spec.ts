import { test, expect } from '@playwright/test';

test.describe('Premium Locking Mechanisms', () => {

  test('Free User Flow - Verifies Paywall and Locks', async ({ page }) => {
    // Boot with free user state pre-loaded
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_is_premium', 'false');
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.topic-card', { timeout: 10000 });

    // 1. Anatomy (Premium) should have the PRO lock badge
    const anatomyCard = page.locator('.topic-card').filter({ hasText: 'Anatomy' }).first();
    await expect(anatomyCard.locator('.lock-badge')).toBeVisible({ timeout: 8000 });

    // 2. Clicking Anatomy should trigger Paywall
    await page.locator('h3:has-text("Anatomy")').click();
    await expect(page.locator('h2:has-text("Unlock Pro")')).toBeVisible({ timeout: 8000 });

    // Close paywall
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);

    // 3. Daily Review Banner should be locked with Pro badge for free users
    const dailyReviewBtn = page.locator('button:has-text("Daily Review")');
    if (await dailyReviewBtn.count() > 0) {
      await dailyReviewBtn.click();
      await expect(page.locator('h2:has-text("Unlock Pro")')).toBeVisible({ timeout: 8000 });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
    }

    // 4. Navigate to Dashboard tab
    await page.click('button:has-text("Dashboard")');
    await page.waitForTimeout(800);

    // Free user: "Drill Mistakes" area should show "Unlock Pro" button
    await expect(page.locator('button:has-text("Unlock Pro")')).toBeVisible({ timeout: 8000 });

    // 5. Go back to Study Topics tab
    await page.click('button:has-text("Study Topics")');
    await page.waitForTimeout(800);
    await page.waitForSelector('.topic-card', { timeout: 8000 });

    // 6. Ethics (Free) has no lock badge
    const ethicsCard = page.locator('.topic-card').filter({ hasText: 'Ethics' }).first();
    await expect(ethicsCard.locator('.lock-badge')).toHaveCount(0);

    // 7. Clicking Ethics opens quiz - assert via QuizHeader h2
    await page.locator('h3:has-text("Ethics")').click();
    await expect(page.locator('h2:has-text("Ethics")')).toBeVisible({ timeout: 15000 });
  });

  test('Premium User Flow - Verifies Unlocked Access', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Inject premium + at least 1 mistake so "Drill Mistakes" button is enabled
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_is_premium', 'true');
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
      localStorage.setItem('ndeb_prep_mistakes', JSON.stringify([{ id: 'oral-surgery-1', topicId: 'oral-surgery' }]));
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.topic-card', { timeout: 10000 });

    // 1. Anatomy should NOT have lock badge for premium user
    const anatomyCard = page.locator('.topic-card').filter({ hasText: 'Anatomy' }).first();
    await expect(anatomyCard.locator('.lock-badge')).toHaveCount(0, { timeout: 8000 });

    // 2. Dashboard shows "Drill Mistakes" button
    await page.click('button:has-text("Dashboard")');
    await page.waitForTimeout(800);
    await expect(page.locator('button:has-text("Drill Mistakes")')).toBeVisible({ timeout: 8000 });

    // 3. Go back to Study Topics tab
    await page.click('button:has-text("Study Topics")');
    await page.waitForTimeout(800);
    await page.waitForSelector('.topic-card', { timeout: 8000 });

    // 4. Clicking Anatomy opens quiz directly (no paywall for premium)
    await page.locator('h3:has-text("Anatomy")').click();
    await expect(page.locator('h2:has-text("Anatomy")')).toBeVisible({ timeout: 15000 });
  });

});