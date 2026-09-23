import fs from 'fs';
import path from 'path';

const manifestPath = path.resolve('public/questions/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

for (let topic of manifest) {
    if (topic.id === 'anatomy') {
        const anatomyPath = path.resolve('public/questions/anatomy.json');
        const qList = JSON.parse(fs.readFileSync(anatomyPath, 'utf8'));
        topic.count = qList.length;
    }
    if (topic.id === 'anesthesia') {
        const anesthesiaPath = path.resolve('public/questions/anesthesia.json');
        const qList = JSON.parse(fs.readFileSync(anesthesiaPath, 'utf8'));
        topic.count = qList.length;
    }
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log("Manifest successfully updated with true array counts!");
