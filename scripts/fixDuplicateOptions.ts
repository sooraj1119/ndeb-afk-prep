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

const manifestPath = path.resolve('public/questions/manifest.json');
const questionsDir = path.resolve('public/questions');
const files = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function generateReplacementOption(q: any, duplicateText: string): Promise<string> {
  const prompt = `
You are an expert dental board examiner.
I have a multiple choice question where one of the incorrect distractor options was accidentally duplicated.
Question: ${q.question}
Correct Answer (DO NOT USE THIS): ${q.options[q.correctAnswer]}
Current Options:
0: ${q.options[0]}
1: ${q.options[1]}
2: ${q.options[2]}
3: ${q.options[3]}
Explanation: ${q.explanation}

Provide exactly ONE short phrase that serves as a medically plausible but definitively INCORRECT distractor option for this question. It must not be the correct answer, and it must not be one of the existing unique options. 
Do not include any numbering, just the text of the new option.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.7 
    }
  });

  return response.text().trim();
}

async function runFixer() {
  console.log("Starting Duplicate Options Fixer...");
  let totalDuplicatesFound = 0;
  
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
        if (!q.options || q.options.length < 4) continue;
        
        // Check for duplicates
        let duplicateFound = false;
        let indexToReplace = -1;
        let duplicateText = "";
        
        for (let i = 0; i < q.options.length; i++) {
            for (let j = i + 1; j < q.options.length; j++) {
                if (q.options[i].toLowerCase().trim() === q.options[j].toLowerCase().trim()) {
                    duplicateFound = true;
                    // We must replace the one that is NOT the correctAnswer
                    if (j !== q.correctAnswer) {
                        indexToReplace = j;
                    } else if (i !== q.correctAnswer) {
                        indexToReplace = i;
                    }
                    duplicateText = q.options[i];
                    break;
                }
            }
            if (duplicateFound) break;
        }
        
        if (duplicateFound && indexToReplace !== -1) {
            totalDuplicatesFound++;
            console.log(`\nFound duplicate in ${file} | ID ${q.id}: "${duplicateText}"`);
            console.log(`Generating replacement for index ${indexToReplace}...`);
            
            let retries = 3;
            while (retries > 0) {
                try {
                    const newOption = await generateReplacementOption(q, duplicateText);
                    console.log(`  -> Replaced with: "${newOption}"`);
                    q.options[indexToReplace] = newOption;
                    fileModified = true;
                    break;
                } catch (err: any) {
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
  
  console.log(`\nDuplicate Fixer Complete!`);
  console.log(`Total duplicate options found and fixed: ${totalDuplicatesFound}`);
}

runFixer();
