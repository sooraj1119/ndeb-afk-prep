import { test, expect } from '@playwright/test';

test.describe('1. Medical Disclaimer Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('1a. Modal is shown on first launch', async ({ page }) => {
    await expect(page.locator('h2:has-text("Medical Disclaimer")')).toBeVisible({ timeout: 8000 });
  });

  test('1b. Accepting disclaimer hides modal and saves state', async ({ page }) => {
    await page.locator('button:has-text("I Understand and Agree")').click();
    await expect(page.locator('h2:has-text("Medical Disclaimer")')).toBeHidden();
    
    // Verify state
    const val = await page.evaluate(() => localStorage.getItem('ndeb_prep_disclaimer_accepted'));
    expect(val).toBe('true');
  });
});

test.describe('Main App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
    });
    await page.reload();
    await page.waitForSelector('h3:has-text("Oral Surgery")', { timeout: 10000 });
  });

  // ============================================================
  // BLOCK 2: NAVIGATION
  // ============================================================
  test('2a. Study Topics tab loads topic cards', async ({ page }) => {
    await expect(page.locator('h3:has-text("Oral Surgery")')).toBeVisible();
    await expect(page.locator('h3:has-text("Pharmacology")')).toBeVisible();
  });

  test('2b. Dashboard tab is clickable and renders', async ({ page }) => {
    await page.click('text=Dashboard');
    await expect(page.locator('h2:has-text("Your Progress Dashboard")')).toBeVisible({ timeout: 8000 });
  });

  test('2c. Search tab is clickable and renders', async ({ page }) => {
    await page.click('text=Search');
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible({ timeout: 8000 });
  });

  // ============================================================
  // BLOCK 3: TOPIC SELECTION
  // ============================================================
  test('3a. Clicking Oral Surgery starts the quiz', async ({ page }) => {
    await page.locator('h3:has-text("Oral Surgery")').click();
    await expect(page.locator('h2:has-text("Oral Surgery")')).toBeVisible({ timeout: 15000 });
  });

  // ============================================================
  // BLOCK 4: QUIZ ENGINE
  // ============================================================
  test.describe('4. Quiz Engine', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('h3:has-text("Oral Surgery")').click();
      await page.waitForSelector('h2:has-text("Oral Surgery")', { timeout: 15000 });
      // Wait for options to render
      await page.waitForSelector('button:has(span[translate="no"])', { timeout: 15000 });
    });

    test('4a. First question renders with 4 answer options', async ({ page }) => {
      const optionCount = await page.locator('button:has(span[translate="no"])').count();
      expect(optionCount).toBeGreaterThanOrEqual(4);
    });

    test('4b. Selecting an answer shows explanation and saves progress', async ({ page }) => {
      // Click first option
      await page.locator('button:has(span[translate="no"])').first().click();
      
      // Explanation should appear
      await expect(page.locator('text=Tutor Explanation').or(page.locator('[data-testid="explanation"]'))).toBeVisible({ timeout: 8000 });
      
      // Check progress saved
      const progress = await page.evaluate(() => localStorage.getItem('ndeb_prep_progress'));
      expect(progress).not.toBeNull();
    });

    test('4c. Next button advances to next question', async ({ page }) => {
      await page.locator('button:has(span[translate="no"])').first().click();
      await page.waitForTimeout(500); // Wait for transition/animation
      
      const nextBtn = page.locator('button:has-text("Next")');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
      } else {
        await page.keyboard.press('ArrowRight');
      }
      
      await expect(page.locator('span').filter({ hasText: '2 /' })).toBeVisible({ timeout: 8000 });
    });

    test('4d. Flagging a question works', async ({ page }) => {
      await page.locator('button:has-text("Flag")').click();
      await expect(page.locator('button:has-text("Flagged")')).toBeVisible();
      
      const flags = await page.evaluate(() => localStorage.getItem('ndeb_prep_flags'));
      expect(flags).toContain('oral-surgery-');
    });
  });

  // ============================================================
  // BLOCK 5: DARK MODE
  // ============================================================
  test('5a. Dark mode toggle adds dark class to html', async ({ page }) => {
    // Navigate to Search tab first so the navbar is definitely visible
    await page.click('text=Search');
    await page.waitForTimeout(500);
    // Execute a click using page.evaluate to bypass any overlay issues (like Google Translate)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('nav button'));
      const toggle = buttons.find(b => b.innerHTML.includes('lucide-moon') || b.innerHTML.includes('lucide-sun'));
      if (toggle) (toggle as HTMLElement).click();
    });
    
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');
  });

  // ============================================================
  // BLOCK 6: DASHBOARD
  // ============================================================
  test.describe('6. Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=Dashboard');
      await page.waitForSelector('h2:has-text("Your Progress Dashboard")', { timeout: 8000 });
    });

    test('6a. Dashboard renders stat cards', async ({ page }) => {
      // Use more specific locator for the headings
      await expect(page.locator('div:has-text("Bank Completed")').first()).toBeVisible({ timeout: 5000 });
    });

    test('6b. Flagged Questions section is visible', async ({ page }) => {
      await expect(page.locator('h3:has-text("Review Flagged Questions")')).toBeVisible({ timeout: 5000 });
    });

    test('6c. Ghost ID flags (numeric IDs) are ignored in UI count', async ({ page }) => {
      // Inject ghost ID and valid ID
      await page.evaluate(() => {
        localStorage.setItem('ndeb_prep_flags', JSON.stringify([1, 2, 'oral-surgery-5']));
      });
      await page.reload();
      await page.click('text=Dashboard');
      await page.waitForTimeout(1000);
      
      // UI count should be 1, because 1 and 2 are numeric ghost IDs and are filtered out
      const text = await page.locator('h3:has-text("Review Flagged Questions")').locator('..').textContent();
      expect(text).toContain('1');
    });
  });

  // ============================================================
  // BLOCK 7: LOCALSTORAGE INTEGRITY
  // ============================================================
  test('7a. Empty or corrupt flags list does not crash Dashboard', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('ndeb_prep_flags', 'not-a-valid-json');
    });
    await page.reload();
    await page.click('text=Dashboard');
    await expect(page.locator('h2:has-text("Your Progress Dashboard")')).toBeVisible({ timeout: 8000 });
  });
});
