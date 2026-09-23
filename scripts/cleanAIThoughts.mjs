import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("No API key found in .env.local!");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const questionsDir = path.resolve('public/questions');
const files = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const triggerPhrases = [
  "Wait,",
  "Let's re-evaluate",
  "Let's look",
  "Correction:",
  "Actually,",
  "Let us construct"
];

function hasMonologue(text) {
    if (!text) return false;
    for (const phrase of triggerPhrases) {
        if (text.includes(phrase)) return true;
    }
    return false;
}

async function rewriteExplanation(q) {
  const prompt = `
You are a strict dental board exam editor.
The following multiple choice question has an explanation that contains an AI's internal "chain-of-thought" monologue (e.g., "Wait, let's re-evaluate"). 
I need you to rewrite the explanation to be a single, confident, medically accurate, and highly professional paragraph that strictly supports the designated Correct Answer. Do NOT include any internal monologues, second-guessing, or phrases like "Option B is correct". Just explain the facts.

Question: ${q.question}
Options:
0: ${q.options[0]}
1: ${q.options[1]}
2: ${q.options[2]}
3: ${q.options[3]}

Correct Answer Index: ${q.correctAnswer} (${q.options[q.correctAnswer]})

Flawed Explanation with Monologue: 
${q.explanation}

Provide ONLY the final rewritten paragraph text. Do not include quotes or formatting.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.1 
    }
  });

  return response.text().trim();
}

async function runCleaner() {
  console.log("Starting AI Monologue Cleaner...");
  let totalFixed = 0;
  
  for (const file of files) {
    const filePath = path.join(questionsDir, file);
    const rawData = fs.readFileSync(filePath, 'utf8');
    let questions;
    try {
      questions = JSON.parse(rawData);
    } catch (e) {
      continue;
    }

    let fileModified = false;
    
    for (const q of questions) {
        // Hardcode fix for Anatomy ID 138 first
        if (file === 'anatomy.json' && q.id === 138) {
            console.log(`\n[HARDCODED FIX] anatomy.json ID 138`);
            q.correctAnswer = 1; // Left masseter
            q.explanation = "Deviation of the mandible upon opening occurs towards the side of restriction. A spasm (hypertonicity) of an elevator muscle on the left side, such as the left masseter, restricts the left condyle from translating downward and forward. When the right condyle translates normally and the left condyle is restricted, the jaw deviates to the left (the affected side). Conversely, if a lateral pterygoid were spasming, it would push the jaw to the opposite side.";
            fileModified = true;
            totalFixed++;
            continue;
        }

        if (hasMonologue(q.explanation)) {
            console.log(`\nFound monologue in ${file} | ID ${q.id}:`);
            console.log(`Snippet: "${q.explanation.substring(0, 100)}..."`);
            
            let retries = 3;
            while (retries > 0) {
                try {
                    const cleanText = await rewriteExplanation(q);
                    console.log(`  -> Cleaned: "${cleanText.substring(0, 100)}..."`);
                    q.explanation = cleanText;
                    fileModified = true;
                    totalFixed++;
                    break;
                } catch (err) {
                    if (err.status === 429 || err.message?.includes('429')) {
                        console.log("  Rate limit hit. Waiting 90s...");
                        await sleep(90000);
                    } else {
                        console.error("  Error:", err.message);
                        retries--;
                        await sleep(5000);
                    }
                }
            }
        }
    }
    
    if (fileModified) {
        fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
        console.log(`Saved fixes to ${file}`);
    }
  }
  
  console.log(`\nCleaner Complete!`);
  console.log(`Total monologues removed: ${totalFixed}`);
}

runCleaner();
