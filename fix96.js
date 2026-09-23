const fs = require('fs');
const path = require('path');

const filePath = path.resolve('public/questions/anatomy.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const questions = JSON.parse(rawData);

for (const q of questions) {
    if (q.id === 96) {
        q.correctAnswer = 3;
        q.explanation = "General sensation to the anterior two-thirds of the tongue is supplied by the lingual nerve (V3), while taste is supplied by the chorda tympani (VII). The chorda tympani joins the lingual nerve in the infratemporal fossa. If the lingual nerve is damaged PROXIMAL to this junction, only general sensation is lost, as the taste fibers join the nerve further downstream. If the damage was DISTAL to the junction, the patient would lose BOTH general sensation and taste because the fibers travel together from the junction to the tongue.";
        break;
    }
}

fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
console.log("Fixed Anatomy ID 96!");
