import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
const apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing VITE_GEMINI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const questionsDir = path.resolve('./public/questions');
const manifestPath = path.join(questionsDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function peerReviewBatch(questions: any[]): Promise<number[]> {
  const prompt = `You are a Master NDEB (National Dental Examining Board of Canada) Examiner.
Your job is to strictly audit the following multiple-choice questions for medical/dental accuracy and educational quality.

Identify ANY question that meets one of these failure criteria:
1. Medical hallucination or objectively incorrect information.
2. The designated 'correctAnswer' is wrong, or there are multiple arguably correct options.
3. The explanation is poor, factually wrong, or doesn't explain why the distractors are incorrect.
4. The clinical scenario is highly unrealistic.

Here are the questions in JSON format:
${JSON.stringify(questions, null, 2)}

Return ONLY a raw JSON array containing the "id" numbers of the questions that FAIL the review and should be deleted.
If ALL questions pass the review, return an empty array: []
Do not include any markdown formatting, backticks, or explanations. Just the JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        temperature: 0.1, // Low temp for highly analytical review
      }
    });

    const text = response.text || "[]";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (err: any) {
    if (err.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    console.error("AI Error:", err.message);
    return []; // Skip if it's a parsing error so we don't accidentally delete good questions
  }
}

async function runPeerReview() {
  console.log("🦷 Starting Master AI Peer Review Process...");
  let totalReviewed = 0;
  let totalDeleted = 0;

  for (const topic of manifest) {
    const filePath = path.join(questionsDir, `${topic.id}.json`);
    if (!fs.existsSync(filePath)) continue;

    let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const pendingQuestions = data.filter((q: any) => !q.peerReviewed);

    if (pendingQuestions.length === 0) {
      console.log(`[${topic.id}] 100% peer-reviewed already.`);
      continue;
    }

    console.log(`\n[${topic.id}] Starting peer review for ${pendingQuestions.length} questions...`);
    const batchSize = 10;
    
    for (let i = 0; i < pendingQuestions.length; i += batchSize) {
      const batch = pendingQuestions.slice(i, i + batchSize);
      
      let success = false;
      let retries = 0;
      
      while (!success && retries < 15) {
        try {
          const failedIds = await peerReviewBatch(batch);
          
          // Apply results
          let deletedInBatch = 0;
          for (const q of batch) {
            if (failedIds.includes(q.id)) {
              // Mark for deletion
              data = data.filter((item: any) => item.id !== q.id);
              deletedInBatch++;
              totalDeleted++;
            } else {
              // Mark as passed
              const target = data.find((item: any) => item.id === q.id);
              if (target) target.peerReviewed = true;
            }
          }
          
          totalReviewed += batch.length;
          console.log(`  -> Batch ${Math.floor(i/batchSize)+1}: Evaluated ${batch.length} Qs. Failed & Deleted: ${deletedInBatch}`);
          
          // Save after every batch
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
          topic.count = data.length;
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
          
          success = true;
          // Small delay to respect rate limits
          await sleep(2000);
          
        } catch (error: any) {
          if (error.message === "RATE_LIMIT") {
            console.log("  -> Rate limit hit. Waiting 90 seconds before retrying...");
            await sleep(90000);
            retries++;
          } else {
            console.error("  -> Unhandled error:", error);
            retries = 15; // force skip
          }
        }
      }
    }
    console.log(`[${topic.id}] Peer review complete.`);
  }

  console.log(`\n🎉 Peer Review Complete!`);
  console.log(`Total questions reviewed: ${totalReviewed}`);
  console.log(`Total questions medically failed & deleted: ${totalDeleted}`);
}

runPeerReview();
