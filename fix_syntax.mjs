import fs from 'fs';
let f = fs.readFileSync('tests/e2e-full.spec.ts', 'utf-8');
f = f.replace("await expect(page.locator('h2:has-text(\"Medical Disclaimer\")').toBeVisible", "await expect(page.locator('h2:has-text(\"Medical Disclaimer\")')).toBeVisible");
fs.writeFileSync('tests/e2e-full.spec.ts', f);
