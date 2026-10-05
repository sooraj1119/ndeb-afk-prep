import fs from 'fs';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const apiKeys = [
  process.env.VITE_GROQ_API_KEY,
  process.env.VITE_GROQ_API_KEY_2,
  process.env.VITE_GROQ_API_KEY_3,
  process.env.VITE_GROQ_API_KEY_4,
  process.env.VITE_GROQ_API_KEY_5,
].filter(Boolean) as string[];

if (apiKeys.length === 0) { console.error("No Groq API keys found!"); process.exit(1); }
console.log(`Loaded ${apiKeys.length} API key(s). Rotation enabled.\n`);

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

const questionsDir = path.resolve('public/questions');
const flaggedPath = path.resolve('scratch/flagged_questions.json');
const files = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const flagged: any[] = fs.existsSync(flaggedPath) ? JSON.parse(fs.readFileSync(flaggedPath, 'utf8')) : [];

async function verifyBatch(batch: any[]): Promise<{ id: string; isCorrect: boolean }[]> {
  const prompt = `You are a Master NDEB (National Dental Examining Board of Canada) examiner for the AFK (Assessment of Fundamental Knowledge) exam. 
For each question, STRICTLY evaluate if the designated correct answer is medically and scientifically accurate according to official NDEB AFK guidelines and current dental standards.
If there is ANY doubt, ambiguity, or if multiple answers could be considered correct under AFK standards, mark it as false.

Return ONLY a valid JSON array, no markdown, no explanation:
[{"id":"<id>","isCorrect":true},{"id":"<id>","isCorrect":false}]

${batch.map(q => `ID: ${q.id}
Q: ${q.question}
0: ${q.options[0]}
1: ${q.options[1]}
2: ${q.options[2]}
3: ${q.options[3]}
Correct Index: ${q.correctAnswer}
---`).join('\n')}`;

  const response = await getClient().chat.completions.create({
    model: 'qwen/qwen3.8-27b',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.0,
    max_tokens: 512,
  });

  const text = response.choices[0]?.message?.content || '[]';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array in response: ' + text.substring(0, 200));
  return JSON.parse(match[0]);
}

async function run() {
  console.log("Starting Groq 5-Key Rotating AI Audit (10 per batch, 1s pacing)...\n");
  const BATCH_SIZE = 10;
  let totalVerified = 0;
  let totalFlagged = 0;

  for (const file of files) {
    const filePath = path.join(questionsDir, file);
    let questions: any[];
    try { questions = JSON.parse(fs.readFileSync(filePath, 'utf8')); }
    catch (e) { continue; }

    const unverified = questions.filter(q => !q.aiVerified);
    if (unverified.length === 0) { console.log(`[${file}] All verified. Skipping.`); continue; }
    console.log(`\n[${file}] Checking ${unverified.length} questions...`);

    for (let i = 0; i < unverified.length; i += BATCH_SIZE) {
      const batch = unverified.slice(i, i + BATCH_SIZE);
      let success = false;

      while (!success) {
        try {
          const results = await verifyBatch(batch);

          for (const res of results) {
            const q = questions.find(item => String(item.id) === String(res.id));
            if (!q) continue;
            q.aiVerified = true;
            if (!res.isCorrect) {
              totalFlagged++;
              flagged.push({ file, id: q.id, question: q.question, correctAnswer: q.correctAnswer, options: q.options });
              console.log(`\n  FLAGGED [${file}] ID ${q.id}`);
            }
          }

          fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
          fs.writeFileSync(flaggedPath, JSON.stringify(flagged, null, 2));
          totalVerified += batch.length;
          process.stdout.write(`\r  Progress: ${totalVerified} verified, ${totalFlagged} flagged | Key ${currentKeyIndex + 1}/${apiKeys.length}`);

          await sleep(1000);
          success = true;

        } catch (error: any) {
          const msg = error?.message || '';
          const isDaily = msg.includes('tokens per day') || msg.includes('TPD');
          const isMinute = msg.includes('per minute') || msg.includes('OTPM');
          const isInvalid = error?.status === 401 || msg.includes('Invalid API Key') || msg.includes('invalid_api_key');

          if (isDaily || isInvalid) {
            console.log(`\n  [KEY ${currentKeyIndex + 1}] Exhausted or Invalid (401). Rotating...`);
            const rotated = rotateKey();
            if (!rotated) {
              console.log('\n  All keys exhausted for today. Stopping. Run again tomorrow.');
              process.exit(0);
            }
          } else if (isMinute) {
            console.log(`\n  [RATE] Per-minute limit. Waiting 15s...`);
            await sleep(15000);
          } else {
            console.log(`\n  [ERROR] ${error?.status || ''}: ${msg.substring(0, 120)} - Waiting 10s...`);
            await sleep(10000);
          }
        }
      }
    }
  }

  console.log(`\n\nFull Audit Complete! ${totalVerified} verified, ${totalFlagged} flagged.`);
}

run();