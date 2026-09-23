import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('public/questions/biochemistry.json');
const rawData = fs.readFileSync(dbPath, 'utf8');
const questions = JSON.parse(rawData);

let fixedCount = 0;

for (const q of questions) {
    if (String(q.id) === "40") {
        q.question = "Which of the following hormones primarily acts to lower blood calcium levels by directly inhibiting osteoclast activity?";
        q.options = ["Parathyroid hormone (PTH)", "Cortisol", "Calcitonin", "Calcitriol (active Vitamin D)"];
        q.correctAnswer = 2;
        q.explanation = "Calcitonin, secreted by the parafollicular cells (C cells) of the thyroid gland, acts to lower blood calcium levels primarily by directly inhibiting osteoclast activity. It does not primarily drive bone matrix synthesis. PTH and calcitriol generally act to raise blood calcium.";
        fixedCount++;
    }
    else if (String(q.id) === "111") {
        q.question = "A researcher is studying metabolic pathways in the human liver after a carbohydrate-rich meal. Which of the following allosteric effectors is the most potent activator of phosphofructokinase-1 (PFK-1), the rate-limiting step of glycolysis, under these conditions?";
        q.options = ["Glucose-6-phosphate", "ATP", "Citrate", "Fructose-2,6-bisphosphate"];
        q.correctAnswer = 3;
        q.explanation = "In the liver, Fructose-2,6-bisphosphate is the most potent allosteric activator of PFK-1, overriding the inhibitory effects of high ATP. Note: In skeletal muscle during intense exercise, AMP is the primary activator, but this question specifically addresses hepatic regulation.";
        fixedCount++;
    }
}

fs.writeFileSync(dbPath, JSON.stringify(questions, null, 2));
console.log(`Successfully fixed ${fixedCount} more biochemistry questions!`);
