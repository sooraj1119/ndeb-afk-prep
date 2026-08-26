import { test, expect } from '@playwright/test';

test.describe('NDEB AFK Prep E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure a clean slate
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('User must accept disclaimer before accessing the app', async ({ page }) => {
    // Check if disclaimer is visible
    const disclaimerHeading = page.locator('h2', { hasText: 'Medical Disclaimer' });
    await expect(disclaimerHeading).toBeVisible();

    // Accept disclaimer
    const acceptBtn = page.locator('button', { hasText: 'I Understand and Agree' });
    await acceptBtn.click();

    // Verify Dashboard or Practice tab is visible
    const prepHeading = page.locator('h1', { hasText: 'NDEB Prep' });
    await expect(prepHeading).toBeVisible();
    
    // Verify localStorage was updated
    const accepted = await page.evaluate(() => localStorage.getItem('ndeb_prep_disclaimer_accepted'));
    expect(accepted).toBe('true');
  });

  test('Dark Mode toggle correctly updates the DOM and localStorage', async ({ page }) => {
    // Accept disclaimer
    await page.locator('button', { hasText: 'I Understand and Agree' }).click();

    // Find the toggle button (it's the last button in the nav)
    const toggleBtn = page.locator('nav button').last();
    
    // Click toggle to enable Dark Mode
    await toggleBtn.click();

    // Verify HTML has 'dark' class
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');

    // Verify localStorage
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');
  });

  test('User can navigate to Practice, select a topic, and answer a question', async ({ page }) => {
    // Accept disclaimer
    await page.locator('button', { hasText: 'I Understand and Agree' }).click();

    // Ensure we are on Practice tab
    const practiceTab = page.locator('button', { hasText: 'Practice' });
    await practiceTab.click();

    // Click on 'Anatomy' topic
    const anatomyCard = page.locator('h3', { hasText: 'Anatomy' });
    await anatomyCard.click();

    // Verify Quiz loaded (Wait for Question text)
    const nextBtn = page.locator('button', { hasText: 'Next' });
    await expect(nextBtn).toBeVisible();

    // Click the first option
    const firstOption = page.locator('button', { has: page.locator('div', { hasText: 'A' }) }).first();
    await firstOption.click();

    // Next button should still be visible, let's click it to progress
    await nextBtn.click();

    // Verify we moved to question 2 (or completed if it was a 1 question quiz, but anatomy has 100)
    const progressText = page.locator('span', { hasText: '/ 100' }); // Assuming exactly 100 questions
    await expect(progressText).toBeVisible();
    
    // Verify progress saved to localStorage
    const progress = await page.evaluate(() => localStorage.getItem('ndeb_prep_progress'));
    expect(progress).not.toBeNull();
    const parsed = JSON.parse(progress || '{}');
    expect(parsed.anatomy).toBeDefined();
    expect(parsed.anatomy.currentIndex).toBeGreaterThan(0);
  });
  
  test('User can flag a question and view it in Dashboard', async ({ page }) => {
     // Accept disclaimer
    await page.locator('button', { hasText: 'I Understand and Agree' }).click();

    // Open Anatomy quiz
    await page.locator('h3', { hasText: 'Anatomy' }).click();
    
    // Flag the question
    const flagBtn = page.locator('button', { hasText: 'Flag' });
    await flagBtn.click();
    
    // Verify button text changed to Flagged
    await expect(page.locator('button', { hasText: 'Flagged' })).toBeVisible();
    
    // Check localStorage
    const flags = await page.evaluate(() => localStorage.getItem('ndeb_prep_flags'));
    expect(flags).not.toBeNull();
    const parsed = JSON.parse(flags || '[]');
    expect(parsed.length).toBe(1);
  });
});
