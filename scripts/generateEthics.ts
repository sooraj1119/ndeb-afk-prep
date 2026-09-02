import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
const apiKey = process.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });
const questionsFile = path.resolve('public/questions/ethics.json');
let questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));

const targetCount = 500;
const topicId = "ethics";
let needed = targetCount - questions.length;
console.log(`Starting generation. Ethics needs ${needed} more questions.`);

function generateId() { return Math.floor(Math.random() * 1000000000); }
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function run() {
  const batchSize = 20;
  
  while (needed > 0) {
    const fetchCount = Math.min(needed, batchSize);
    console.log(`Fetching batch of ${fetchCount} questions...`);
    
    const prompt = `You are a strict, expert examiner for the NDEB AFK (National Dental Examining Board of Canada - Assessment of Fundamental Knowledge) exam.
You must generate exactly ${fetchCount} highly realistic, challenging, and medically accurate multiple-choice questions for the topic of "Ethics and Jurisprudence".

REQUIREMENTS:
1. Format: Standard NDEB clinical scenario structure OR theoretical fundamental knowledge questions.
2. Single Best Answer: Exactly 4 options. Only ONE is definitively correct.
3. Plausible Distractors: Incorrect options must be plausible misconceptions, alternative diagnoses, or related but incorrect treatments. No "joke" or obviously wrong options.
4. NO "All of the above" or "None of the above" (NDEB explicitly avoids these).
5. Explanations: The explanation MUST be 2-3 sentences detailing exactly why the correct answer is right AND why the major distractors are wrong according to Canadian dental standards.
6. NO DUPLICATES: Must generate entirely unique clinical scenarios and question stems compared to standard test banks.
7. Return the output as a RAW JSON array of objects. Do NOT use markdown code blocks.

Format for each object:
{
  "question": "The question text...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why A is correct and B,C,D are wrong."
}`;

    let retries = 3;
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
                    topicId: topicId,
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
        console.log(`Saved batch. Remaining: ${needed}`);
        await sleep(15000);
      } catch (e: any) {
        if (e?.status === 429) {
           console.log(`Rate limit. Waiting 60s...`);
           await sleep(120000);
           retries--;
        } else {
           console.log(`Error parsing or generating, retrying...`, e?.message);
           retries--;
           await sleep(5000);
        }
      }
    }
    
    if (!success) {
       console.log("Failed after retries. Exiting.");
       process.exit(1);
    }
  }
  
  console.log("Done! Reached 500 questions.");
}

run();



