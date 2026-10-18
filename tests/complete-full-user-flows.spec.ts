import { test, expect } from '@playwright/test';

test.describe('NDEB AFK Prep - Complete End-to-End User Journeys', () => {

  test('Flow 1: Complete Quiz to Results Screen & Restart Journey', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
      localStorage.setItem('ndeb_prep_is_premium', 'true');
      // Seed 3 flagged questions across different topics for a clean, deterministic complete quiz
      localStorage.setItem('ndeb_prep_flags', JSON.stringify([
        'operative-dentistry-1',
        'operative-dentistry-2',
        'oral-surgery-1'
      ]));
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // 1. Launch Flagged Quiz from Dashboard
    await page.click('button:has-text("Dashboard")');
    await page.waitForSelector('h2:has-text("Your Progress Dashboard")', { timeout: 8000 });
    
    // Find the flagged questions card and click its Start Review button
    const flaggedCard = page.locator('.glass-panel').filter({ has: page.locator('h3:has-text("Review Flagged Questions")') });
    await expect(flaggedCard).toContainText('3');
    await flaggedCard.locator('button:has-text("Start Review")').click();
    await page.waitForSelector('h2:has-text("Flagged Review")', { timeout: 15000 });

    // --- QUESTION 1 of 3 ---
    await expect(page.locator('span').filter({ hasText: /1\s*\/\s*3/ })).toBeVisible({ timeout: 10000 });
    const q1Options = page.locator('button:has(span[translate="no"])');
    await expect(q1Options.first()).toBeVisible();
    await q1Options.first().click();

    // Verify Result Bottom Sheet pops up
    const bottomSheet = page.locator('div[style*="position: fixed"][style*="bottom: 0"]');
    await expect(bottomSheet).toBeVisible({ timeout: 5000 });
    await expect(bottomSheet.locator('button:has-text("Next")')).toBeVisible();

    // Click Next -> advances to Q2
    await bottomSheet.locator('button:has-text("Next")').click();
    await page.waitForTimeout(400);

    // --- QUESTION 2 of 3 ---
    await expect(page.locator('span').filter({ hasText: /2\s*\/\s*3/ })).toBeVisible({ timeout: 10000 });
    const q2Options = page.locator('button:has(span[translate="no"])');
    await q2Options.first().click();
    await expect(bottomSheet.locator('button:has-text("Next")')).toBeVisible();
    await bottomSheet.locator('button:has-text("Next")').click();
    await page.waitForTimeout(400);

    // --- QUESTION 3 of 3 (LAST QUESTION) ---
    await expect(page.locator('span').filter({ hasText: /3\s*\/\s*3/ })).toBeVisible({ timeout: 10000 });
    const q3Options = page.locator('button:has(span[translate="no"])');
    await q3Options.first().click();

    // On the last question, bottom sheet action button says "Finish"
    const finishBtn = bottomSheet.locator('button:has-text("Finish")');
    await expect(finishBtn).toBeVisible({ timeout: 5000 });
    await finishBtn.click();

    // --- RESULTS SCREEN ---
    await expect(page.locator('h2:has-text("Quiz Complete!")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=out of 3 correct')).toBeVisible();
    await expect(page.locator('text=%')).toBeVisible();

    // Verify Topic Breakdown is rendered
    // Topic Breakdown is conditional on multi-topic simulated mode; flagged mode renders score summary

    // Click "Choose Another Topic" button
    const restartBtn = page.locator('button:has-text("Choose Another Topic")');
    await expect(restartBtn).toBeVisible();
    await restartBtn.click();

    // Verify returning cleanly to Topic Selection
    await page.waitForSelector('.topic-card', { timeout: 10000 });
    await expect(page.locator('h2:has-text("Select a Topic")')).toBeVisible();
  });

  test('Flow 2: Mid-Quiz Abandonment Interception and Confirmation Flow', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
      localStorage.setItem('ndeb_prep_is_premium', 'true');
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // Enter Operative Dentistry quiz
    await page.locator('h3', { hasText: 'Operative Dentistry' }).click({ force: true });
    await page.waitForSelector('button:has(span[translate="no"])', { timeout: 15000 });
    await expect(page.locator('span').filter({ hasText: /1\s*\// })).toBeVisible();

    // Attempt to navigate away to Dashboard mid-quiz
    await page.click('button:has-text("Dashboard")');

    // ConfirmModal must intercept navigation
    await expect(page.locator('h3:has-text("Leave Quiz?")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Are you sure you want to leave? Your current quiz session will end.')).toBeVisible();

    // Test CANCEL -> user stays in the quiz
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h3:has-text("Leave Quiz?")')).toHaveCount(0);
    await expect(page.locator('span').filter({ hasText: /1\s*\// })).toBeVisible();

    // Attempt navigation again and test CONFIRM -> user exits cleanly
    await page.click('button:has-text("Dashboard")');
    await expect(page.locator('h3:has-text("Leave Quiz?")')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Leave")');
    await expect(page.locator('h3:has-text("Leave Quiz?")')).toHaveCount(0);
    await expect(page.locator('h2:has-text("Your Progress Dashboard")')).toBeVisible({ timeout: 8000 });
  });

  test('Flow 3: Mistakes Bank Lifecycle - Error Logging, Reviewing, and Drilling', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
      localStorage.setItem('ndeb_prep_is_premium', 'true');
      // Start with 1 pre-logged mistake
      localStorage.setItem('ndeb_prep_mistakes', JSON.stringify(['biochemistry-1']));
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // Review Mistakes banner should display "1 incorrect answer saved for review"
    await expect(page.locator('text=1 incorrect answer saved for review')).toBeVisible({ timeout: 8000 });

    // Click Review Mistakes to open MistakesList
    await page.locator('h3:has-text("Review Mistakes")').first().click();
    await page.waitForSelector('#mistakes-back-button', { timeout: 8000 });
    await expect(page.locator('text=incorrect answer')).toBeVisible();

    // Verify Drill Mistakes button is present and click it
    const drillBtn = page.locator('button:has-text("Drill Mistakes")');
    await expect(drillBtn).toBeVisible();
    await drillBtn.click();

    // Mistakes drill quiz opens
    await page.waitForSelector('button:has(span[translate="no"])', { timeout: 15000 });
    await expect(page.locator('span').filter({ hasText: /1\s*\/\s*1/ })).toBeVisible();

    // Answer the question
    await page.locator('button:has(span[translate="no"])').first().click();
    const bottomSheet = page.locator('div[style*="position: fixed"][style*="bottom: 0"]');
    await expect(bottomSheet).toBeVisible({ timeout: 5000 });
    
    // Finish quiz
    const finishBtn = bottomSheet.locator('button:has-text("Finish")');
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    // Verify Results screen
    await expect(page.locator('h2:has-text("Quiz Complete!")')).toBeVisible({ timeout: 8000 });
    await page.locator('button:has-text("Choose Another Topic")').click();
    await page.waitForSelector('.topic-card', { timeout: 10000 });
  });

  test('Flow 4: Exam Date Countdown & Pacing Target Calculation', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
      localStorage.setItem('ndeb_prep_is_premium', 'true');
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // Navigate to Dashboard
    await page.click('button:has-text("Dashboard")');
    await page.waitForSelector('h2:has-text("Your Progress Dashboard")', { timeout: 8000 });

    // Click the Edit Exam Date icon / button
    const editBtn = page.locator('button[title*="Set Exam Date" i], button[title*="Edit" i], button:has(svg.lucide-edit-2), button:has(svg.lucide-calendar-days)').first();
    await editBtn.click();

    // Date picker input should be visible
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible({ timeout: 5000 });

    // Pick a date 45 days in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45);
    const dateString = futureDate.toISOString().split('T')[0];
    await dateInput.fill(dateString);

    // Click Save / Check button
    const saveBtn = page.locator('button:has(svg.lucide-check), button:has-text("Save")').first();
    await saveBtn.click();

    // Verify countdown updates with Days Left and Questions / Day
    await expect(page.locator('text=Days Left')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Questions / Day')).toBeVisible({ timeout: 5000 });
  });

  test('Flow 5: Dashboard Reset All Progress Cycle', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
      localStorage.setItem('ndeb_prep_is_premium', 'true');
      localStorage.setItem('ndeb_prep_progress', JSON.stringify({
        'operative-dentistry': {
          topicId: 'operative-dentistry',
          questionsAnswered: 20,
          currentScore: 18,
          highestScore: 18,
          totalQuestions: 20,
          isFinished: true,
          lastAttemptDate: Date.now()
        }
      }));
      localStorage.setItem('ndeb_prep_flags', JSON.stringify(['operative-dentistry-1']));
      localStorage.setItem('ndeb_prep_mistakes', JSON.stringify(['biochemistry-1']));
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // Go to Dashboard
    await page.click('button:has-text("Dashboard")');
    await page.waitForSelector('h2:has-text("Your Progress Dashboard")', { timeout: 8000 });

    // Find Reset All Progress button
    const resetBtn = page.locator('button:has-text("Reset All Progress")');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // ConfirmModal appears
    await expect(page.locator('h3:has-text("Reset All Progress?")')).toBeVisible({ timeout: 5000 });

    // Cancel first
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h3:has-text("Reset All Progress?")')).toHaveCount(0);

    // Open again and confirm
    await resetBtn.click();
    await expect(page.locator('h3:has-text("Reset All Progress?")')).toBeVisible();
    await page.click('button:has-text("Reset Progress")');
    await expect(page.locator('h3:has-text("Reset All Progress?")')).toHaveCount(0);

    // Verify stats return to 0 (storage is cleared)
    await page.waitForTimeout(800);
    const progressSaved = await page.evaluate(() => localStorage.getItem('ndeb_prep_progress'));
    expect(progressSaved).toBeNull();
  });

  test('Flow 6: Simulated Mock Exam Full Lifecycle & Resumption', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
      localStorage.setItem('ndeb_prep_is_premium', 'true');
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // Launch Simulated Mock Exam
    await page.locator('h3:has-text("Simulated Mock Exam")').click();
    await expect(page.locator('h2:has-text("Simulated AFK Exam")')).toBeVisible({ timeout: 15000 });

    // Verify 100 questions and timer
    await expect(page.locator('span').filter({ hasText: /1\s*\/\s*100/ })).toBeVisible({ timeout: 8000 });
    
    // Timer should be ticking down from ~02:00:00
    const timerElem = page.locator('div:has(svg.lucide-clock)').first();
    await expect(timerElem).toBeVisible();

    // Answer Q1
    await page.locator('button:has(span[translate="no"])').first().click();
    await page.waitForTimeout(400);

    // Advance to Q2
    const bottomSheet = page.locator('div[style*="position: fixed"][style*="bottom: 0"]');
    await bottomSheet.locator('button:has-text("Next")').click();
    await expect(page.locator('span').filter({ hasText: /2\s*\/\s*100/ })).toBeVisible({ timeout: 8000 });

    // Reload the page to test persistence/resumption
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });
    
    // Re-launch Simulated Mock Exam -> resumes where left off
    await page.locator('h3:has-text("Simulated Mock Exam")').click();
    await page.waitForSelector('h2:has-text("Simulated AFK Exam")', { timeout: 15000 });
    await expect(page.locator('span').filter({ hasText: /2\s*\/\s*100/ })).toBeVisible({ timeout: 8000 });
  });

  test('Flow 7: Footer Legal Modals Opening & Closing', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // 1. Medical Disclaimer Modal
    await page.locator('footer button:has-text("Medical Disclaimer")').click();
    await expect(page.locator('h3:has-text("Medical & Educational Disclaimer")')).toBeVisible({ timeout: 5000 });
    await page.click('button[aria-label="Close modal"]');
    await expect(page.locator('h3:has-text("Medical & Educational Disclaimer")')).toHaveCount(0);

    // 2. Terms of Use Modal
    await page.locator('footer button:has-text("Terms of Use")').click();
    await expect(page.locator('h3:has-text("Terms of Use (EULA)")')).toBeVisible({ timeout: 5000 });
    await page.click('button[aria-label="Close modal"]');
    await expect(page.locator('h3:has-text("Terms of Use (EULA)")')).toHaveCount(0);

    // 3. Privacy Policy Modal
    await page.locator('footer button:has-text("Privacy Policy")').click();
    await expect(page.locator('h3:has-text("Privacy Policy")')).toBeVisible({ timeout: 5000 });
    await page.click('button[aria-label="Close modal"]');
    await expect(page.locator('h3:has-text("Privacy Policy")')).toHaveCount(0);
  });

  test('Flow 8: Language Switch EN <-> FR Persistence', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // Navbar toggle button should show EN
    const langBtn = page.locator('button[aria-label*="Toggle language" i]');
    await expect(langBtn).toBeVisible();
    await expect(langBtn).toContainText('EN');

    // Click to toggle to FR
    await langBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // Verify it now shows FR
    const langBtnAfter = page.locator('button[aria-label*="Toggle language" i]');
    await expect(langBtnAfter).toContainText('FR');

    // Toggle back to EN
    await langBtnAfter.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.topic-card', { timeout: 15000 });
    await expect(page.locator('button[aria-label*="Toggle language" i]')).toContainText('EN');
  });

});
