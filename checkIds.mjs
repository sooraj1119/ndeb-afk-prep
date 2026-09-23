import fs from 'fs';
import path from 'path';

const targetIds = [
  "712673317", "891158485", "527921325", "149863299", "735767533", "605672127", "830648702", "697834305", "162258445", "898205538", "731435354", "339731577", "601615015", "837141278", "427189835", "19691111", "296303972", "645651181", "387045230", "145720100", "194076548", "613251709", "270099821", "278559189", "104688080",
  "10514284", "165402776", "698997870", "348146665", "561548017", "260345115", "850955480", "616140640", "599233342", "79893134", "99267144", "967497448",
  "460466448", "44703788", "991464804", "249051928", "41405912", "18605395", "768357785", "801210412", "891156813", "84860277", "213056444", "980943098", "194158536", "644050217", "51836117", "10837074", "424548753"
];

const questionsDir = path.resolve('public/questions');
const files = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const found = [];

for (const file of files) {
    const rawData = fs.readFileSync(path.join(questionsDir, file), 'utf8');
    let qList;
    try {
        qList = JSON.parse(rawData);
    } catch (e) {
        continue;
    }
    
    for (const q of qList) {
        if (targetIds.includes(String(q.id))) {
            found.push({ file, id: q.id });
        }
    }
}

console.log(`Found ${found.length} out of ${targetIds.length} target IDs in the database.`);
const breakdown = {};
found.forEach(item => {
    breakdown[item.file] = (breakdown[item.file] || 0) + 1;
});
console.log(breakdown);
