# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-full.spec.ts >> Main App E2E Tests >> 5a. Dark mode toggle adds dark class to html
- Location: tests\e2e-full.spec.ts:115:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Matcher error: received value must not be null nor undefined

Received has value: null
```

# Page snapshot

```yaml
- generic [ref=f3e3]:
  - navigation [ref=f3e4]:
    - generic [ref=f3e5]:
      - generic [ref=f3e6] [cursor=pointer]:
        - img "NDEB AFK Prep Logo" [ref=f3e7]
        - heading "NDEB AFK Prep Pro" [level=1] [ref=f3e8]
      - generic [ref=f3e9]:
        - button "PRO" [ref=f3e10] [cursor=pointer]
        - generic [ref=f3e14]: "1"
        - button "EN" [ref=f3e18] [cursor=pointer]
        - button [ref=f3e19] [cursor=pointer]
    - generic [ref=f3e22]:
      - button "Study Topics" [ref=f3e23] [cursor=pointer]
      - button "Search" [active] [ref=f3e28] [cursor=pointer]
      - button "Dashboard" [ref=f3e33] [cursor=pointer]
  - main [ref=f3e40]:
    - generic [ref=f3e42]:
      - generic [ref=f3e43]:
        - generic [ref=f3e44]:
          - generic [ref=f3e45]: Unlock Your Full Potential
          - paragraph [ref=f3e50]:
            - text: Get instant access to all
            - strong [ref=f3e51]: 14,000 questions
            - text: ", detailed customized explanations, spaced repetition, and advanced analytics."
          - button "Upgrade to Pro" [ref=f3e52] [cursor=pointer]
        - heading "Select a Topic" [level=2] [ref=f3e55]
        - paragraph [ref=f3e56]: Master fundamental knowledge with detailed, customized explanations.
      - generic [ref=f3e57]:
        - generic [ref=f3e63]:
          - heading "Daily Review (Spaced Repetition)" [level=3] [ref=f3e64]
          - paragraph [ref=f3e65]: You're all caught up for today!
        - generic [ref=f3e71] [cursor=pointer]:
          - heading "Simulated Mock Exam" [level=3] [ref=f3e72]
          - paragraph [ref=f3e73]: 100 random questions | 2.0 hour timer
        - generic [ref=f3e82] [cursor=pointer]:
          - generic [ref=f3e83]:
            - heading "Review Mistakes" [level=3] [ref=f3e84]
            - generic [ref=f3e85]: PRO
          - paragraph [ref=f3e88]: 0 incorrect answers saved for review
      - generic [ref=f3e91]:
        - generic [ref=f3e92] [cursor=pointer]:
          - heading "Operative Dentistry" [level=3] [ref=f3e98]
          - generic [ref=f3e100]:
            - generic [ref=f3e104]: "1000"
            - text: Questions
        - generic [ref=f3e105] [cursor=pointer]:
          - heading "Biochemistry" [level=3] [ref=f3e112]
          - generic [ref=f3e114]:
            - generic [ref=f3e118]: "500"
            - text: Questions
        - generic [ref=f3e119] [cursor=pointer]:
          - heading "Microbiology" [level=3] [ref=f3e131]
          - generic [ref=f3e133]:
            - generic [ref=f3e137]: "500"
            - text: Questions
        - generic [ref=f3e138] [cursor=pointer]:
          - heading "Dental Materials" [level=3] [ref=f3e145]
          - generic [ref=f3e147]:
            - generic [ref=f3e151]: "500"
            - text: Questions
        - generic [ref=f3e152] [cursor=pointer]:
          - heading "Periodontology" [level=3] [ref=f3e160]
          - generic [ref=f3e162]:
            - generic [ref=f3e166]: "500"
            - text: Questions
        - generic [ref=f3e167] [cursor=pointer]:
          - heading "Oral Pathology" [level=3] [ref=f3e180]
          - generic [ref=f3e182]:
            - generic [ref=f3e186]: "1000"
            - text: Questions
        - generic [ref=f3e187] [cursor=pointer]:
          - heading "Radiology" [level=3] [ref=f3e193]
          - generic [ref=f3e195]:
            - generic [ref=f3e199]: "500"
            - text: Questions
        - generic [ref=f3e200] [cursor=pointer]:
          - heading "Ethics" [level=3] [ref=f3e208]
          - generic [ref=f3e210]:
            - generic [ref=f3e214]: "500"
            - text: Questions
        - generic [ref=f3e215] [cursor=pointer]:
          - heading "Oral Surgery" [level=3] [ref=f3e224]
          - generic [ref=f3e226]:
            - generic [ref=f3e230]: "500"
            - text: Questions
        - generic [ref=f3e231] [cursor=pointer]:
          - generic [ref=f3e232]: PRO
          - heading "Anatomy" [level=3] [ref=f3e240]
          - generic [ref=f3e242]:
            - generic [ref=f3e246]: "1000"
            - text: Questions
        - generic [ref=f3e247] [cursor=pointer]:
          - generic [ref=f3e248]: PRO
          - heading "Pharmacology" [level=3] [ref=f3e256]
          - generic [ref=f3e258]:
            - generic [ref=f3e262]: "1000"
            - text: Questions
        - generic [ref=f3e263] [cursor=pointer]:
          - generic [ref=f3e264]: PRO
          - heading "Endodontics" [level=3] [ref=f3e272]
          - generic [ref=f3e274]:
            - generic [ref=f3e278]: "500"
            - text: Questions
        - generic [ref=f3e279] [cursor=pointer]:
          - generic [ref=f3e280]: PRO
          - heading "Anesthesia" [level=3] [ref=f3e293]
          - generic [ref=f3e295]:
            - generic [ref=f3e299]: "1000"
            - text: Questions
        - generic [ref=f3e300] [cursor=pointer]:
          - generic [ref=f3e301]: PRO
          - heading "Pathology" [level=3] [ref=f3e311]
          - generic [ref=f3e313]:
            - generic [ref=f3e317]: "500"
            - text: Questions
        - generic [ref=f3e318] [cursor=pointer]:
          - generic [ref=f3e319]: PRO
          - heading "Prosthodontics" [level=3] [ref=f3e334]
          - generic [ref=f3e336]:
            - generic [ref=f3e340]: "1000"
            - text: Questions
        - generic [ref=f3e341] [cursor=pointer]:
          - generic [ref=f3e342]: PRO
          - heading "General Medicine" [level=3] [ref=f3e355]
          - generic [ref=f3e357]:
            - generic [ref=f3e361]: "500"
            - text: Questions
        - generic [ref=f3e362] [cursor=pointer]:
          - generic [ref=f3e363]: PRO
          - heading "Oral Medicine" [level=3] [ref=f3e373]
          - generic [ref=f3e375]:
            - generic [ref=f3e379]: "500"
            - text: Questions
        - generic [ref=f3e380] [cursor=pointer]:
          - generic [ref=f3e381]: PRO
          - heading "Implants" [level=3] [ref=f3e389]
          - generic [ref=f3e391]:
            - generic [ref=f3e395]: "500"
            - text: Questions
        - generic [ref=f3e396] [cursor=pointer]:
          - generic [ref=f3e397]: PRO
          - heading "Dental & Medical Emergencies" [level=3] [ref=f3e405]
          - generic [ref=f3e407]:
            - generic [ref=f3e411]: "500"
            - text: Questions
        - generic [ref=f3e412] [cursor=pointer]:
          - generic [ref=f3e413]: PRO
          - heading "Orthodontics" [level=3] [ref=f3e422]
          - generic [ref=f3e424]:
            - generic [ref=f3e428]: "500"
            - text: Questions
        - generic [ref=f3e429] [cursor=pointer]:
          - generic [ref=f3e430]: PRO
          - heading "Pedodontics" [level=3] [ref=f3e439]
          - generic [ref=f3e441]:
            - generic [ref=f3e445]: "500"
            - text: Questions
        - generic [ref=f3e446] [cursor=pointer]:
          - generic [ref=f3e447]: PRO
          - heading "Prevention & Infection Control" [level=3] [ref=f3e456]
          - generic [ref=f3e458]:
            - generic [ref=f3e462]: "500"
            - text: Questions
  - contentinfo [ref=f3e463]:
    - generic [ref=f3e464]:
      - generic [ref=f3e465]: NDEB AFK Prep Pro - Educational Tool
      - paragraph [ref=f3e469]:
        - strong [ref=f3e470]: "Medical Disclaimer:"
        - text: This application is strictly for educational and exam preparation purposes. It does not constitute medical advice, diagnosis, or treatment.
      - paragraph [ref=f3e471]: Questions and explanations are simulated and AI-generated to mimic the style of the NDEB AFK exam. AI models may occasionally hallucinate or provide inaccurate information. Do not use this application for clinical decision-making or real-world patient care.
      - paragraph [ref=f3e472]:
        - strong [ref=f3e473]: "Trademark Notice:"
        - text: NDEB® and AFK® are registered trademarks of the National Dental Examining Board of Canada. This application is an independent study tool and is not affiliated with, endorsed by, or sponsored by the NDEB.
      - generic [ref=f3e474]: © 2026 NDEB AFK Prep Pro. All rights reserved.
```

# Test source

```ts
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
> 127 |     expect(htmlClass).toContain('dark');
      |                       ^ Error: expect(received).toContain(expected) // indexOf
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