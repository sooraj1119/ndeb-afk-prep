const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = require('../firebase-admin.json');
} catch (e) {
  console.error("Could not find firebase-admin.json in the project root. Make sure you downloaded and renamed it!");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// We will store all questions in a single 'questions' collection
// with the document ID being the question ID. We also add a 'topicId' field.

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
      
      // Add the topicId to the document so we can query by topic later
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
