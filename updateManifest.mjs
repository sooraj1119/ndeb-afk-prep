import fs from 'fs';
import path from 'path';

const manifestPath = path.resolve('public/questions/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

for (const topic of manifest.topics) {
    if (topic.id === 'anatomy') {
        topic.count = 946;
        break;
    }
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log("Manifest updated!");
