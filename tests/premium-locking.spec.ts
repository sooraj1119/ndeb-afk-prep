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
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.topic-card', { timeout: 10000 });

    // 1. Anatomy (Premium) should have the PRO lock badge
    const anatomyCard = page.locator('.topic-card').filter({ hasText: 'Anatomy' }).first();
    await expect(anatomyCard.locator('.lock-badge')).toBeVisible({ timeout: 8000 });

    // 2. Clicking Anatomy should trigger Paywall
    await anatomyCard.click({ force: true });
    await expect(page.locator('h2:has-text("Unlock Pro")')).toBeVisible({ timeout: 8000 });

    // Close paywall
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);

    // 3. Navigate to Dashboard tab (label is "Dashboard" in nav)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const dash = btns.find(b => b.textContent?.includes('Dashboard'));
      if (dash) (dash as HTMLElement).click();
    });
    await page.waitForTimeout(1000);

    // Free user: "Drill Mistakes" area should show "Unlock Pro" button
    await expect(page.locator('button:has-text("Unlock Pro")')).toBeVisible({ timeout: 8000 });

    // 4. Go back to Study Topics tab (label is "Study Topics")
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const study = btns.find(b => b.textContent?.includes('Study Topics'));
      if (study) (study as HTMLElement).click();
    });
    await page.waitForTimeout(800);
    await page.waitForSelector('.topic-card', { timeout: 8000 });

    // 5. Ethics (Free) has no lock badge
    const ethicsCard = page.locator('.topic-card').filter({ hasText: 'Ethics' }).first();
    await expect(ethicsCard.locator('.lock-badge')).toHaveCount(0);

    // 6. Clicking Ethics opens quiz — assert via QuizHeader h2
    await ethicsCard.click({ force: true });
    await expect(page.locator('h2').filter({ hasText: 'Ethics' }).first()).toBeVisible({ timeout: 10000 });
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
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.topic-card', { timeout: 10000 });

    // 1. Anatomy should NOT have lock badge for premium user
    const anatomyCard = page.locator('.topic-card').filter({ hasText: 'Anatomy' }).first();
    await expect(anatomyCard.locator('.lock-badge')).toHaveCount(0, { timeout: 8000 });

    // 2. Dashboard shows "Drill Mistakes" button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const dash = btns.find(b => b.textContent?.includes('Dashboard'));
      if (dash) (dash as HTMLElement).click();
    });
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("Drill Mistakes")')).toBeVisible({ timeout: 8000 });

    // 3. Go back to Study Topics tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const study = btns.find(b => b.textContent?.includes('Study Topics'));
      if (study) (study as HTMLElement).click();
    });
    await page.waitForTimeout(800);
    await page.waitForSelector('.topic-card', { timeout: 8000 });

    // 4. Clicking Anatomy opens quiz directly (no paywall for premium)
    await anatomyCard.click({ force: true });
    await expect(page.locator('h2').filter({ hasText: 'Anatomy' }).first()).toBeVisible({ timeout: 10000 });
  });

});
