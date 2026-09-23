import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('public/questions/biochemistry.json');
const rawData = fs.readFileSync(dbPath, 'utf8');
const questions = JSON.parse(rawData);

let fixedCount = 0;

for (const q of questions) {
    if (String(q.id) === "39") {
        q.options[0] = "Decreased renal reabsorption of bicarbonate ions.";
        q.explanation = "In metabolic acidosis, the body attempts to excrete excess acid. The kidneys respond by increasing the secretion of hydrogen ions (H+) into the urine and increasing the reabsorption of bicarbonate ions. Option 2 correctly identifies increased H+ secretion. A decreased respiratory rate would worsen acidosis.";
        fixedCount++;
    }
    else if (String(q.id) === "133") {
        q.question = "Which of the following amino acids are classified as strictly ketogenic in human metabolism, meaning their carbon skeletons are degraded exclusively to acetyl-CoA or acetoacetate?";
        q.options = ["Glutamine and Aspartate", "Leucine and Lysine", "Alanine and Glycine", "Valine and Isoleucine"];
        q.correctAnswer = 1;
        q.explanation = "Leucine and lysine are the only two strictly ketogenic amino acids in humans. This means they cannot be used for net gluconeogenesis, as their degradation products (acetyl-CoA and acetoacetate) cannot be converted to glucose.";
        fixedCount++;
    }
    else if (String(q.id) === "143") {
        q.question = "Which of the following amino acids serves as an essential nitrogen donor for the biosynthesis of purines and pyrimidines, acts as a primary ammonia transporter in the blood, and is classified as glucogenic?";
        q.options = ["Glutamate", "Alanine", "Lysine", "Glutamine"];
        q.correctAnswer = 3;
        q.explanation = "Glutamine acts as a central hub in nitrogen metabolism, donating amino groups for nucleotide synthesis (both purines and pyrimidines). It is the most abundant amino acid in the blood and serves as a safe transporter of ammonia. It is glucogenic, not ketogenic.";
        fixedCount++;
    }
    else if (String(q.id) === "190") {
        q.question = "A researcher is studying the structural stability of extracellular matrix proteins. Which of the following amino acids is primarily responsible for forming covalent disulfide bonds that stabilize the tertiary and quaternary structure of proteins like collagen type IV and keratin?";
        q.options = ["Serine", "Cysteine", "Glycine", "Methionine"];
        q.correctAnswer = 1;
        q.explanation = "Cysteine contains a thiol (-SH) group that can oxidize to form covalent disulfide bonds (-S-S-) with another cysteine residue, stabilizing protein tertiary and quaternary structures. Note: Amelogenin famously lacks sulfur-containing amino acids (cysteine and methionine).";
        fixedCount++;
    }
    else if (String(q.id) === "371") {
        q.question = "A 4-year-old boy presents with progressive hepatosplenomegaly, anemia, easy bruising, and radiologic evidence of an 'Erlenmeyer flask' deformity of the distal femurs. Enzyme assay reveals a deficiency in lysosomal beta-glucocerebrosidase. This clinical and biochemical profile is diagnostic of which lysosomal storage disorder?";
        q.options = ["Gaucher disease", "Niemann-Pick disease", "Tay-Sachs disease", "Hurler syndrome"];
        q.correctAnswer = 0;
        q.explanation = "Gaucher disease is the most common lysosomal storage disorder, caused by a deficiency of beta-glucocerebrosidase, leading to the accumulation of glucocerebroside in macrophages (Gaucher cells). It characteristically presents with hepatosplenomegaly, pancytopenia, and bone crises/deformities. Tay-Sachs and Niemann-Pick present with cherry-red maculas.";
        fixedCount++;
    }
    else if (String(q.id) === "439") {
        q.question = "A patient with severe chronic obstructive pulmonary disease (COPD) presents with an exacerbation, leading to acute respiratory acidosis (decreased blood pH and increased pCO2). Which of the following allosteric effects on hemoglobin will rapidly compensate to increase oxygen unloading to the tissues in this acidic environment?";
        q.options = ["Decreased carbon dioxide tension", "Decreased pH (Bohr effect)", "Increased ATP binding", "Decreased 2,3-Bisphosphoglycerate (2,3-BPG)"];
        q.correctAnswer = 1;
        q.explanation = "The Bohr effect describes the decreased affinity of hemoglobin for oxygen in response to a decreased blood pH (acidosis) and increased CO2. This shift of the oxygen dissociation curve to the right promotes the unloading of oxygen to the metabolically active tissues. 2,3-BPG takes longer to adapt.";
        fixedCount++;
    }
    else if (String(q.id) === "448") {
        q.question = "A 28-year-old female presents with fatigue, macrocytic (megaloblastic) anemia, and glossitis. Further biochemical evaluation demonstrates an inherited defect in the cytosolic conversion of homocysteine to methionine. Which essential cofactor is most likely deficient or involved in this pathway?";
        q.options = ["Ascorbic acid (Vitamin C)", "Cobalamin (Vitamin B12)", "Thiamine pyrophosphate (Vitamin B1)", "Pyridoxal phosphate (Vitamin B6)"];
        q.correctAnswer = 1;
        q.explanation = "Methionine synthase requires vitamin B12 (cobalamin) as a cofactor to transfer a methyl group from N5-methyltetrahydrofolate to homocysteine, forming methionine. A deficiency in B12 leads to macrocytic (megaloblastic) anemia and neurological symptoms. B6 is involved in transamination.";
        fixedCount++;
    }
    else if (String(q.id) === "750790537") {
        q.correctAnswer = 3;
        q.explanation = "The description is classic for a pyogenic granuloma (pregnancy tumor). Initial management should focus on improving oral hygiene. Excision is often necessary if the lesion persists, interferes with function, or causes aesthetic concerns, and is typically deferred until after delivery if possible. Option 3 accurately describes this comprehensive management plan.";
        fixedCount++;
    }
}

fs.writeFileSync(dbPath, JSON.stringify(questions, null, 2));
console.log(`Successfully fixed ${fixedCount} biochemistry questions!`);
