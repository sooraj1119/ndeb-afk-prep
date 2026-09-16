import fs from 'fs';

let strictSpec = fs.readFileSync('tests/strict-review-modes.spec.ts', 'utf8');

// Fix the race condition by evaluating localstorage and waiting explicitly
strictSpec = strictSpec.replace(
  /await page\.goto\('\/'\);\n    await page\.evaluate\(\(\) => \{\n      localStorage\.setItem\('ndeb_prep_flags', JSON\.stringify\(\[1, 2, 3, 'anatomy-1', 'pharmacology-2'\]\)\);\n      localStorage\.setItem\('ndeb_prep_mistakes', JSON\.stringify\(\[4, 5, 'pathology-3'\]\)\);\n    \}\);\n    await page\.reload\(\);/g,
  "await page.goto('/');\n    await page.waitForTimeout(1000);\n    await page.evaluate(() => {\n      localStorage.setItem('ndeb_prep_flags', JSON.stringify([1, 2, 3, 'anatomy-1', 'pharmacology-2']));\n      localStorage.setItem('ndeb_prep_mistakes', JSON.stringify([4, 5, 'pathology-3']));\n    });\n    await page.reload();"
);

fs.writeFileSync('tests/strict-review-modes.spec.ts', strictSpec);
console.log('Patched strict-review-modes.spec.ts');
