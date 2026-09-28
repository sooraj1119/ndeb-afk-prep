import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

const FLAGGED_FILE = path.join(process.cwd(), 'scratch', 'flagged_questions.json');
const QUESTIONS_DIR = path.join(process.cwd(), 'public', 'questions');

const SYSTEM_PROMPT = \You are an expert Canadian dental specialist and NDEB AFK (Assessment of Fundamental Knowledge) examiner.
Your task is to fix a medically flagged multiple-choice question.
The question was flagged for being factually incorrect, containing errors, or having a disputed correct answer.

STRICT NDEB GUIDELINES:
1. The question must be a realistic clinical scenario or direct medical/dental fact aligned with Canadian dental standards.
2. There MUST be exactly 4 plausible options.
3. The correct answer must be definitively correct based on modern dental literature.
4. The explanation must clearly explain WHY the correct answer is right and why the distractors are wrong or less ideal.
5. Tone: Professional, objective, and academic.

You must output ONLY valid JSON containing the fixed question. Do not use markdown blocks.
Format:
{
  "question": "The fixed question text...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Detailed explanation..."
}\;

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fixQuestion(flaggedItem) {
  const prompt = \Please fix the following dental question to be 100% medically accurate.

Current Question: \
Current Options: \
Current Correct Answer Index: \
Current Explanation: \
Flag Reason: This question was flagged as factually incorrect or ambiguous during an AI audit.

Provide the corrected version in the required JSON format.\;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
        responseMimeType: 'application/json',
      }
    });

    if (!response.text) throw new Error("Empty response");
    const fixed = JSON.parse(response.text.trim());

    if (!fixed.question || !fixed.options || fixed.options.length !== 4 || typeof fixed.correctAnswer !== 'number' || !fixed.explanation) {
       throw new Error("Invalid format returned by AI");
    }

    return fixed;
  } catch (error) {
    console.error(\  [ERROR] Failed to fix ID \: \\);
    return null;
  }
}

async function run() {
  if (!fs.existsSync(FLAGGED_FILE)) {
    console.log("No flagged questions file found.");
    return;
  }

  let flaggedQuestions = JSON.parse(fs.readFileSync(FLAGGED_FILE, 'utf8'));
  console.log(\Found \ flagged questions to fix.\);

  let fixedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < flaggedQuestions.length; i++) {
    const item = flaggedQuestions[i];
    console.log(\\n[\/\] Fixing ID \ in \...\);

    const fixed = await fixQuestion(item);
    
    if (fixed) {
      const filePath = path.join(QUESTIONS_DIR, item.file);
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const qIndex = fileData.findIndex(q => q.id === item.id);
      if (qIndex !== -1) {
        fileData[qIndex].question = fixed.question;
        fileData[qIndex].options = fixed.options;
        fileData[qIndex].correctAnswer = fixed.correctAnswer;
        fileData[qIndex].explanation = fixed.explanation;
        fileData[qIndex].aiVerified = true;
        fileData[qIndex].aiFixed = true;

        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
        
        console.log(\  OK: Successfully fixed and saved!\);
        fixedCount++;
        
        flaggedQuestions.splice(i, 1);
        fs.writeFileSync(FLAGGED_FILE, JSON.stringify(flaggedQuestions, null, 2));
        i--;
      } else {
        console.log(\  ERR: Could not find ID \ in \\);
        errorCount++;
      }
    } else {
      errorCount++;
    }

    await delay(2000);
  }

  console.log(\\n Fix process completed!\);
  console.log(\Fixed: \\);
  console.log(\Errors: \\);
  console.log(\Remaining flagged: \\);
}

run().catch(console.error);
