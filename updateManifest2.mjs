import fs from 'fs';
import path from 'path';

const manifestPath = path.resolve('public/questions/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (manifest.anatomy) {
    manifest.anatomy = 946;
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log("Manifest updated!");
