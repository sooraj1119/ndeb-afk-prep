import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
const apiKey = process.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });
const targetCount = 500;

const topicsToFill = [
  { id: 'oral-medicine', promptTopic: 'Oral Medicine' },
  { id: 'oral-surgery', promptTopic: 'Oral Surgery' },
  { id: 'implants', promptTopic: 'Dental Implants' },
  { id: 'emergencies', promptTopic: 'Dental and Medical Emergencies' },
  { id: 'orthodontics', promptTopic: 'Orthodontics' },
  { id: 'pedodontics', promptTopic: 'Pedodontics' },
  { id: 'infection-control', promptTopic: 'Prevention and Infection Control' }
];

function generateId() { return Math.floor(Math.random() * 1000000000); }
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function run() {
  for (const t of topicsToFill) {
    const questionsFile = path.resolve(`public/questions/${t.id}.json`);
    let questions = [];
    if (fs.existsSync(questionsFile)) {
      questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));
    }
    
    let needed = targetCount - questions.length;
    if (needed <= 0) continue;
    
    console.log(`Starting generation for ${t.id}. Needs ${needed} more questions.`);
    const batchSize = 20;
    
    while (needed > 0) {
      const fetchCount = Math.min(needed, batchSize);
      console.log(`[${t.id}] Fetching batch of ${fetchCount} questions...`);
      
      const prompt = `You are a strict, expert examiner for the NDEB AFK (National Dental Examining Board of Canada - Assessment of Fundamental Knowledge) exam.
You must generate exactly ${fetchCount} highly realistic, challenging, and medically accurate multiple-choice questions for the topic of "${t.promptTopic}".

REQUIREMENTS:
1. Format: Standard NDEB clinical scenario structure OR theoretical fundamental knowledge questions.
2. Single Best Answer: Exactly 4 options. Only ONE is definitively correct.
3. Plausible Distractors: Incorrect options must be plausible misconceptions, alternative diagnoses, or related but incorrect treatments. No "joke" or obviously wrong options.
4. NO "All of the above" or "None of the above" (NDEB explicitly avoids these).
5. Explanations: The explanation MUST be 2-3 sentences detailing exactly why the correct answer is right AND why the major distractors are wrong according to Canadian dental standards.
6. NO DUPLICATES: Must generate entirely unique clinical scenarios and question stems compared to standard test banks.
7. Hide the answer: Do NOT bias towards Option B or C. Randomize the position of the correct answer (0, 1, 2, or 3).
8. Return the output as a RAW JSON array of objects. Do NOT use markdown code blocks.

Format for each object:
{
  "question": "The question text...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why A is correct and B,C,D are wrong."
}`;

      let retries = 15;
      let success = false;
      
      while (!success && retries > 0) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.9,
                responseMimeType: "application/json"
            }
          });
          
          let text = response.text || "[]";
          let parsed = JSON.parse(text);
          if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Invalid array");
          
          for (const q of parsed) {
              if (needed > 0) {
                  questions.push({
                      id: generateId(),
                      topicId: t.id,
                      question: q.question,
                      options: q.options,
                      correctAnswer: q.correctAnswer,
                      explanation: q.explanation
                  });
                  needed--;
              }
          }
          
          success = true;
          fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
          
          // Update manifest count
          const manifestPath = path.resolve('public/questions/manifest.json');
          let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          const mItem = manifest.find((m: any) => m.id === t.id);
          if (mItem) mItem.count = questions.length;
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
          
          console.log(`Saved batch for ${t.id}. Remaining: ${needed}`);
          await sleep(15000);
        } catch (e: any) {
          if (e?.status === 429 || e?.status === 503) {
             console.log(`Rate limit. Waiting 60s...`);
             await sleep(60000);
             retries--;
          } else {
             console.log(`Error parsing or generating, retrying...`, e?.message);
             retries--;
             await sleep(5000);
          }
        }
      }
      
      if (!success) {
         console.log(`Failed after retries on ${t.id}. Exiting.`);
         process.exit(1);
      }
    }
    console.log(`Done with ${t.id}!`);
  }
  console.log("ALL NEW TOPICS COMPLETED.");
}

run();
