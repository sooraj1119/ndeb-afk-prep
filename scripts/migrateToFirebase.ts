import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let serviceAccount;
try {
  const serviceAccountPath = path.join(__dirname, '../firebase-admin.json');
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} catch (e) {
  console.error("Could not find firebase-admin.json in the project root. Make sure you downloaded and renamed it!");
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function migrate() {
  const manifestPath = path.join(__dirname, '../public/questions/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  let totalUploaded = 0;

  for (const topic of manifest) {
    const topicId = topic.id;
    console.log(`Processing topic: ${topicId}...`);
    
    const questionsPath = path.join(__dirname, `../public/questions/${topicId}.json`);
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

    // We can use batches to upload faster (limit 500 per batch)
    let batch = db.batch();
    let batchCount = 0;

    for (const q of questions) {
      const docRef = db.collection('questions').doc(q.id.toString());
      
      const data = { ...q, topicId };
      batch.set(docRef, data);
      batchCount++;
      totalUploaded++;

      if (batchCount === 500) {
        await batch.commit();
        console.log(`  Committed batch of 500 for ${topicId}`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`  Committed final batch of ${batchCount} for ${topicId}`);
    }
  }

  console.log(`Migration complete! Successfully uploaded ${totalUploaded} questions to Firestore.`);
}

migrate().catch(console.error);
