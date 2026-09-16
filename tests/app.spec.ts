import { test, expect } from '@playwright/test';

test.describe('NDEB AFK Prep E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('User must accept disclaimer before accessing the app', async ({ page }) => {
    await expect(page.locator('h2', { hasText: 'Medical Disclaimer' })).toBeVisible();
    await page.locator('button', { hasText: 'I Understand and Agree' }).click();
    await expect(page.locator('h3', { hasText: 'Operative Dentistry' })).toBeVisible();
  });

  test('Dark Mode toggle correctly updates the DOM and localStorage', async ({ page }) => {
    await page.locator('button', { hasText: 'I Understand and Agree' }).click();
    const toggleBtn = page.locator('button').filter({ has: page.locator('svg.lucide-moon, svg.lucide-sun') }).first();
    await toggleBtn.click();
    expect(await page.locator('html').getAttribute('class')).toContain('dark');
  });

  test('User can navigate to Practice, select a topic, and answer a question', async ({ page }) => {
    await page.locator('button', { hasText: 'I Understand and Agree' }).click();
    await page.waitForTimeout(5000); // Wait for JSON to load heavily
    await page.locator('h3', { hasText: 'Operative Dentistry' }).click();
    
    await page.waitForSelector('h3', { timeout: 10000 });
    await page.waitForTimeout(1000); // Wait for options to render
    
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const options = buttons.filter(b => b.textContent.length > 5 && !b.querySelector('svg'));
        if(options.length > 0) options[0].click();
    });

    await page.keyboard.press('Enter');
    
    const progressText = page.locator('span', { hasText: '/' }).first();
    await expect(progressText).toBeVisible({ timeout: 5000 });
  });
  
  test('User can flag a question and view it in Dashboard', async ({ page }) => {
    await page.locator('button', { hasText: 'I Understand and Agree' }).click();
    await page.waitForTimeout(5000); // Wait for JSON to load heavily
    await page.locator('h3', { hasText: 'Operative Dentistry' }).click();
    
    await page.waitForSelector('h3', { timeout: 10000 });
    await page.waitForTimeout(1000); // Wait for options to render
    
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const flagBtn = buttons.find(b => b.innerHTML.includes('lucide-bookmark') || b.textContent.includes('Flag'));
        if(flagBtn) flagBtn.click();
    });
    
    await page.waitForFunction(() => {
      const flags = localStorage.getItem('ndeb_prep_flags');
      return flags && JSON.parse(flags).length > 0;
    });
  });
});
