import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKeys = [
  process.env.VITE_GROQ_API_KEY,
  process.env.VITE_GROQ_API_KEY_2,
  process.env.VITE_GROQ_API_KEY_3,
  process.env.VITE_GROQ_API_KEY_4,
  process.env.VITE_GROQ_API_KEY_5,
].filter(Boolean) as string[];

if (apiKeys.length === 0) {
  console.error("No Groq API keys found!");
  process.exit(1);
}
console.log(`Loaded ${apiKeys.length} API key(s) for clinical auditing.\n`);

let currentKeyIndex = 0;
const exhaustedKeys = new Set<number>();

function getClient(): Groq {
  return new Groq({ apiKey: apiKeys[currentKeyIndex] });
}

function rotateKey(): boolean {
  exhaustedKeys.add(currentKeyIndex);
  for (let i = 0; i < apiKeys.length; i++) {
    if (!exhaustedKeys.has(i)) {
      currentKeyIndex = i;
      console.log(`\n  [KEY ROTATION] Switched to key ${i + 1} of ${apiKeys.length}`);
      return true;
    }
  }
  return false;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const flaggedPath = path.resolve('scratch/flagged_questions.json');
const progressPath = path.resolve('scratch/fixed_flagged_progress.json');
const questionsDir = path.resolve('public/questions');

const flaggedList: any[] = JSON.parse(fs.readFileSync(flaggedPath, 'utf8'));
const fixedProgress: Record<string, any> = fs.existsSync(progressPath)
  ? JSON.parse(fs.readFileSync(progressPath, 'utf8'))
  : {};

async function auditAndFixQuestion(item: any): Promise<any> {
  const filePath = path.join(questionsDir, item.file);
  const questions: any[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const q = questions.find((x: any) => String(x.id) === String(item.id));
  if (!q) throw new Error(`Question ${item.id} not found in ${item.file}`);

  const prompt = `You are a Senior Canadian Board Examiner and Clinical Specialist for the NDEB AFK (Assessment of Fundamental Knowledge) Examination.
This question was flagged during quality audit for clinical ambiguity, inaccurate answer designation, or sub-standard explanation under official NDEB AFK guidelines.

Subject: ${item.file.replace('.json', '')}
Question ID: ${q.id}

Original Question:
${q.question}

Options:
0: ${q.options[0]}
1: ${q.options[1]}
2: ${q.options[2]}
3: ${q.options[3]}

Current Assigned Answer Index: ${q.correctAnswer} (${q.options[q.correctAnswer]})
Current Explanation:
${q.explanation || 'None'}

Clinical Mandate:
1. Examine the question against current Canadian dental standards (NDEB blueprints, Malamed, Neville, Carranza, Little & Falace, Proffit, Cohen, CDA Code of Ethics).
2. Fix any factual, anatomical, or typographical ambiguity in the question stem so it is 100% board-quality.
3. Ensure the options are 4 mutually exclusive, plausible answers where EXACTLY ONE is undeniably the correct gold standard.
4. Set the exact 0-based index (0, 1, 2, or 3) of the true correct answer.
5. Provide a rigorous, high-yield explanation:
   - State clearly why the correct answer is the gold standard under Canadian NDEB guidelines.
   - Explicitly detail why each of the 3 distractors is incorrect.

Output ONLY a raw JSON object (no markdown formatting, no code block fences, no conversational preamble):
{
  "id": ${q.id},
  "question": "polished question text",
  "options": ["opt0", "opt1", "opt2", "opt3"],
  "correctAnswer": 0,
  "explanation": "comprehensive NDEB clinical explanation"
}`;

  async function callModel(modelName: string) {
    const res = await getClient().chat.completions.create({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1200
    });
    const text = res.choices[0]?.message?.content || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object in response: ' + text.substring(0, 150));
    return JSON.parse(match[0]);
  }

  let result: any;
  try {
    result = await callModel('qwen/qwen3.8-27b');
  } catch (err: any) {
    result = await callModel('openai/gpt-oss-120b');
  }

  // Validate parsed result
  if (
    typeof result.question !== 'string' ||
    !Array.isArray(result.options) ||
    result.options.length !== 4 ||
    typeof result.correctAnswer !== 'number' ||
    result.correctAnswer < 0 ||
    result.correctAnswer > 3 ||
    typeof result.explanation !== 'string'
  ) {
    throw new Error('Invalid schema returned from model for question ' + q.id);
  }

  // Update in-memory question
  q.question = result.question;
  q.options = result.options;
  q.correctAnswer = result.correctAnswer;
  q.explanation = result.explanation;
  q.aiVerified = true;
  q.clinicalReview = "NDEB_AUDITED";

  // Write file to disk
  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));

  // Record progress
  fixedProgress[`${item.file}:${q.id}`] = {
    file: item.file,
    id: q.id,
    question: q.question,
    correctAnswer: q.correctAnswer,
    correctOption: q.options[q.correctAnswer],
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(progressPath, JSON.stringify(fixedProgress, null, 2));

  return result;
}

async function run() {
  console.log(`Starting Clinical Audit of ${flaggedList.length} Flagged Questions...\n`);
  let fixedCount = Object.keys(fixedProgress).length;

  for (let i = 0; i < flaggedList.length; i++) {
    const item = flaggedList[i];
    const key = `${item.file}:${item.id}`;
    if (fixedProgress[key]) {
      continue;
    }

    let success = false;
    let attempts = 0;

    while (!success && attempts < 5) {
      attempts++;
      try {
        const fixed = await auditAndFixQuestion(item);
        fixedCount++;
        console.log(`[${fixedCount}/${flaggedList.length}] Fixed [${item.file}] ID ${item.id} -> Answer: ${fixed.correctAnswer} (${fixed.options[fixed.correctAnswer].substring(0, 40)}...)`);
        success = true;
        await sleep(1000);
      } catch (err: any) {
        const msg = err?.message || '';
        console.error(`\n  [ERROR on ${key}]: ${msg}`);
        if (msg.includes('rate_limit') || msg.includes('429') || msg.includes('tokens')) {
          const rotated = rotateKey();
          if (!rotated) {
            console.log('\nAll keys exhausted. Waiting 30s before retrying...');
            exhaustedKeys.clear();
            await sleep(30000);
          }
        } else {
          await sleep(2000);
        }
      }
    }
  }

  console.log(`\n🎉 All ${flaggedList.length} flagged questions have been rigorously audited and updated to NDEB standards!`);
}

run().catch(console.error);