# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-full.spec.ts >> 1. Medical Disclaimer Modal >> 1b. Accepting disclaimer hides modal and saves state
- Location: tests\e2e-full.spec.ts:14:3

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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('1. Medical Disclaimer Modal', () => {
  4   |   test.beforeEach(async ({ page }) => {
> 5   |     await page.goto('/');
      |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  6   |     await page.evaluate(() => localStorage.clear());
  7   |     await page.reload();
  8   |   });
  9   | 
  10  |   test('1a. Modal is shown on first launch', async ({ page }) => {
  11  |     await expect(page.locator('h2:has-text("Medical Disclaimer")')).toBeVisible({ timeout: 8000 });
  12  |   });
  13  | 
  14  |   test('1b. Accepting disclaimer hides modal and saves state', async ({ page }) => {
  15  |     await page.locator('button:has-text("I Understand and Agree")').click();
  16  |     await expect(page.locator('h2:has-text("Medical Disclaimer")')).toBeHidden();
  17  |     
  18  |     // Verify state
  19  |     const val = await page.evaluate(() => localStorage.getItem('ndeb_prep_disclaimer_accepted'));
  20  |     expect(val).toBe('true');
  21  |   });
  22  | });
  23  | 
  24  | test.describe('Main App E2E Tests', () => {
  25  |   test.beforeEach(async ({ page }) => {
  26  |     await page.goto('/');
  27  |     await page.evaluate(() => {
  28  |       localStorage.clear();
  29  |       localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
  30  |     });
  31  |     await page.reload();
  32  |     await page.waitForSelector('h3:has-text("Oral Surgery")', { timeout: 10000 });
  33  |   });
  34  | 
  35  |   // ============================================================
  36  |   // BLOCK 2: NAVIGATION
  37  |   // ============================================================
  38  |   test('2a. Study Topics tab loads topic cards', async ({ page }) => {
  39  |     await expect(page.locator('h3:has-text("Oral Surgery")')).toBeVisible();
  40  |     await expect(page.locator('h3:has-text("Pharmacology")')).toBeVisible();
  41  |   });
  42  | 
  43  |   test('2b. Dashboard tab is clickable and renders', async ({ page }) => {
  44  |     await page.click('text=Dashboard');
  45  |     await expect(page.locator('h2:has-text("Your Progress Dashboard")')).toBeVisible({ timeout: 8000 });
  46  |   });
  47  | 
  48  |   test('2c. Search tab is clickable and renders', async ({ page }) => {
  49  |     await page.click('text=Search');
  50  |     await expect(page.locator('input[placeholder*="Search"]')).toBeVisible({ timeout: 8000 });
  51  |   });
  52  | 
  53  |   // ============================================================
  54  |   // BLOCK 3: TOPIC SELECTION
  55  |   // ============================================================
  56  |   test('3a. Clicking Oral Surgery starts the quiz', async ({ page }) => {
  57  |     await page.locator('h3:has-text("Oral Surgery")').click();
  58  |     await expect(page.locator('h2:has-text("Oral Surgery")')).toBeVisible({ timeout: 15000 });
  59  |   });
  60  | 
  61  |   // ============================================================
  62  |   // BLOCK 4: QUIZ ENGINE
  63  |   // ============================================================
  64  |   test.describe('4. Quiz Engine', () => {
  65  |     test.beforeEach(async ({ page }) => {
  66  |       await page.locator('h3:has-text("Oral Surgery")').click();
  67  |       await page.waitForSelector('h2:has-text("Oral Surgery")', { timeout: 15000 });
  68  |       // Wait for options to render
  69  |       await page.waitForSelector('button:has(span[translate="no"])', { timeout: 15000 });
  70  |     });
  71  | 
  72  |     test('4a. First question renders with 4 answer options', async ({ page }) => {
  73  |       const optionCount = await page.locator('button:has(span[translate="no"])').count();
  74  |       expect(optionCount).toBeGreaterThanOrEqual(4);
  75  |     });
  76  | 
  77  |     test('4b. Selecting an answer shows explanation and saves progress', async ({ page }) => {
  78  |       // Click first option
  79  |       await page.locator('button:has(span[translate="no"])').first().click();
  80  |       
  81  |       // Explanation should appear
  82  |       await expect(page.locator('text=Explanation').first()).toBeVisible({ timeout: 8000 });
  83  |       
  84  |       // Check progress saved
  85  |       const progress = await page.evaluate(() => localStorage.getItem('ndeb_prep_progress'));
  86  |       expect(progress).not.toBeNull();
  87  |     });
  88  | 
  89  |     test('4c. Next button advances to next question', async ({ page }) => {
  90  |       await page.locator('button:has(span[translate="no"])').first().click();
  91  |       await page.waitForTimeout(500); // Wait for transition/animation
  92  |       
  93  |       const nextBtn = page.locator('button:has-text("Next")');
  94  |       if (await nextBtn.isVisible()) {
  95  |         await nextBtn.click();
  96  |       } else {
  97  |         await page.keyboard.press('ArrowRight');
  98  |       }
  99  |       
  100 |       await expect(page.locator('span').filter({ hasText: '2 /' })).toBeVisible({ timeout: 8000 });
  101 |     });
  102 | 
  103 |     test('4d. Flagging a question works', async ({ page }) => {
  104 |       await page.locator('button:has-text("Flag")').click();
  105 |       await expect(page.locator('button:has-text("Flagged")')).toBeVisible();
```