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

async function classifyBatch(questions: any[]): Promise<string[]> {
  const prompt = `You are a medical auditor for the NDEB AFK exam. Classify each of the following multiple-choice questions into exactly one of two categories:
1. "CLINICAL": The question presents a clinical scenario, patient case, or practical application.
2. "THEORY": The question is pure theory, rote memorization, or a direct fact-based query without a patient scenario.

Here are the questions:
${JSON.stringify(questions.map(q => ({ id: q.id, question: q.question })), null, 2)}

Return ONLY a raw JSON array of strings in the exact same order as the input. 
Example output: ["CLINICAL", "THEORY", "CLINICAL"]
Do not include any markdown formatting or backticks. Just the raw JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
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
    return questions.map(() => "CLINICAL"); // default fallback
  }
}

async function runEnforcer() {
  console.log("🚀 Starting 65% Clinical Ratio Enforcement for ANATOMY...");
  
  const targetTopicId = "anatomy";
  const topic = manifest.find((t: any) => t.id === targetTopicId);
  
  if (!topic) {
    console.error("Anatomy topic not found in manifest.");
    return;
  }

  const filePath = path.join(questionsDir, `${topic.id}.json`);
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`\n[${topic.id}] Analyzing ${data.length} questions...`);
  
  let classifiedCount = 0;
  const batchSize = 25;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const unclassified = batch.filter((q: any) => q.isClinical === undefined);
    
    if (unclassified.length === 0) continue;

    let success = false;
    let retries = 0;
    
    while (!success && retries < 15) {
      try {
        const classifications = await classifyBatch(unclassified);
        
        for (let j = 0; j < unclassified.length; j++) {
          const q = unclassified[j];
          const target = data.find((item: any) => item.id === q.id);
          if (target) {
            target.isClinical = (classifications[j] === "CLINICAL");
          }
        }
        classifiedCount += unclassified.length;
        console.log(`  -> Batch ${Math.floor(i/batchSize)+1}: Classified ${unclassified.length} Qs.`);
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        success = true;
        await sleep(2000);
        
      } catch (error: any) {
        if (error.message === "RATE_LIMIT") {
          console.log("  -> Rate limit hit. Waiting 90 seconds before retrying...");
          await sleep(90000);
          retries++;
        } else {
          console.error("  -> Unhandled error:", error);
          retries = 15;
        }
      }
    }
  }
  
  // Calculate ratio
  const clinicalQuestions = data.filter((q: any) => q.isClinical);
  const theoryQuestions = data.filter((q: any) => !q.isClinical);
  const cCount = clinicalQuestions.length;
  let tCount = theoryQuestions.length;
  const totalCount = data.length;
  
  let ratio = cCount / totalCount;
  console.log(`[${topic.id}] Classification complete. Clinical: ${cCount}, Theory: ${tCount} (Ratio: ${(ratio*100).toFixed(1)}%)`);
  
  if (ratio < 0.65) {
    // C / (C + T_new) = 0.65  => T_new = (C / 0.65) - C
    const maxTheoryAllowed = Math.floor((cCount / 0.65) - cCount);
    const toDelete = tCount - maxTheoryAllowed;
    
    if (toDelete > 0) {
      console.log(`[${topic.id}] Enforcing 65% rule: Deleting ${toDelete} excess theory questions...`);
      let deleted = 0;
      data = data.filter((q: any) => {
        if (!q.isClinical && deleted < toDelete) {
          deleted++;
          return false;
        }
        return true;
      });
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      topic.count = data.length;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`[${topic.id}] Deleted ${deleted}. Remaining total: ${data.length}. New ratio: >= 65%`);
    }
  } else {
    console.log(`[${topic.id}] Ratio is already >= 65%. No deletions needed.`);
  }

  console.log(`\n✅ Anatomy Scan Complete! Now we must replace the deleted questions.`);
}

runEnforcer();
