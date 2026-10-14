import { test, expect } from '@playwright/test';

test.describe('NDEB AFK Prep - Master Clean End-to-End Test Suite', () => {

  const FREE_TOPICS = [
    'Operative Dentistry', 'Biochemistry', 'Microbiology', 'Dental Materials',
    'Periodontology', 'Oral Pathology', 'Radiology', 'Ethics', 'Oral Surgery'
  ];

  const PREMIUM_TOPICS = [
    'Anatomy', 'Pharmacology', 'Endodontics', 'Anesthesia', 'Pathology',
    'Prosthodontics', 'General Medicine', 'Oral Medicine', 'Implants',
    'Dental & Medical Emergencies', 'Orthodontics', 'Pedodontics',
    'Prevention & Infection Control'
  ];

  test('Part 1: Fresh Free User Journey - Onboarding, Strict Gating & Free Features', async ({ page }) => {
    // 1. Fresh state with completely clean localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // 2. Medical Disclaimer verification & acceptance
    const disclaimer = page.locator('h2:has-text("Medical Disclaimer")');
    await expect(disclaimer).toBeVisible({ timeout: 8000 });
    await page.click('button:has-text("I Understand and Agree")');
    await expect(disclaimer).toHaveCount(0);

    // 3. Topic selection grid loads
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // 4. Verify all 13 Premium topics display lock badges
    for (const name of PREMIUM_TOPICS) {
      const card = page.locator('.topic-card').filter({ has: page.locator('h3', { hasText: new RegExp(`^${name}$`) }) }).first();
      await expect(card.locator('.lock-badge')).toBeVisible();
    }

    // 5. Verify all 9 Free topics DO NOT have lock badges
    for (const name of FREE_TOPICS) {
      const card = page.locator('.topic-card').filter({ has: page.locator('h3', { hasText: new RegExp(`^${name}$`) }) }).first();
      await expect(card.locator('.lock-badge')).toHaveCount(0);
    }

    // 6. Verify Daily Review banner has PRO badge and opens Paywall
    await expect(page.locator('[data-testid="srs-pro-badge"]')).toBeVisible();
    await page.locator('h3:has-text("Daily Review (Spaced Repetition)")').click();
    await expect(page.locator('h2:has-text("Unlock Pro")')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);

    // 7. Verify Review Mistakes banner has PRO badge and opens Paywall
    await expect(page.locator('[data-testid="mistakes-pro-badge"]')).toBeVisible();
    await page.locator('h3:has-text("Review Mistakes")').click();
    await expect(page.locator('h2:has-text("Unlock Pro")')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);

    // 8. Attempt clicking Premium Topic (Endodontics) -> opens Paywall
    await page.locator('.topic-card').filter({ hasText: 'Endodontics' }).first().click();
    await expect(page.locator('h2:has-text("Unlock Pro")')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);

    // 9. Enter a Free Topic (Operative Dentistry) and complete a question
    await page.locator('h3', { hasText: 'Operative Dentistry' }).click({ force: true });
    await page.waitForTimeout(1000);
    await page.waitForSelector('button:has(span[translate="no"])', { timeout: 15000 });

    // Answer the first option
    await page.locator('button:has(span[translate="no"])').first().click();
    await page.waitForTimeout(500);

    // Verify explanation section is visible
    await expect(page.locator('text=Explanation').first()).toBeVisible({ timeout: 5000 });

    // Flag question
    await page.click('button:has-text("Flag"), button:has-text("Flagged")');
    await page.waitForTimeout(400);

    // Return to topics
    await page.click('#quiz-back-button');
    await page.waitForSelector('.topic-card', { timeout: 10000 });

    // 10. Test Free User Simulated Mock Exam
    await page.locator('h3:has-text("Simulated Mock Exam")').click();
    await expect(page.locator('h2:has-text("Simulated AFK Exam")')).toBeVisible({ timeout: 15000 });

    // Verify mock exam contains exactly 100 questions and ZERO are from premium topics
    const mockQuestions = await page.evaluate(() => {
      const raw = localStorage.getItem('ndeb_prep_active_mock');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.questions || [];
    });
    expect(mockQuestions.length).toBe(100);

    const premiumTopicIds = [
      'anatomy', 'pharmacology', 'endodontics', 'anesthesia', 'pathology',
      'prosthodontics', 'general-medicine', 'oral-medicine', 'implants',
      'emergencies', 'orthodontics', 'pedodontics', 'infection-control'
    ];
    const leaked = mockQuestions.filter((q: any) => premiumTopicIds.includes(q.topicId));
    expect(leaked.length).toBe(0);

    // Return to Topics
    await page.click('#quiz-back-button');
    await page.waitForSelector('.topic-card', { timeout: 10000 });

    // 11. Test Free User Search
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(600);
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('nerve');
    await page.waitForTimeout(800);

    await expect(page.locator('text=Subscribe to Pro to search')).toBeVisible();

    const renderedTopicBadges = await page.locator('.topic-badge').allTextContents();
    for (const badge of renderedTopicBadges) {
      expect(PREMIUM_TOPICS).not.toContain(badge.trim());
    }

    // 12. Test Dashboard for Free User
    await page.click('button:has-text("Dashboard")');
    await page.waitForTimeout(800);
    await expect(page.locator('button:has-text("Unlock Pro")')).toBeVisible();
    await expect(page.locator('h3:has-text("Flagged Questions")')).toBeVisible();
  });

  test('Part 2: Pro User Journey - Total Unlocking, Seamless Daily Review, & All 22 Topics', async ({ page }) => {
    // 1. Initialize user with Pro entitlement
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
      localStorage.setItem('ndeb_prep_is_premium', 'true');
      
      // Seed 2 due SRS reviews
      const now = Date.now();
      const srsData = {
        'operative-dentistry-1': { questionId: 'operative-dentistry-1', interval: 1, repetition: 1, efactor: 2.5, nextReviewDate: now - 60000 },
        'endodontics-1': { questionId: 'endodontics-1', interval: 1, repetition: 1, efactor: 2.5, nextReviewDate: now - 30000 }
      };
      localStorage.setItem('ndeb_prep_srs', JSON.stringify(srsData));

      // Seed 1 mistake
      localStorage.setItem('ndeb_prep_mistakes', JSON.stringify(['pharmacology-1']));
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // 2. Verify top upgrade banner is completely removed
    await expect(page.locator('text=Unlock Your Full Potential')).toHaveCount(0);
    await expect(page.locator('button:has-text("Upgrade to Pro")')).toHaveCount(0);

    // 3. Verify Daily Review banner: PRO badge removed, says questions due
    await expect(page.locator('[data-testid="srs-pro-badge"]')).toHaveCount(0);
    await expect(page.locator('text=questions due for review today')).toBeVisible();

    // 4. Verify Review Mistakes banner: PRO badge removed, says 1 incorrect answer
    await expect(page.locator('[data-testid="mistakes-pro-badge"]')).toHaveCount(0);
    await expect(page.locator('text=1 incorrect answer saved for review')).toBeVisible();

    // 5. Verify ALL 13 Premium topic lock badges are removed
    for (const name of PREMIUM_TOPICS) {
      const card = page.locator('.topic-card').filter({ has: page.locator('h3', { hasText: new RegExp(`^${name}$`) }) }).first();
      await expect(card.locator('.lock-badge')).toHaveCount(0);
    }

    // 6. Launch Daily Review as Pro -> opens directly without paywall
    await page.locator('h3:has-text("Daily Review (Spaced Repetition)")').click();
    await expect(page.locator('h2:has-text("Daily SRS Review")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);
    await page.click('#quiz-back-button');
    await page.waitForSelector('.topic-card', { timeout: 10000 });

    // 7. Launch Review Mistakes as Pro -> opens directly without paywall
    await page.locator('h3:has-text("Review Mistakes")').first().click();
    await expect(page.locator('h3:has-text("Review Mistakes")').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);
    // On mistakes list view, click Back
    await page.click('#mistakes-back-button');
    await page.waitForSelector('.topic-card', { timeout: 10000 });

    // 8. Open Premium Topic (Pharmacology) -> opens directly without paywall
    await page.locator('.topic-card').filter({ has: page.locator('h3', { hasText: /^Pharmacology$/ }) }).first().click();
    await expect(page.locator('h2:has-text("Pharmacology")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2:has-text("Unlock Pro")')).toHaveCount(0);
    await page.click('#quiz-back-button');
    await page.waitForSelector('.topic-card', { timeout: 10000 });

    // 9. Open Search as Pro -> uncapped, no paywall banner
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(600);
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('tooth');
    await page.waitForTimeout(800);
    await expect(page.locator('text=Subscribe to Pro to search')).toHaveCount(0);

    // 10. Dashboard as Pro -> clean view with no upsell button
    await page.click('button:has-text("Dashboard")');
    await page.waitForTimeout(600);
    await expect(page.locator('button:has-text("Unlock Pro")')).toHaveCount(0);
  });

  test('Part 3: Legal Modals & Dark Mode Toggle', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
    });
    await page.reload();
    await page.waitForSelector('.topic-card', { timeout: 15000 });

    // 1. Dark mode toggle
    const darkModeBtn = page.locator('button[aria-label*="dark mode" i], button[aria-label*="theme" i], button:has-text("🌙"), button:has-text("☀️"), nav button').last();
    await darkModeBtn.click();
    await page.waitForTimeout(300);

    // 2. Open Terms of Use modal
    await page.click('button:has-text("Terms of Use"), a:has-text("Terms of Use")');
    await expect(page.locator('h2:has-text("Terms of Use"), h3:has-text("Terms of Use")')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Close"), button[aria-label="Close"]');
    await page.waitForTimeout(300);

    // 3. Open Privacy Policy modal
    await page.click('button:has-text("Privacy Policy"), a:has-text("Privacy Policy")');
    await expect(page.locator('h2:has-text("Privacy Policy"), h3:has-text("Privacy Policy")')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Close"), button[aria-label="Close"]');
  });

});
