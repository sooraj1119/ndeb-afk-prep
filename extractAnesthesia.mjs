import fs from 'fs';
import path from 'path';

const targetIds = [
  "712673317", "891158485", "527921325", "149863299", "735767533", "605672127", "830648702", "697834305", "162258445", "898205538", "731435354", "339731577", "601615015", "837141278", "427189835", "19691111", "296303972", "645651181", "387045230", "145720100", "194076548", "613251709", "270099821", "278559189", "104688080",
  "31", "77", "90", "137", "267", "124", "261", "325", "114", "222412820", "298548822",
  "30", "222", "313", "26", "65", "200", "255", "216", "240", "283", "332", "78", "288", "674142890", "338162163", "944059710", "254379682",
  "57", "88", "279", "187", "172", "176", "100", "322", "1", "269", "138", "89", "188", "27", "337", "3", "40", "154", "321", "74237598", "352874375", "453221541", "722002341", "122195801", "107010739", "109127117", "148", "276", "343",
  "33", "49", "349", "91", "97", "98126761", "623169638", "933315272", "558843357", "822196696", "719277676"
];

const anesthesiaPath = path.resolve('public/questions/anesthesia.json');
const rawData = fs.readFileSync(anesthesiaPath, 'utf8');
let qList = JSON.parse(rawData);
    
const found = qList.filter(q => targetIds.includes(String(q.id)));

let output = "# Anesthesia Audit Dump\n\n";
for (const q of found) {
    output += `### ID: ${q.id}\n`;
    output += `**Q:** ${q.question}\n`;
    q.options.forEach((opt, idx) => {
        const isCorrect = idx === q.correctAnswer ? "[CORRECT]" : "         ";
        output += `- ${isCorrect} ${idx}: ${opt}\n`;
    });
    output += `\n**Exp:** ${q.explanation}\n\n---\n\n`;
}

fs.writeFileSync(path.resolve('scratch/anesthesia_audit.md'), output);
console.log(`Extracted ${found.length} questions to scratch/anesthesia_audit.md`);
