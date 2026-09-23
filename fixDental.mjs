import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('public/questions/dental-materials.json');
const rawData = fs.readFileSync(dbPath, 'utf8');
const questions = JSON.parse(rawData);

let fixedCount = 0;

for (const q of questions) {
    if (String(q.id) === "275") {
        q.question = "During the manipulation of a fast-setting gypsum product, a dental assistant notes that the mix is setting much too rapidly, hindering proper placement in the impression. Which of the following factors is the MOST likely cause of this acceleration?";
        q.options = ["Addition of potassium sulfate", "Addition of borax", "Increased water-to-powder ratio", "Decreased water temperature"];
        q.correctAnswer = 0;
        q.explanation = "Potassium sulfate acts as a potent chemical accelerator for gypsum products, significantly decreasing setting time. Borax is a classic chemical retarder. An increased water-to-powder ratio (a thinner mix) and a decreased water temperature will both increase (lengthen) the setting time, making them retarders.";
        fixedCount++;
    }
    else if (String(q.id) === "301") {
        q.question = "Which of the following precious metal alloys is classified by the ADA (American Dental Association) as a 'High Noble' alloy?";
        q.options = ["45% Gold, 20% Palladium, 35% Copper", "30% Gold, 40% Palladium, 30% Silver", "50% Gold, 5% Palladium, 45% Copper", "10% Gold, 15% Platinum, 75% Nickel"];
        q.correctAnswer = 0;
        q.explanation = "According to ADA specifications, a 'High Noble' alloy must contain a minimum of 60% total noble metal content (Gold + Platinum + Palladium) AND at least 40% must be Gold. Option 0 has 65% total noble metal and 45% gold. Option 1 has >60% noble but fails the 40% gold rule. Option 2 has only 55% total noble metal.";
        fixedCount++;
    }
    else if (String(q.id) === "405") {
        q.question = "According to ADA specifications for dental casting alloys, which of the following compositions perfectly meets the minimum threshold to be classified as a 'High Noble' alloy?";
        q.options = ["60% Palladium, 10% Gold, 30% Silver", "50% Gold, 5% Palladium, 45% Base Metal", "40% Gold, 20% Platinum, 40% Copper", "35% Gold, 30% Platinum, 35% Base Metal"];
        q.correctAnswer = 2;
        q.explanation = "A 'High Noble' alloy must contain >= 60% noble metal content (Au, Pt, Pd) AND >= 40% Gold. Option 2 (40% Au + 20% Pt = 60% total noble, and exactly 40% Au) meets the exact minimum thresholds. Option 0 fails the gold rule. Option 1 fails the total noble rule (55%). Option 3 has 65% noble but fails the gold rule (only 35%).";
        fixedCount++;
    }
}

fs.writeFileSync(dbPath, JSON.stringify(questions, null, 2));
console.log(`Successfully fixed ${fixedCount} dental materials questions!`);
