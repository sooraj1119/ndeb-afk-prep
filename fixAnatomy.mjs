import fs from 'fs';
import path from 'path';

const anatomyPath = path.resolve('public/questions/anatomy.json');
const rawData = fs.readFileSync(anatomyPath, 'utf8');
const questions = JSON.parse(rawData);

let fixedCount = 0;

for (const q of questions) {
    if (String(q.id) === "827162358") {
        q.question = "A 72-year-old male patient presents with a chief complaint of difficulty chewing and speaking after a cerebrovascular accident. Clinical examination reveals a significant limitation in mouth opening, and when he attempts to open, his mandible visibly deviates to the right side. Which muscle of mastication is MOST likely experiencing weakness or paralysis?";
        q.options = ["Right Masseter", "Right Temporalis", "Left Lateral Pterygoid", "Right Lateral Pterygoid"];
        q.correctAnswer = 3; // Right Lateral Pterygoid
        q.explanation = "The lateral pterygoid muscle is responsible for depressing and protruding the mandible. Unilateral contraction pulls the condyle forward and medially, shifting the chin to the opposite side. Therefore, if the right lateral pterygoid is weak or paralyzed, it fails to pull the right condyle forward, while the healthy left lateral pterygoid continues to push the left condyle forward. This results in the mandible deviating towards the affected (right) side upon opening.";
        fixedCount++;
    }
    
    if (String(q.id) === "948685465") {
        q.options = ["Left lateral pterygoid", "Right lateral pterygoid", "Left masseter", "Right temporalis"];
        q.correctAnswer = 1; // Right lateral pterygoid
        q.explanation = "When the mandible deviates to one side upon opening, it indicates weakness or dysfunction of the IPSILATERAL lateral pterygoid muscle. The lateral pterygoid is primarily responsible for mandibular depression and protrusion. If the right lateral pterygoid is weak, it cannot pull the right condyle forward. The unopposed left lateral pterygoid will push the left condyle forward, causing the chin to swing towards the right (the weak side).";
        fixedCount++;
    }

    if (String(q.id) === "747041513") {
        q.options = ["Masseter", "Lateral pterygoid", "Medial pterygoid", "Temporalis"];
        q.correctAnswer = 0; // Masseter
        q.explanation = "The masseter muscle originates from the zygomatic arch and inserts into the angle and lateral surface of the mandibular ramus. A fracture of the zygomatic arch can directly impinge upon or injure the masseter muscle (or mechanically block the coronoid process of the temporalis). The lateral pterygoid originates from the sphenoid bone, not the zygomatic arch. Trismus and deviation towards the affected side on opening are common sequelae of a zygomatic arch fracture affecting the elevator muscles on that side.";
        fixedCount++;
    }

    if (String(q.id) === "396254695") {
        q.question = "A 60-year-old female patient presents with a chief complaint of difficulty in differentiating sweet and salty tastes on the anterior two-thirds of her tongue. She also reports a recent history of a clicking sound in her right ear and hyperacusis (increased sensitivity to sound), but NO facial paralysis is present. A lesion affecting which of the following cranial nerves within the facial canal (mastoid segment) is MOST likely responsible?";
        q.options = ["Lingual nerve", "Facial nerve (CN VII)", "Glossopharyngeal nerve", "Hypoglossal nerve"];
        q.correctAnswer = 1; // Facial nerve
        q.explanation = "The Facial nerve (CN VII) gives off the nerve to the stapedius muscle (damage causes hyperacusis) and the chorda tympani (damage causes loss of taste to the anterior 2/3 of the tongue). A lesion in the facial canal that affects both of these branches, but spares the distal motor branches to the muscles of facial expression, would present with hyperacusis and taste loss without facial paralysis. The lingual nerve (V3) carries general sensation, not hyperacusis.";
        fixedCount++;
    }

    if (String(q.id) === "635958304") {
        q.question = "Which of the following cranial nerves is primarily responsible for BOTH the general sensation and the special sensation of taste from the POSTERIOR one-third of the tongue?";
        q.options = ["Glossopharyngeal nerve (CN IX)", "Hypoglossal nerve (CN XII)", "Trigeminal nerve (CN V)", "Facial nerve (CN VII)"];
        q.correctAnswer = 0; // CN IX
        q.explanation = "The glossopharyngeal nerve (CN IX) provides BOTH general sensation (touch, pain, temperature) and special sensation (taste) to the posterior one-third of the tongue. In contrast, the anterior two-thirds of the tongue has dual innervation: general sensation via the lingual nerve (CN V3) and special sensation via the chorda tympani (CN VII).";
        fixedCount++;
    }

    if (String(q.id) === "298794317") {
        q.options = ["Left lateral pterygoid", "Right lateral pterygoid", "Left temporalis", "Right medial pterygoid"];
        q.correctAnswer = 1; // Right lateral pterygoid
        q.explanation = "The right lateral pterygoid muscle is responsible for pulling the right condyle downward and forward down the articular eminence during mouth opening. If the right lateral pterygoid is weak or dysfunctional, the right condyle will translate less effectively than the left condyle. The unopposed action of the healthy left lateral pterygoid will push the jaw to the right, resulting in deviation towards the affected side upon opening.";
        fixedCount++;
    }
}

fs.writeFileSync(anatomyPath, JSON.stringify(questions, null, 2));
console.log(`Successfully rewrote ${fixedCount} hallucinated anatomy questions!`);
