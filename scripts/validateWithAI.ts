import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
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

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    isValid: {
      type: Type.BOOLEAN,
      description: "True if the explanation correctly justifies the designated correctIndex. False if the explanation supports a different option."
    },
    correctIndex: {
      type: Type.INTEGER,
      description: "The actual correct index (0, 1, 2, or 3) that the explanation supports."
    }
  },
  required: ["isValid", "correctIndex"]
};

async function verifyQuestion(q: any): Promise<{isValid: boolean, correctIndex: number}> {
  const prompt = `
You are a strict dental board exam auditor. Read this multiple-choice question and explanation.
Question: ${q.question}
Option 0: ${q.options[0]}
Option 1: ${q.options[1]}
Option 2: ${q.options[2]}
Option 3: ${q.options[3]}
Explanation: ${q.explanation}

The designated correct index in the database is currently: ${q.correctAnswer}

Does the explanation actually support Option ${q.correctAnswer}? 
If the explanation clearly states that a different option is correct, set isValid to false and provide the actual correctIndex based on the explanation.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.0 // Strict logic
    }
  });

  const text = response.text();
  return JSON.parse(text);
}

async function runValidator() {
  console.log("Starting AI Validation Script...");
  
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
    let checkedInFile = 0;
    
    for (const q of questions) {
      if (q.aiVerified) continue; // Skip already verified

      let retries = 3;
      while (retries > 0) {
        try {
          const result = await verifyQuestion(q);
          
          if (!result.isValid && result.correctIndex !== q.correctAnswer) {
             console.log(`\n[FIXED - ${file}] ID ${q.id} | Was: ${q.correctAnswer}, AI says: ${result.correctIndex}`);
             console.log(`Explanation: ${q.explanation}`);
             q.correctAnswer = result.correctIndex;
          }
          
          q.aiVerified = true;
          fileModified = true;
          checkedInFile++;
          
          if (checkedInFile % 5 === 0) {
              console.log(`Verified ${checkedInFile} questions in ${file}...`);
          }
          
          break; // Success, exit retry loop
          
        } catch (error: any) {
          if (error.status === 429 || error.message?.includes('429')) {
            console.log("\n[Rate Limit] Waiting 90 seconds before resuming...");
            await sleep(90000);
          } else {
            console.error(`Error verifying question ${q.id}:`, error.message);
            retries--;
            await sleep(5000); // Wait a bit on normal error
          }
        }
      }
      
      // Save after every single question to ensure progress is never lost if stopped
      if (fileModified) {
        fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
      }
    }
  }
  console.log("All questions have been verified!");
}

runValidator();
