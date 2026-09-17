# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> NDEB AFK Prep E2E Tests >> User can flag a question and view it in Dashboard
- Location: tests\app.spec.ts:43:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('NDEB AFK Prep E2E Tests', () => {
  4  |   test.beforeEach(async ({ page }) => {
> 5  |     await page.goto('http://localhost:5173');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  6  |     await page.evaluate(() => localStorage.clear());
  7  |     await page.reload();
  8  |   });
  9  | 
  10 |   test('User must accept disclaimer before accessing the app', async ({ page }) => {
  11 |     await expect(page.locator('h2', { hasText: 'Medical Disclaimer' })).toBeVisible();
  12 |     await page.locator('button', { hasText: 'I Understand and Agree' }).click();
  13 |     await expect(page.locator('h3', { hasText: 'Operative Dentistry' })).toBeVisible();
  14 |   });
  15 | 
  16 |   test('Dark Mode toggle correctly updates the DOM and localStorage', async ({ page }) => {
  17 |     await page.locator('button', { hasText: 'I Understand and Agree' }).click();
  18 |     const toggleBtn = page.locator('button').filter({ has: page.locator('svg.lucide-moon, svg.lucide-sun') }).first();
  19 |     await toggleBtn.click();
  20 |     expect(await page.locator('html').getAttribute('class')).toContain('dark');
  21 |   });
  22 | 
  23 |   test('User can navigate to Practice, select a topic, and answer a question', async ({ page }) => {
  24 |     await page.locator('button', { hasText: 'I Understand and Agree' }).click();
  25 |     await page.waitForTimeout(5000); // Wait for JSON to load heavily
  26 |     await page.locator('h3', { hasText: 'Operative Dentistry' }).click();
  27 |     
  28 |     await page.waitForSelector('h3', { timeout: 10000 });
  29 |     await page.waitForTimeout(1000); // Wait for options to render
  30 |     
  31 |     await page.evaluate(() => {
  32 |         const buttons = Array.from(document.querySelectorAll('button'));
  33 |         const options = buttons.filter(b => b.textContent.length > 5 && !b.querySelector('svg'));
  34 |         if(options.length > 0) options[0].click();
  35 |     });
  36 | 
  37 |     await page.keyboard.press('Enter');
  38 |     
  39 |     const progressText = page.locator('span', { hasText: '/' }).first();
  40 |     await expect(progressText).toBeVisible({ timeout: 5000 });
  41 |   });
  42 |   
  43 |   test('User can flag a question and view it in Dashboard', async ({ page }) => {
  44 |     await page.locator('button', { hasText: 'I Understand and Agree' }).click();
  45 |     await page.waitForTimeout(5000); // Wait for JSON to load heavily
  46 |     await page.locator('h3', { hasText: 'Operative Dentistry' }).click();
  47 |     
  48 |     await page.waitForSelector('h3', { timeout: 10000 });
  49 |     await page.waitForTimeout(1000); // Wait for options to render
  50 |     
  51 |     await page.evaluate(() => {
  52 |         const buttons = Array.from(document.querySelectorAll('button'));
  53 |         const flagBtn = buttons.find(b => b.innerHTML.includes('lucide-bookmark') || b.textContent.includes('Flag'));
  54 |         if(flagBtn) flagBtn.click();
  55 |     });
  56 |     
  57 |     await page.waitForFunction(() => {
  58 |       const flags = localStorage.getItem('ndeb_prep_flags');
  59 |       return flags && JSON.parse(flags).length > 0;
  60 |     });
  61 |   });
  62 | });
  63 | 
```