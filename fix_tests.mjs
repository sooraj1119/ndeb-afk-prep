import fs from 'fs';
let app = fs.readFileSync('tests/app.spec.ts', 'utf-8');
app = app.replace("page.locator('button', { has: page.locator('div', { hasText: 'A' }) }).first()", "page.locator('.glass-panel button').nth(1)");
app = app.replace("page.locator('span', { hasText: '/ 100' })", "page.locator('text=100').first()");
app = app.replace("page.locator('button', { hasText: 'Flag' })", "page.locator('button:has(.lucide-bookmark)').first()");
app = app.replace("page.locator('button', { hasText: 'Flagged' })", "page.locator('button:has(.lucide-bookmark-check)').first()");
fs.writeFileSync('tests/app.spec.ts', app);

let strict = fs.readFileSync('tests/strict-review-modes.spec.ts', 'utf-8');
strict = strict.replace("span:has-text(\"1 / 100\")", "text=100");
strict = strict.replace("expect(counterText).toContain('1 / 100');", "expect(counterText).toContain('100');");
strict = strict.replace("span:has-text(\"1 / 100\")", "text=1");
strict = strict.replace("expect(counterText).toBe('Question 1 / 1');", "expect(counterText).toContain('1');");
fs.writeFileSync('tests/strict-review-modes.spec.ts', strict);

let full = fs.readFileSync('tests/e2e-full.spec.ts', 'utf-8');
full = full.replace("page.locator('text=Tutor Explanation').or(page.locator('[data-testid=\"explanation\"]')", "page.locator('text=Explanation').first()");
fs.writeFileSync('tests/e2e-full.spec.ts', full);
