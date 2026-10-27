import { test, expect } from '@playwright/test';

test.describe('Continuous Resume & Topic Restart E2E Verification', () => {

  test('Flow 1: User completes 100 free questions, upgrades to Premium -> opens topic at Question 101', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
      localStorage.setItem('ndeb_prep_is_premium', 'true');
      // Simulate user having finished the 100-question preview in free tier
      localStorage.setItem('ndeb_prep_progress', JSON.stringify({
        'dental-materials': {
          topicId: 'dental-materials',
          highestScore: 85,
          totalQuestions: 100,
          currentIndex: 0,
          currentScore: 0,
          isFinished: true,
          questionsAnswered: 100
        }
      }));
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // Click Dental Materials topic card
    await page.locator('.topic-card').filter({ hasText: 'Dental Materials' }).click({ force: true });

    // Wait for quiz screen to initialize
    await page.waitForSelector('button:has(span[translate="no"])', { timeout: 15000 });

    // Progress counter MUST show Question 101 (index 100), not Question 1!
    const progressSpan = page.locator('span').filter({ hasText: /101\s*\// }).first();
    await expect(progressSpan).toBeVisible({ timeout: 8000 });

    // Answer Question 101
    const firstOption = page.locator('button:has(span[translate="no"])').first();
    await firstOption.click();

    // Verify rationale bottom sheet appears
    const bottomSheet = page.locator('div[style*="position: fixed"][style*="bottom: 0"]');
    await expect(bottomSheet).toBeVisible({ timeout: 5000 });
    const nextBtn = bottomSheet.locator('button:has-text("Next")');
    await expect(nextBtn).toBeVisible();

    // Click Next -> advances to Question 102!
    await nextBtn.click();
    await page.waitForTimeout(400);

    const q102Span = page.locator('span').filter({ hasText: /102\s*\// }).first();
    await expect(q102Span).toBeVisible({ timeout: 8000 });
  });

  test('Flow 2: Topic Restart Header Button with Confirmation Flow', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
      localStorage.setItem('ndeb_prep_is_premium', 'true');
      // Seed user on Question 102
      localStorage.setItem('ndeb_prep_progress', JSON.stringify({
        'dental-materials': {
          topicId: 'dental-materials',
          highestScore: 85,
          totalQuestions: 600,
          currentIndex: 101,
          currentScore: 86,
          isFinished: false,
          questionsAnswered: 102
        }
      }));
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // Open Dental Materials
    await page.locator('.topic-card').filter({ hasText: 'Dental Materials' }).click({ force: true });
    await page.waitForSelector('button:has(span[translate="no"])', { timeout: 15000 });

    // Verify currently on Question 102
    await expect(page.locator('span').filter({ hasText: /102\s*\// }).first()).toBeVisible({ timeout: 8000 });

    // Find and click the Restart button in the header
    const restartBtn = page.locator('button[title="Restart from Question 1"]');
    await expect(restartBtn).toBeVisible({ timeout: 5000 });
    await restartBtn.click();

    // Verify Restart Confirmation Modal appears
    await expect(page.locator('h3:has-text("Restart Topic Quiz?")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Are you sure you want to restart this topic from Question 1?')).toBeVisible();

    // Test CANCEL -> user stays on Question 102
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h3:has-text("Restart Topic Quiz?")')).toHaveCount(0);
    await expect(page.locator('span').filter({ hasText: /102\s*\// }).first()).toBeVisible();

    // Click Restart again and CONFIRM
    await restartBtn.click();
    await expect(page.locator('h3:has-text("Restart Topic Quiz?")')).toBeVisible({ timeout: 5000 });
    // Click the confirm "Restart" button inside modal
    const modalConfirmBtn = page.locator('div[style*="position: fixed"] button:has-text("Restart")');
    await modalConfirmBtn.click();

    // Verify quiz cleanly resets back to Question 1!
    await expect(page.locator('h3:has-text("Restart Topic Quiz?")')).toHaveCount(0);
    const q1Span = page.locator('span').filter({ hasText: /1\s*\// }).first();
    await expect(q1Span).toBeVisible({ timeout: 8000 });
  });

  test('Flow 3: Mid-Quiz User (Question 45) Resumes at Question 46', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
      localStorage.setItem('ndeb_prep_is_premium', 'true');
      // User left off at index 45 (question 46)
      localStorage.setItem('ndeb_prep_progress', JSON.stringify({
        'operative-dentistry': {
          topicId: 'operative-dentistry',
          highestScore: 40,
          totalQuestions: 600,
          currentIndex: 45,
          currentScore: 40,
          isFinished: false,
          questionsAnswered: 45
        }
      }));
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // Open Operative Dentistry
    await page.locator('.topic-card').filter({ hasText: 'Operative Dentistry' }).click({ force: true });
    await page.waitForSelector('button:has(span[translate="no"])', { timeout: 15000 });

    // Progress counter MUST show Question 46
    const progressSpan = page.locator('span').filter({ hasText: /46\s*\// }).first();
    await expect(progressSpan).toBeVisible({ timeout: 8000 });
  });

  test('Flow 4: Free Tier User Completed 100 Questions (No Premium) -> Cleanly Re-practices from Question 1', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
      localStorage.setItem('ndeb_prep_is_premium', 'false');
      // User finished 100 free questions but is NOT premium
      localStorage.setItem('ndeb_prep_progress', JSON.stringify({
        'biochemistry': {
          topicId: 'biochemistry',
          highestScore: 90,
          totalQuestions: 100,
          currentIndex: 0,
          currentScore: 0,
          isFinished: true,
          questionsAnswered: 100
        }
      }));
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // Open Biochemistry
    await page.locator('.topic-card').filter({ hasText: 'Biochemistry' }).click({ force: true });
    await page.waitForSelector('button:has(span[translate="no"])', { timeout: 15000 });

    // Progress counter must show 1 / 100 (clean restart for free tier re-practice, bounded at 100)
    const progressSpan = page.locator('span').filter({ hasText: /1\s*\/\s*100/ }).first();
    await expect(progressSpan).toBeVisible({ timeout: 8000 });

    // Free tier banner must be visible
    await expect(page.locator('text=Free Tier Preview')).toBeVisible();
  });

});
