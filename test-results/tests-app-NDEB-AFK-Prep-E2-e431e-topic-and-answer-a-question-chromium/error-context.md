# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\app.spec.ts >> NDEB AFK Prep E2E Tests >> User can navigate to Practice, select a topic, and answer a question
- Location: tests\app.spec.ts:48:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button').filter({ hasText: 'Next' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button').filter({ hasText: 'Next' })

```

```yaml
- navigation:
  - heading "NDEB Prep" [level=1]
  - button "Practice"
  - button "Search"
  - button "Dashboard"
  - text: "1"
  - button
- main:
  - button "Back"
  - heading "Anatomy" [level=2]
  - button "Flag"
  - text: 1 / 100
  - heading "Which cranial nerve provides motor innervation to the muscles of mastication?" [level=3]
  - button "Listen to question"
  - button "A CN V (Trigeminal)"
  - button "B CN VII (Facial)"
  - button "C CN IX (Glossopharyngeal)"
  - button "D CN XII (Hypoglossal)"
- contentinfo:
  - text: NDEB AFK Prep - Educational Tool
  - paragraph:
    - strong: "Medical Disclaimer:"
    - text: This application is strictly for educational and exam preparation purposes. It does not constitute medical advice, diagnosis, or treatment.
  - paragraph: Questions and explanations are simulated and AI-generated to mimic the style of the NDEB AFK exam. AI models may occasionally hallucinate or provide inaccurate information. Do not use this application for clinical decision-making or real-world patient care.
  - text: © 2026 NDEB Prep App. All rights reserved.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('NDEB AFK Prep E2E Tests', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Clear localStorage before each test to ensure a clean slate
  6   |     await page.goto('http://localhost:5173');
  7   |     await page.evaluate(() => localStorage.clear());
  8   |     await page.reload();
  9   |   });
  10  | 
  11  |   test('User must accept disclaimer before accessing the app', async ({ page }) => {
  12  |     // Check if disclaimer is visible
  13  |     const disclaimerHeading = page.locator('h2', { hasText: 'Medical Disclaimer' });
  14  |     await expect(disclaimerHeading).toBeVisible();
  15  | 
  16  |     // Accept disclaimer
  17  |     const acceptBtn = page.locator('button', { hasText: 'I Understand and Agree' });
  18  |     await acceptBtn.click();
  19  | 
  20  |     // Verify Dashboard or Practice tab is visible
  21  |     const prepHeading = page.locator('h1', { hasText: 'NDEB Prep' });
  22  |     await expect(prepHeading).toBeVisible();
  23  |     
  24  |     // Verify localStorage was updated
  25  |     const accepted = await page.evaluate(() => localStorage.getItem('ndeb_prep_disclaimer_accepted'));
  26  |     expect(accepted).toBe('true');
  27  |   });
  28  | 
  29  |   test('Dark Mode toggle correctly updates the DOM and localStorage', async ({ page }) => {
  30  |     // Accept disclaimer
  31  |     await page.locator('button', { hasText: 'I Understand and Agree' }).click();
  32  | 
  33  |     // Find the toggle button (it's the last button in the nav)
  34  |     const toggleBtn = page.locator('nav button').last();
  35  |     
  36  |     // Click toggle to enable Dark Mode
  37  |     await toggleBtn.click();
  38  | 
  39  |     // Verify HTML has 'dark' class
  40  |     const htmlClass = await page.locator('html').getAttribute('class');
  41  |     expect(htmlClass).toContain('dark');
  42  | 
  43  |     // Verify localStorage
  44  |     const theme = await page.evaluate(() => localStorage.getItem('theme'));
  45  |     expect(theme).toBe('dark');
  46  |   });
  47  | 
  48  |   test('User can navigate to Practice, select a topic, and answer a question', async ({ page }) => {
  49  |     // Accept disclaimer
  50  |     await page.locator('button', { hasText: 'I Understand and Agree' }).click();
  51  | 
  52  |     // Ensure we are on Practice tab
  53  |     const practiceTab = page.locator('button', { hasText: 'Practice' });
  54  |     await practiceTab.click();
  55  | 
  56  |     // Click on 'Anatomy' topic
  57  |     const anatomyCard = page.locator('h3', { hasText: 'Anatomy' });
  58  |     await anatomyCard.click();
  59  | 
  60  |     // Verify Quiz loaded (Wait for Question text)
  61  |     const nextBtn = page.locator('button', { hasText: 'Next' });
> 62  |     await expect(nextBtn).toBeVisible();
      |                           ^ Error: expect(locator).toBeVisible() failed
  63  | 
  64  |     // Click the first option
  65  |     const firstOption = page.locator('button', { has: page.locator('div', { hasText: 'A' }) }).first();
  66  |     await firstOption.click();
  67  | 
  68  |     // Next button should still be visible, let's click it to progress
  69  |     await nextBtn.click();
  70  | 
  71  |     // Verify we moved to question 2 (or completed if it was a 1 question quiz, but anatomy has 100)
  72  |     const progressText = page.locator('span', { hasText: '/ 100' }); // Assuming exactly 100 questions
  73  |     await expect(progressText).toBeVisible();
  74  |     
  75  |     // Verify progress saved to localStorage
  76  |     const progress = await page.evaluate(() => localStorage.getItem('ndeb_prep_progress'));
  77  |     expect(progress).not.toBeNull();
  78  |     const parsed = JSON.parse(progress || '{}');
  79  |     expect(parsed.anatomy).toBeDefined();
  80  |     expect(parsed.anatomy.currentIndex).toBeGreaterThan(0);
  81  |   });
  82  |   
  83  |   test('User can flag a question and view it in Dashboard', async ({ page }) => {
  84  |      // Accept disclaimer
  85  |     await page.locator('button', { hasText: 'I Understand and Agree' }).click();
  86  | 
  87  |     // Open Anatomy quiz
  88  |     await page.locator('h3', { hasText: 'Anatomy' }).click();
  89  |     
  90  |     // Flag the question
  91  |     const flagBtn = page.locator('button', { hasText: 'Flag' });
  92  |     await flagBtn.click();
  93  |     
  94  |     // Verify button text changed to Flagged
  95  |     await expect(page.locator('button', { hasText: 'Flagged' })).toBeVisible();
  96  |     
  97  |     // Check localStorage
  98  |     const flags = await page.evaluate(() => localStorage.getItem('ndeb_prep_flags'));
  99  |     expect(flags).not.toBeNull();
  100 |     const parsed = JSON.parse(flags || '[]');
  101 |     expect(parsed.length).toBe(1);
  102 |   });
  103 | });
  104 | 
```