import fs from 'fs';

let appSpec = fs.readFileSync('tests/app.spec.ts', 'utf8');
appSpec = appSpec.replace(/hasText: 'Anatomy'/g, "hasText: 'Operative Dentistry'");
fs.writeFileSync('tests/app.spec.ts', appSpec);

console.log('Patched app.spec.ts for non-premium clicking!');
