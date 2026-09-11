# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\strict-review-modes.spec.ts >> Strict Verification of Review Modes >> Daily Review (SRS) should load valid questions without NaN crashes
- Location: tests\strict-review-modes.spec.ts:57:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Strict Verification of Review Modes', () => {
  4  | 
  5  |   test('Dashboard should auto-purge ghost IDs and count only valid string IDs', async ({ page }) => {
  6  |     await page.goto('/');
  7  |     
  8  |     // Inject mixed data: 3 ghost IDs (numbers), 2 valid string IDs
  9  |     await page.evaluate(() => {
  10 |       localStorage.setItem('ndeb_prep_flags', JSON.stringify([1, 2, 3, 'anatomy-1', 'pharmacology-2']));
  11 |       localStorage.setItem('ndeb_prep_mistakes', JSON.stringify([4, 5, 'pathology-3']));
  12 |       
  13 |       const srsData = {
  14 |         '1': { nextReviewDate: 0, interval: 1, repetition: 1, efactor: 2.5 },
  15 |         '2': { nextReviewDate: 0, interval: 1, repetition: 1, efactor: 2.5 },
  16 |         'anatomy-2': { nextReviewDate: 0, interval: 1, repetition: 1, efactor: 2.5 }
  17 |       };
  18 |       localStorage.setItem('ndeb_prep_srs', JSON.stringify(srsData));
  19 |     });
  20 | 
  21 |     // Refresh to apply state
  22 |     await page.reload();
  23 | 
  24 |     // Check Flagged count text
  25 |     const flaggedText = await page.locator('text=Review Flagged Questions').locator('..').textContent();
  26 |     expect(flaggedText).toContain('2'); // Valid flags: anatomy-1, pharmacology-2
  27 |     
  28 |     // Check Mistakes count text
  29 |     const mistakesText = await page.locator('text=Weakness Drilling').locator('..').textContent();
  30 |     expect(mistakesText).toContain('1'); // Valid mistakes: pathology-3
  31 |   });
  32 | 
  33 |   test('Flagged Review should strictly enforce the 100-question limit for non-pro users', async ({ page }) => {
  34 |     await page.goto('/');
  35 |     
  36 |     // Inject 150 valid flagged questions
  37 |     await page.evaluate(() => {
  38 |       const dummyFlags = Array.from({length: 150}, (_, i) => "anatomy-" + (i+1));
  39 |       localStorage.setItem('ndeb_prep_flags', JSON.stringify(dummyFlags));
  40 |       // Force non-pro state
  41 |       localStorage.removeItem('ndeb_prep_pro');
  42 |     });
  43 | 
  44 |     await page.reload();
  45 | 
  46 |     // Click Start Review on Flagged Questions
  47 |     await page.click('button:has-text("Start Review")');
  48 | 
  49 |     // Wait for the Quiz to load
  50 |     await page.waitForSelector('text=Flagged Review');
  51 | 
  52 |     // Verify the question counter says 1 / 100
  53 |     const counterText = await page.locator('.flex.justify-between.items-center.mb-6 >> span').first().textContent();
  54 |     expect(counterText).toBe('Question 1 / 100');
  55 |   });
  56 | 
  57 |   test('Daily Review (SRS) should load valid questions without NaN crashes', async ({ page }) => {
> 58 |     await page.goto('/');
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  59 |     
  60 |     // Inject valid SRS data
  61 |     await page.evaluate(() => {
  62 |       const srsData = {
  63 |         'anatomy-10': { nextReviewDate: 0, interval: 1, repetition: 1, efactor: 2.5 },
  64 |         'anatomy-11': { nextReviewDate: Date.now() + 100000, interval: 1, repetition: 1, efactor: 2.5 }, // Not due
  65 |       };
  66 |       localStorage.setItem('ndeb_prep_srs', JSON.stringify(srsData));
  67 |     });
  68 | 
  69 |     await page.reload();
  70 | 
  71 |     // Navigate to Study Topics -> SRS Review
  72 |     await page.click('text=Study Topics');
  73 |     
  74 |     // Find the Daily Review Start button
  75 |     const srsButton = page.locator('button:has-text("Start Daily Review")');
  76 |     if (await srsButton.isVisible()) {
  77 |         await srsButton.click();
  78 |         
  79 |         // Wait for Quiz to load
  80 |         await page.waitForSelector('text=Daily SRS Review');
  81 |         
  82 |         // Verify only 1 question loaded
  83 |         const counterText = await page.locator('.flex.justify-between.items-center.mb-6 >> span').first().textContent();
  84 |         expect(counterText).toBe('Question 1 / 1');
  85 |     }
  86 |   });
  87 | 
  88 | });
  89 | 
```