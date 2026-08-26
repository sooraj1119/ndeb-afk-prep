import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env.local" });
const apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) process.exit(1);

const ai = new GoogleGenAI({ apiKey });
const targetCount = 500;
const topicsDir = path.resolve("public/questions");
const manifestPath = path.resolve(topicsDir, "manifest.json");

const topicsToFill = [
  "anatomy", "pharmacology", "endodontics", "anesthesia", "pathology", 
  "operative-dentistry", "biochemistry", "microbiology", "dental-materials", 
  "periodontology", "oral-pathology", "radiology", "prosthodontics", 
  "general-medicine", "ethics"
];

function generateId() { return Math.floor(Math.random() * 1000000000); }
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function run() {
  let manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  for (const topicId of topicsToFill) {
    const topicPath = path.join(topicsDir, `${topicId}.json`);
    let questions: any[] = [];
    if (fs.existsSync(topicPath)) {
      questions = JSON.parse(fs.readFileSync(topicPath, "utf8"));
    }
    
    let needed = targetCount - questions.length;
    if (needed <= 0) {
      console.log(`Topic '${topicId}' has ${questions.length} questions. Skipping.`);
      continue;
    }
    
    console.log(`\nTopic '${topicId}' needs ${needed} more questions.`);
    const batchSize = 10;
    
    while (needed > 0) {
      const fetchCount = Math.min(needed, batchSize);
      console.log(`Fetching batch of ${fetchCount}...`);
      
      const prompt = `You are a strict, expert examiner writing questions for the Canadian NDEB AFK exam.
Generate exactly ${fetchCount} highly realistic, challenging multiple-choice questions for the topic of "${topicId}".

CRITICAL NDEB AFK EXAM GUIDELINES:
1. FORMAT: Exactly 4 options per question. NEVER 3, NEVER 5.
2. NO NEGATIVE PHRASING: NEVER use 'EXCEPT', 'NOT', or 'LEAST LIKELY' in the question text.
3. CLINICAL FOCUS: At least 50% of the questions MUST be clinical vignettes (patient scenarios with age, gender, symptoms, clinical findings).
4. RIGOROUS EXPLANATIONS: Every explanation must act as a tutor. It MUST explain exactly why the correct answer is right AND explicitly state why the other 3 options are incorrect.
5. UNIQUENESS: Ensure these questions are unique and do not repeat typical generic questions.

Return ONLY a valid JSON array of objects. Do not include markdown code blocks.
Each object must match this exact interface:
{
  "id": number, // random unique 9-digit number
  "topicId": "${topicId}",
  "question": string, // The question text adhering to the strict guidelines above.
  "options": string[], // Exactly 4 options.
  "correctAnswer": number, // Index (0-3) of the correct option.
  "explanation": string // Rigorous tutor-level explanation covering all options.
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { temperature: 0.9 }
        });
        
        let text = response.text || "";
        text = text.replace(/^```json/g, "").replace(/^```/g, "").replace(/```$/g, "").trim();
        const batch = JSON.parse(text);
        
        if (!Array.isArray(batch) || batch.length === 0) throw new Error("Not a valid array");
        
        for (const q of batch) {
          q.id = generateId();
          q.topicId = topicId;
          if (q.options.length !== 4) continue;
          questions.push(q);
        }
        
        // Save incremental progress
        fs.writeFileSync(topicPath, JSON.stringify(questions, null, 2));
        
        // Update manifest
        const manifestItem = manifest.find((m: any) => m.id === topicId);
        if (manifestItem) manifestItem.count = questions.length;
        else manifest.push({ id: topicId, count: questions.length });
        fs.writeFileSync(manifestPath, JSON.stringify(manifest));
        
        needed = targetCount - questions.length;
        console.log(`Success! Saved batch. Remaining for ${topicId}: ${needed}`);
      } catch (err: any) {
        console.error("Error generating batch:", err.message);
        if (err.status === 429) {
          console.error("Rate limit hit! Exiting.");
          process.exit(1);
        }
      }
      await sleep(1500);
    }
  }
}
run();
