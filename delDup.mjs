import fs from 'fs';
const file = './public/questions/microbiology.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const filtered = data.filter(q => q.id !== 919144626);
fs.writeFileSync(file, JSON.stringify(filtered, null, 2));
console.log("Deleted duplicate. New length:", filtered.length);