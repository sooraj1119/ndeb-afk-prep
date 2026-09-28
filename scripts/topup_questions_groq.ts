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

const MIN_CLINICAL_PCT = 0.70;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const CLINICAL_PATTERN = /patient presents|patient reports|patient complains|year.old|patient has|presents to|brought to|referred|a \d+.year/i;
const FORBIDDEN_PATTERN = /all of the above|none of the above|both a and b/i;

function isClinical(q: any): boolean {
  return CLINICAL_PATTERN.test(q.question);
}

function validateQuestion(q: any): boolean {
  if (!q.question || typeof q.question !== 'string' || q.question.trim().length < 20) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer > 3) return false;
  if (!q.explanation || q.explanation.trim().length < 50) return false;
  if (q.options.some((o: string) => FORBIDDEN_PATTERN.test(o))) return false;
  return true;
}

function deduplicateQuestions(questions: any[]): any[] {
  const seen = new Set<string>();
  return questions.filter(q => {
    const fingerprint = q.question.toLowerCase().replace(/[^a-z0-9 ]/g, '').substring(0, 100);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

function generateId() { return Math.floor(Math.random() * 1000000000); }

function buildPrompt(topicName: string, requestCount: number, existingStems: string): string {
  const minClinical = Math.ceil(requestCount * 0.70);
  return `You are a highly strict examiner writing questions for the NDEB AFK (National Dental Examining Board of Canada) exam.

Generate exactly ${requestCount} unique multiple-choice questions for the topic: "${topicName}".

MANDATORY GUIDELINES:
1. CLINICAL SCENARIOS: At least ${minClinical} questions MUST be clinical scenarios starting with "A [age]-year-old [gender] patient presents...".
2. OPTIONS: Exactly 4 options per question. ONE definitively correct answer. NO "All of the above" or "None of the above".
3. EXPLANATION: Must contain 2-3 sentences explaining WHY the answer is correct and WHY distractors are wrong.
4. NO DUPLICATES: Do not repeat any of these existing questions:
${existingStems || '(none yet)'}

OUTPUT FORMAT:
You MUST output a valid JSON object with a single key "questions" containing an array of objects. Do not use markdown blocks.
Example:
{
  "questions": [
    {
      "question": "Full question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation here."
    }
  ]
}`;
}

async function run() {
  const questionsDir = path.join(process.cwd(), 'public', 'questions');
  const files = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

  const manifestPath = path.join(questionsDir, 'manifest.json');
  let manifest: any[] = [];
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }

  for (const file of files) {
    const filePath = path.join(questionsDir, file);
    const topicId = file.replace('.json', '');
    
    const topicName = topicId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    let questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    questions = deduplicateQuestions(questions);

    let targetCount = 500;
    if (questions.length > 550) targetCount = 1000;

    let needed = targetCount - questions.length;
    if (needed <= 0) {
      console.log(`[${topicId}] Already full (${questions.length}/${targetCount}). Skipping.`);
      const mItem = manifest.find((m: any) => m.id === topicId);
      if (mItem) mItem.count = questions.length;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      continue;
    }

    console.log(`\nStarting ${topicId} (${topicName}). Currently ${questions.length}/${targetCount} - needs ${needed} more.`);

    while (needed > 0) {
      const requestCount = Math.min(needed, 8);
      console.log(`[${topicId}] Requesting batch of ${requestCount} via Groq... | Key ${keyIndex + 1}/4`);

      const existingStems = questions.slice(-40).map((q: any, i: number) =>
        `${i + 1}. ${q.question.substring(0, 90)}`
      ).join('\n');

      const prompt = buildPrompt(topicName, requestCount, existingStems);

      try {
        const response = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'qwen/qwen3.8-27b',
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content || '{"questions":[]}';
        let parsed: any;
        try {
            parsed = JSON.parse(content);
        } catch(e) {
            console.log("Failed to parse JSON. Retrying...");
            await sleep(2000);
            continue;
        }

        const rawArray = parsed.questions || [];
        if (!Array.isArray(rawArray) || rawArray.length === 0) throw new Error('Invalid array returned');

        const valid = rawArray.filter((q: any) => validateQuestion(q));
        const clinicalCount = valid.filter((q: any) => isClinical(q)).length;
        const clinicalPct = valid.length > 0 ? clinicalCount / valid.length : 0;

        console.log(`[${topicId}] Batch received: ${rawArray.length} items, ${valid.length} valid, ${clinicalCount} clinical (${(clinicalPct * 100).toFixed(0)}%)`);

        if (clinicalPct < MIN_CLINICAL_PCT && requestCount > 2) {
          console.log(`[${topicId}] REJECTED: Only ${(clinicalPct * 100).toFixed(0)}% clinical (need >=70%). Retrying...`);
          await sleep(2000);
          continue;
        }

        let added = 0;
        for (const q of valid) {
          if (needed <= 0) break;
          questions.push({
            id: generateId(),
            topicId: topicId,
            question: q.question.trim(),
            options: q.options.map((o: string) => o.trim()),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation.trim(),
            aiVerified: true,
            aiGenerated: true
          });
          needed--;
          added++;
        }

        questions = deduplicateQuestions(questions);
        needed = targetCount - questions.length;

        fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));

        const mItem = manifest.find((m: any) => m.id === topicId);
        if (mItem) mItem.count = questions.length;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        console.log(`[${topicId}] +${added} added. Total: ${questions.length}/${targetCount}. Remaining: ${needed}`);
        if (needed > 0) await sleep(2000);

      } catch (e: any) {
        if (e?.status === 429) {
          keyIndex++;
          if (keyIndex >= keys.length) {
            console.log('\n[!] All Groq keys exhausted! Sleeping for 60 seconds to reset quotas...');
            await sleep(60000);
            keyIndex = 0;
          }
          console.log(`\n  [KEY ROTATION] Switching to Groq key ${keyIndex + 1} of ${keys.length}`);
          groq = new Groq({ apiKey: keys[keyIndex] });
        } else {
          console.log(`Error: ${e?.message || e}. Retrying in 5s...`);
          await sleep(5000);
        }
      }
    }

    console.log(`\nDone with ${topicId}! Total: ${questions.length}`);
  }

  console.log('\nALL TOP-UPS COMPLETED!');
}

run().catch(console.error);
