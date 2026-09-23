import fs from 'fs';
import path from 'path';

const manifestPath = path.resolve('public/questions/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

for (let topic of manifest) {
    const filePath = path.resolve(`public/questions/${topic.id}.json`);
    if (fs.existsSync(filePath)) {
        const qList = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        topic.count = qList.length;
    }
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log("Dynamically updated all manifest counts to perfectly match the JSON files!");
