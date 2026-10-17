import { test, expect } from '@playwright/test';

test.describe('Contextual Info Tooltips Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.topic-card', { timeout: 15000 });
  });

  test('1. SRS Daily Review Tooltip: opens, displays SM-2 details, closes cleanly without launching quiz', async ({ page }) => {
    const srsTooltipBtn = page.locator('[data-testid="info-tooltip-srs"]');
    await expect(srsTooltipBtn).toBeVisible();

    // Click tooltip button
    await srsTooltipBtn.click();

    // Popover should be visible with title & content
    const popover = page.locator('[data-testid="info-tooltip-srs-popover"]');
    await expect(popover).toBeVisible();
    await expect(popover.locator('h4')).toHaveText('SRS Daily Review');
    await expect(popover).toContainText('SuperMemo-2 (SM-2) Spaced Repetition');
    await expect(popover).toContainText('SuperMemo-2 Algorithm');

    // Ensure we are STILL on TopicSelection page and NOT inside a quiz or paywall modal
    await expect(page.locator('.topic-card').first()).toBeVisible();
    await expect(page.locator('h3:has-text("Daily Review (Spaced Repetition)")')).toBeVisible();

    // Close via Close button (X)
    const closeBtn = page.locator('[data-testid="info-tooltip-close"]');
    await closeBtn.click();
    await expect(popover).toHaveCount(0);
  });

  test('2. Simulated Mock Exam Tooltip: opens, displays format details, closes on Escape without starting exam', async ({ page }) => {
    const mockTooltipBtn = page.locator('[data-testid="info-tooltip-mock"]');
    await expect(mockTooltipBtn).toBeVisible();

    // Click tooltip button
    await mockTooltipBtn.click();

    // Popover should be visible
    const popover = page.locator('[data-testid="info-tooltip-mock-popover"]');
    await expect(popover).toBeVisible();
    await expect(popover.locator('h4')).toHaveText('Simulated Mock Exam');
    await expect(popover).toContainText('100 random questions');
    await expect(popover).toContainText('100 Questions');
    await expect(popover).toContainText('2.0-Hour Countdown');

    // Confirm that clicking the tooltip did NOT start the exam timer or quiz
    await expect(page.locator('text=Time Remaining')).toHaveCount(0);
    await expect(page.locator('h3:has-text("Simulated Mock Exam")')).toBeVisible();

    // Close via Escape key
    await page.keyboard.press('Escape');
    await expect(popover).toHaveCount(0);
  });

  test('3. Review Mistakes Tooltip on Topic Selection: opens, displays details, closes on backdrop click', async ({ page }) => {
    const mistakesTooltipBtn = page.locator('[data-testid="info-tooltip-mistakes"]');
    await expect(mistakesTooltipBtn).toBeVisible();

    // Click tooltip button
    await mistakesTooltipBtn.click();

    const popover = page.locator('[data-testid="info-tooltip-mistakes-popover"]');
    await expect(popover).toBeVisible();
    await expect(popover.locator('h4')).toHaveText('Weakness Drilling');
    await expect(popover).toContainText('Targeted Mistake Remediation');
    await expect(popover).toContainText('Targeted Recall');

    // Close by clicking backdrop outside popover
    await page.mouse.click(10, 10);
    await expect(popover).toHaveCount(0);
  });

  test('4. Weakness Drilling Tooltip on Dashboard: opens, displays remediation info, and closes', async ({ page }) => {
    // Navigate to Dashboard
    const dashboardTab = page.locator('button:has-text("Dashboard"), nav button:has-text("Dashboard"), [role="tab"]:has-text("Dashboard")').first();
    await dashboardTab.click();

    const weaknessTooltipBtn = page.locator('[data-testid="info-tooltip-weakness-drilling"]');
    await expect(weaknessTooltipBtn).toBeVisible({ timeout: 8000 });

    // Click tooltip button
    await weaknessTooltipBtn.click();

    const popover = page.locator('[data-testid="info-tooltip-weakness-drilling-popover"]');
    await expect(popover).toBeVisible();
    await expect(popover.locator('h4')).toHaveText('Weakness Drilling');
    await expect(popover).toContainText('Targeted Mistake Remediation');
    await expect(popover).toContainText('Active Recall');

    // Close with close button
    const closeBtn = page.locator('[data-testid="info-tooltip-close"]');
    await closeBtn.click();
    await expect(popover).toHaveCount(0);
  });
});
