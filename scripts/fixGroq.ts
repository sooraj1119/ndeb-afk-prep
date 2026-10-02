import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const keys = [
  process.env.VITE_GROQ_API_KEY,
  process.env.VITE_GROQ_API_KEY_2,
  process.env.VITE_GROQ_API_KEY_3,
  process.env.VITE_GROQ_API_KEY_4
];

let keyIndex = 0;
let groq = new Groq({ apiKey: keys[keyIndex] });

const FLAGGED_FILE = path.join(process.cwd(), 'scratch', 'flagged_questions.json');
const QUESTIONS_DIR = path.join(process.cwd(), 'public', 'questions');

const SYSTEM_PROMPT = `You are an expert Canadian dental specialist and NDEB AFK (Assessment of Fundamental Knowledge) examiner.
Your task is to fix a medically flagged multiple-choice question.
The question was flagged for being factually incorrect, containing errors, or having a disputed correct answer.

STRICT NDEB GUIDELINES:
1. The question must be a realistic clinical scenario or direct medical/dental fact aligned with Canadian dental standards.
2. There MUST be exactly 4 plausible options.
3. The correct answer must be definitively correct based on modern dental literature.
4. The explanation must clearly explain WHY the correct answer is right and why the distractors are wrong or less ideal.
5. Tone: Professional, objective, and academic.

You must output ONLY valid JSON containing the fixed question. Do not use markdown blocks like \`\`\`json.
Format:
{
  "question": "The fixed question text...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Detailed explanation..."
}`;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fixQuestion(flaggedItem: any): Promise<any> {
  const prompt = `Please fix the following dental question to be 100% medically accurate.

Current Question: ${flaggedItem.question}
Current Options: ${JSON.stringify(flaggedItem.options)}
Current Correct Answer Index: ${flaggedItem.correctAnswer}
Current Explanation: ${flaggedItem.explanation}
Flag Reason: This question was flagged as factually incorrect or ambiguous during an AI audit.

Provide the corrected version in the required JSON format.`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      model: 'qwen/qwen3.8-27b',
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content || '{}';
    const fixed = JSON.parse(content);

    if (!fixed.question || !fixed.options || fixed.options.length !== 4 || typeof fixed.correctAnswer !== 'number' || !fixed.explanation) {
       throw new Error("Invalid format returned by AI");
    }

    return fixed;
  } catch (error: any) {
    if (error.status === 429) {
       keyIndex++;
       if (keyIndex >= keys.length) {
          console.log('\n[!] All Groq keys exhausted! API rate limit hit. Sleeping for 90 seconds to let quotas reset...');
          await delay(90000);
          console.log('Waking up and resetting to Key 1...');
          keyIndex = 0;
       }
       console.log(`\n  [KEY ROTATION] Switching to Groq key ${keyIndex + 1} of ${keys.length}`);
       groq = new Groq({ apiKey: keys[keyIndex] });
       return fixQuestion(flaggedItem);
    }
    console.error(`  [ERROR] Failed to fix ID ${flaggedItem.id}: ${error.message}`);
    return null;
  }
}

async function run() {
  if (!fs.existsSync(FLAGGED_FILE)) {
    console.log("No flagged questions file found.");
    return;
  }

  const flaggedQuestions = JSON.parse(fs.readFileSync(FLAGGED_FILE, 'utf8'));
  console.log(`Found ${flaggedQuestions.length} flagged questions to fix.`);

  let fixedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < flaggedQuestions.length; i++) {
    const item = flaggedQuestions[i];
    console.log(`\n[${i + 1}/${flaggedQuestions.length}] Fixing ID ${item.id} in ${item.file}... | Key ${keyIndex + 1}/${keys.length}`);

    const fixed = await fixQuestion(item);
    
    if (fixed) {
      const filePath = path.join(QUESTIONS_DIR, item.file);
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const qIndex = fileData.findIndex((q: any) => q.id === item.id);
      if (qIndex !== -1) {
        fileData[qIndex].question = fixed.question;
        fileData[qIndex].options = fixed.options;
        fileData[qIndex].correctAnswer = fixed.correctAnswer;
        fileData[qIndex].explanation = fixed.explanation;
        fileData[qIndex].aiVerified = true;
        fileData[qIndex].aiFixed = true;

        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
        
        console.log(`  ✅ Successfully fixed and saved!`);
        fixedCount++;
        
        flaggedQuestions.splice(i, 1);
        fs.writeFileSync(FLAGGED_FILE, JSON.stringify(flaggedQuestions, null, 2));
        i--;
      } else {
        console.log(`  ❌ Could not find ID ${item.id} in ${item.file}`);
        errorCount++;
      }
    } else {
      errorCount++;
    }

    await delay(1000);
  }

  console.log(`\n🎉 Fix process completed!`);
  console.log(`Fixed: ${fixedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Remaining flagged: ${flaggedQuestions.length}`);
}

run().catch(console.error);
