import fs from 'fs';

// Patch app.spec.ts
let appSpec = fs.readFileSync('tests/app.spec.ts', 'utf8');
appSpec = appSpec.replace(/await page\.waitForTimeout\(2000\); \/\/ Wait for JSON to load/g, "await page.waitForTimeout(5000); // Wait for JSON to load heavily");
fs.writeFileSync('tests/app.spec.ts', appSpec);

// Patch strict-review-modes.spec.ts
let strictSpec = fs.readFileSync('tests/strict-review-modes.spec.ts', 'utf8');
strictSpec = strictSpec.replace(/await page\.evaluate\(\(\) => \{\n      localStorage\.setItem\('ndeb_prep_flags', JSON\.stringify\(\[42, 'anatomy-1', 'anatomy-2'\]\)\);\n    \}\);/g, "await page.evaluate(() => {\n      localStorage.setItem('ndeb_prep_flags', JSON.stringify([42, 'anatomy-1', 'anatomy-2']));\n    });\n    await page.reload();");
fs.writeFileSync('tests/strict-review-modes.spec.ts', strictSpec);
console.log('Tests patched!');
