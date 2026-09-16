import fs from 'fs';
let content = fs.readFileSync('tests/e2e-full.spec.ts', 'utf-8');
const lines = content.split('\n');
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('await expect(') && lines[i].includes('.toBeVisible')) {
    const beforeVisible = lines[i].split('.toBeVisible')[0];
    const openParens = (beforeVisible.match(/\(/g) || []).length;
    const closeParens = (beforeVisible.match(/\)/g) || []).length;
    if (openParens > closeParens) {
       lines[i] = lines[i].replace('.toBeVisible', ').toBeVisible');
    }
  }
}
fs.writeFileSync('tests/e2e-full.spec.ts', lines.join('\n'));
