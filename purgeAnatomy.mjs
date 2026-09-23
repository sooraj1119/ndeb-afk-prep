import fs from 'fs';
import path from 'path';

const targetIds = [
  "712673317", "891158485", "527921325", "149863299", "735767533", "605672127", "830648702", "697834305", "162258445", "898205538", "731435354", "339731577", "601615015", "837141278", "427189835", "19691111", "296303972", "645651181", "387045230", "145720100", "194076548", "613251709", "270099821", "278559189", "104688080",
  "10514284", "165402776", "698997870", "348146665", "561548017", "260345115", "850955480", "616140640", "599233342", "79893134", "99267144", "967497448",
  "460466448", "44703788", "991464804", "249051928", "41405912", "18605395", "768357785", "801210412", "891156813", "84860277", "213056444", "980943098", "194158536", "644050217", "51836117", "10837074", "424548753"
];

const anatomyPath = path.resolve('public/questions/anatomy.json');
const rawData = fs.readFileSync(anatomyPath, 'utf8');
const questions = JSON.parse(rawData);

const originalLength = questions.length;
const cleanedQuestions = questions.filter(q => !targetIds.includes(String(q.id)));
const removedCount = originalLength - cleanedQuestions.length;

fs.writeFileSync(anatomyPath, JSON.stringify(cleanedQuestions, null, 2));

console.log(`Original count: ${originalLength}`);
console.log(`Cleaned count: ${cleanedQuestions.length}`);
console.log(`Successfully purged ${removedCount} hallucinated anatomy questions!`);
