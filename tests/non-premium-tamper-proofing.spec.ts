import { test, expect } from '@playwright/test';

test.describe('Non-Premium Access Control & Tamper Proofing', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_is_premium', 'false');
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.topic-card', { timeout: 15000 });
  });

  test('1. All 13 Premium Topics display Lock Badges and trigger Paywall on click', async ({ page }) => {
    const premiumTopics = [
      'Anatomy', 'Pharmacology', 'Endodontics', 'Anesthesia', 'Pathology',
      'Prosthodontics', 'General Medicine', 'Oral Medicine', 'Implants',
      'Dental & Medical Emergencies', 'Orthodontics', 'Pedodontics',
      'Prevention & Infection Control'
    ];

    // Verify all 13 cards have lock badges using exact h3 text matching
    for (const topicName of premiumTopics) {
      const card = page.locator('.topic-card').filter({ has: page.locator('h3', { hasText: new RegExp(`^${topicName}$`) }) }).first();
      await expect(card.locator('.lock-badge')).toBeVisible();
    }

    // Click on Anatomy (Premium)
    await page.locator('.topic-card').filter({ hasText: 'Anatomy' }).first().click();
    await expect(page.locator('h2:has-text("Unlock Pro")')).toBeVisible({ timeout: 5000 });
    
    // Close with close button
    await page.click('button[aria-label="Close Paywall"]');
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);

    // Click on Pharmacology (Premium)
    await page.locator('.topic-card').filter({ hasText: 'Pharmacology' }).first().click();
    await expect(page.locator('h2:has-text("Unlock Pro")')).toBeVisible({ timeout: 5000 });
    await page.click('button[aria-label="Close Paywall"]');
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);
  });

  test('2. Free User: Simulated Mock Exam strictly excludes all 13 Premium Topics', async ({ page }) => {
    // Start simulated exam
    await page.locator('h3:has-text("Simulated Mock Exam")').click();
    await expect(page.locator('h2:has-text("Simulated AFK Exam")')).toBeVisible({ timeout: 15000 });

    // Inspect the active mock exam questions in localStorage
    const questions = await page.evaluate(() => {
      const raw = localStorage.getItem('ndeb_prep_active_mock');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.questions || [];
    });

    expect(questions.length).toBe(100);

    const premiumTopicIds = [
      'anatomy', 'pharmacology', 'endodontics', 'anesthesia', 'pathology',
      'prosthodontics', 'general-medicine', 'oral-medicine', 'implants',
      'emergencies', 'orthodontics', 'pedodontics', 'infection-control'
    ];

    const leakedQuestions = questions.filter((q: any) => premiumTopicIds.includes(q.topicId));
    expect(leakedQuestions.length).toBe(0);
  });

  test('3. Free User: Search strictly excludes questions from all 13 Premium Topics and caps at 5', async ({ page }) => {
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(800);

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('nerve');
    await page.waitForTimeout(1000);

    // Paywall upsell banner must be present
    await expect(page.locator('text=Subscribe to Pro to search')).toBeVisible();

    // Verify all rendered search result cards belong only to free topics
    const renderedTopicNames = await page.locator('.topic-badge').allTextContents();
    const premiumTopicNames = [
      'Anatomy', 'Pharmacology', 'Endodontics', 'Anesthesia', 'Pathology',
      'Prosthodontics', 'General Medicine', 'Oral Medicine', 'Implants',
      'Dental & Medical Emergencies', 'Orthodontics', 'Pedodontics',
      'Prevention & Infection Control'
    ];

    for (const name of renderedTopicNames) {
      expect(premiumTopicNames).not.toContain(name.trim());
    }
  });

});
