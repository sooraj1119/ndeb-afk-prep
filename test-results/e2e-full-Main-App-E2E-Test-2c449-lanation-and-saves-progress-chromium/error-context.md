# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-full.spec.ts >> Main App E2E Tests >> 4. Quiz Engine >> 4b. Selecting an answer shows explanation and saves progress
- Location: tests\e2e-full.spec.ts:77:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Tutor Explanation').or(locator('[data-testid="explanation"]'))
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('text=Tutor Explanation').or(locator('[data-testid="explanation"]'))

```

```yaml
- img
- img
- img
- img
- navigation:
  - img "NDEB AFK Prep Logo"
  - heading "NDEB AFK Prep Pro" [level=1]
  - button "PRO"
  - text: "1"
  - button "EN"
  - button
  - button "Study Topics"
  - button "Search"
  - button "Dashboard"
- main:
  - button "Back"
  - text: "Free Tier Preview: Viewing 100/494 questions."
  - button "Unlock All"
  - heading "Oral Surgery" [level=2]
  - button "Shuffle"
  - button "Flag"
  - text: 1 / 100
  - button "Listen to question"
  - heading "A 28-year-old healthy male presents for evaluation of a mesioangularly impacted mandibular third molar. Which of the following radiographic findings is most indicative of increased surgical difficulty and potential for nerve injury?" [level=3]
  - button "A Interruption of the cortical white line of the inferior alveolar canal." [disabled]
  - button "B A large follicular sac associated with the crown." [disabled]
  - button "C Presence of a single, fused root." [disabled]
  - button "D The degree of distal angulation." [disabled]
  - text: Correct!
  - button "Prev" [disabled]
  - button "Next"
  - paragraph: swipe left or press Enter for next
  - paragraph:
    - text: Found a mistake? Email our dental review board at
    - link "ndebpreppro@gmail.com":
      - /url: "mailto:ndebpreppro@gmail.com?subject=Question Error Report ID: 1"
- contentinfo:
  - text: NDEB AFK Prep Pro - Educational Tool
  - paragraph:
    - strong: "Medical Disclaimer:"
    - text: This application is strictly for educational and exam preparation purposes. It does not constitute medical advice, diagnosis, or treatment.
  - paragraph: Questions and explanations are simulated and AI-generated to mimic the style of the NDEB AFK exam. AI models may occasionally hallucinate or provide inaccurate information. Do not use this application for clinical decision-making or real-world patient care.
  - paragraph:
    - strong: "Trademark Notice:"
    - text: NDEB® and AFK® are registered trademarks of the National Dental Examining Board of Canada. This application is an independent study tool and is not affiliated with, endorsed by, or sponsored by the NDEB.
  - text: © 2026 NDEB AFK Prep Pro. All rights reserved.
- img
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('1. Medical Disclaimer Modal', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
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
> 82  |       await expect(page.locator('text=Tutor Explanation').or(page.locator('[data-testid="explanation"]'))).toBeVisible({ timeout: 8000 });
      |                                                                                                            ^ Error: expect(locator).toBeVisible() failed
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
  106 |       
  107 |       const flags = await page.evaluate(() => localStorage.getItem('ndeb_prep_flags'));
  108 |       expect(flags).toContain('oral-surgery-');
  109 |     });
  110 |   });
  111 | 
  112 |   // ============================================================
  113 |   // BLOCK 5: DARK MODE
  114 |   // ============================================================
  115 |   test('5a. Dark mode toggle adds dark class to html', async ({ page }) => {
  116 |     // Navigate to Search tab first so the navbar is definitely visible
  117 |     await page.click('text=Search');
  118 |     await page.waitForTimeout(500);
  119 |     // Execute a click using page.evaluate to bypass any overlay issues (like Google Translate)
  120 |     await page.evaluate(() => {
  121 |       const buttons = Array.from(document.querySelectorAll('nav button'));
  122 |       const toggle = buttons.find(b => b.innerHTML.includes('lucide-moon') || b.innerHTML.includes('lucide-sun'));
  123 |       if (toggle) (toggle as HTMLElement).click();
  124 |     });
  125 |     
  126 |     const htmlClass = await page.locator('html').getAttribute('class');
  127 |     expect(htmlClass).toContain('dark');
  128 |   });
  129 | 
  130 |   // ============================================================
  131 |   // BLOCK 6: DASHBOARD
  132 |   // ============================================================
  133 |   test.describe('6. Dashboard', () => {
  134 |     test.beforeEach(async ({ page }) => {
  135 |       await page.click('text=Dashboard');
  136 |       await page.waitForSelector('h2:has-text("Your Progress Dashboard")', { timeout: 8000 });
  137 |     });
  138 | 
  139 |     test('6a. Dashboard renders stat cards', async ({ page }) => {
  140 |       // Use more specific locator for the headings
  141 |       await expect(page.locator('div:has-text("Bank Completed")').first()).toBeVisible({ timeout: 5000 });
  142 |     });
  143 | 
  144 |     test('6b. Flagged Questions section is visible', async ({ page }) => {
  145 |       await expect(page.locator('h3:has-text("Review Flagged Questions")')).toBeVisible({ timeout: 5000 });
  146 |     });
  147 | 
  148 |     test('6c. Ghost ID flags (numeric IDs) are ignored in UI count', async ({ page }) => {
  149 |       // Inject ghost ID and valid ID
  150 |       await page.evaluate(() => {
  151 |         localStorage.setItem('ndeb_prep_flags', JSON.stringify([1, 2, 'oral-surgery-5']));
  152 |       });
  153 |       await page.reload();
  154 |       await page.click('text=Dashboard');
  155 |       await page.waitForTimeout(1000);
  156 |       
  157 |       // UI count should be 1, because 1 and 2 are numeric ghost IDs and are filtered out
  158 |       const text = await page.locator('h3:has-text("Review Flagged Questions")').locator('..').textContent();
  159 |       expect(text).toContain('1');
  160 |     });
  161 |   });
  162 | 
  163 |   // ============================================================
  164 |   // BLOCK 7: LOCALSTORAGE INTEGRITY
  165 |   // ============================================================
  166 |   test('7a. Empty or corrupt flags list does not crash Dashboard', async ({ page }) => {
  167 |     await page.evaluate(() => {
  168 |       localStorage.setItem('ndeb_prep_flags', 'not-a-valid-json');
  169 |     });
  170 |     await page.reload();
  171 |     await page.click('text=Dashboard');
  172 |     await expect(page.locator('h2:has-text("Your Progress Dashboard")')).toBeVisible({ timeout: 8000 });
  173 |   });
  174 | });
  175 | 
```