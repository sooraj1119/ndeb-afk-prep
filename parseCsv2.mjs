import fs from 'fs';
import path from 'path';

const csvPath = path.resolve('scratch/all_questions_export.csv'); 
if (fs.existsSync(csvPath)) {
    const lines = fs.readFileSync(csvPath, 'utf8').split('\n');
    const targetIds = ["96", "106", "206", "138", "141", "210", "635958304", "948685465", "298794317", "827162358", "747041513", "396254695"];
    
    console.log("Found in CSV:");
    for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 2) {
            const id = parts[1];
            if (targetIds.includes(id)) {
                console.log(`Topic: ${parts[0]} | ID: ${id}`);
                console.log(`Q: ${parts[2]}`);
                console.log(`Correct Answer: ${parts[7]}`);
                console.log(`Explanation: ${parts[8]}`);
                console.log("-----------------------");
            }
        }
    }
} else {
    console.log("CSV not found!");
}
