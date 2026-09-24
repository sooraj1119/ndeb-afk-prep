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
    isMedicallyCorrect: {
      type: Type.BOOLEAN,
      description: "True if the designated correct option is indeed the medically accurate answer, AND the explanation is factually correct."
    },
    medicallyCorrectIndex: {
      type: Type.INTEGER,
      description: "The index (0, 1, 2, or 3) of the option that is actually medically correct based on standard dental science."
    },
    correctedExplanation: {
      type: Type.STRING,
      description: "If isMedicallyCorrect is false, provide a fully corrected, medically accurate explanation justifying the medicallyCorrectIndex."
    }
  },
  required: ["isMedicallyCorrect", "medicallyCorrectIndex"]
};

async function verifyQuestion(q: any): Promise<{isMedicallyCorrect: boolean, medicallyCorrectIndex: number, correctedExplanation?: string}> {
  const prompt = `
You are a strict dental board examiner (NDEB). Read this multiple-choice question, the options, and the explanation.
Question: ${q.question}
Option 0: ${q.options[0]}
Option 1: ${q.options[1]}
Option 2: ${q.options[2]}
Option 3: ${q.options[3]}
Current Explanation: ${q.explanation}

The designated correct index in the database is currently: ${q.correctAnswer} (which corresponds to Option ${q.correctAnswer}).

Task:
1. Determine the actual medically correct answer to the question using standard dental knowledge.
2. If the designated correctAnswer is WRONG, or if the Current Explanation contains medical errors/contradictions, set isMedicallyCorrect to false.
3. If isMedicallyCorrect is false, provide the actual medicallyCorrectIndex, and rewrite the explanation completely in correctedExplanation to be medically accurate.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.0
    }
  });

  const text = response.text; // Fixed from response.text()
  return JSON.parse(text);
}

async function runValidator() {
  console.log("Starting Strict Medical AI Validation Script...");
  
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
      if (q.aiVerified) continue;

      let retries = 3;
      while (retries > 0) {
        try {
          const result = await verifyQuestion(q);
          
          if (!result.isMedicallyCorrect) {
             console.log(`\n[MEDICAL FIX - ${file}] ID ${q.id} | Was: ${q.correctAnswer}, AI says: ${result.medicallyCorrectIndex}`);
             q.correctAnswer = result.medicallyCorrectIndex;
             if (result.correctedExplanation) {
                 q.explanation = result.correctedExplanation;
             }
          }
          
          q.aiVerified = true;
          fileModified = true;
          checkedInFile++;
          
          if (checkedInFile % 5 === 0) {
              console.log(`Deep medically verified ${checkedInFile} questions in ${file}...`);
          }
          
          break; // Success, exit retry loop
          
        } catch (error: any) {
          if (error.status === 429 || error.message?.includes('429')) {
            console.log("\n[Rate Limit] Waiting 90 seconds before resuming...");
            await sleep(90000);
          } else {
            console.error(`Error verifying question ${q.id}:`, error.message);
            retries--;
            await sleep(5000);
          }
        }
      }
      
      if (fileModified) {
        fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
      }
    }
  }
  console.log("All questions have been medically verified!");
}

runValidator();
