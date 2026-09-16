import fs from 'fs';
let f = fs.readFileSync('tests/e2e-full.spec.ts', 'utf-8');
f = f.replace("await expect(page.locator('h3:has-text(\"Oral Surgery\")').toBeVisible();", "await expect(page.locator('h3:has-text(\"Oral Surgery\")')).toBeVisible();");
f = f.replace("await expect(page.locator('h3:has-text(\"Pharmacology\")').toBeVisible();", "await expect(page.locator('h3:has-text(\"Pharmacology\")')).toBeVisible();");
fs.writeFileSync('tests/e2e-full.spec.ts', f);
