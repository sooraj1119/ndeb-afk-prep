const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve('public/questions/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const allQuestions = [];
let dupCount = 0;

manifest.forEach(topic => {
  const filePath = path.resolve(\public/questions/\.json\);
  if (!fs.existsSync(filePath)) return;
  const qList = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  qList.forEach(q => {
    allQuestions.push({ file: topic.id, q });
  });
});

console.log(\Checking \ total questions...\);

const seen = new Map();
const toRemove = [];

allQuestions.forEach(({ file, q }) => {
  // Normalize fingerprint
  const fp = q.question.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 100);
  if (seen.has(fp)) {
    console.log(\Duplicate found: [\] matches [\]\);
    console.log(\Q: \...\);
    dupCount++;
    toRemove.push({ file, id: q.id });
  } else {
    seen.set(fp, file);
  }
});

console.log(\Found \ duplicates.\);

if (dupCount > 0) {
  console.log("Removing duplicates...");
  const byFile = {};
  toRemove.forEach(r => {
    if (!byFile[r.file]) byFile[r.file] = [];
    byFile[r.file].push(r.id);
  });
  
  Object.keys(byFile).forEach(file => {
    const filePath = path.resolve(\public/questions/\.json\);
    let qList = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const before = qList.length;
    qList = qList.filter(q => !byFile[file].includes(q.id));
    fs.writeFileSync(filePath, JSON.stringify(qList, null, 2));
    
    // Update manifest
    const mItem = manifest.find(m => m.id === file);
    if (mItem) {
      mItem.count = qList.length;
      console.log(\[\] Cleaned \ dups. New count: \\);
    }
  });
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}
