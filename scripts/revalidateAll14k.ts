import fs from 'fs';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const apiKeys = Object.keys(process.env)
  .filter(k => k.startsWith('VITE_GROQ_API_KEY'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map(k => process.env[k])
  .filter(Boolean) as string[];

if (apiKeys.length === 0) {
  console.error("No Groq API keys found!");
  process.exit(1);
}
console.log(`Loaded ${apiKeys.length} API key(s) for 14,000 question validation audit.\n`);

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
const progressPath = path.resolve('scratch/revalidation_progress.json');
const flaggedPath = path.resolve('scratch/revalidation_flagged.json');

const files = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const progress: Record<string, boolean> = fs.existsSync(progressPath)
  ? JSON.parse(fs.readFileSync(progressPath, 'utf8'))
  : {};

const flagged: any[] = fs.existsSync(flaggedPath)
  ? JSON.parse(fs.readFileSync(flaggedPath, 'utf8'))
  : [];

async function verifyBatch(batch: any[]): Promise<{ id: string | number; isCorrect: boolean }[]> {
  const prompt = `You are a Senior Canadian Board Examiner for the NDEB AFK (Assessment of Fundamental Knowledge) exam.
Evaluate each question below, including its designated correct answer and clinical explanation, against official NDEB AFK guidelines (Malamed, Neville, Carranza, Proffit, Cohen, Little & Falace, CDA Code of Ethics).

Rules:
1. Mark isCorrect: true if the designated answer and explanation are clinically and scientifically sound according to dental standards.
2. Mark isCorrect: false ONLY if the designated answer is demonstrably incorrect, misleading, or contradicted by medical evidence.

Return ONLY a valid JSON array matching this exact format, with NO code fences, NO markdown, NO preamble:
[{"id":123,"isCorrect":true},{"id":456,"isCorrect":false}]

Questions:
${batch.map(q => `ID: ${q.id}
Q: ${q.question}
Options: [0: ${q.options[0]}, 1: ${q.options[1]}, 2: ${q.options[2]}, 3: ${q.options[3]}]
Designated Answer: Index ${q.correctAnswer} (${q.options[q.correctAnswer]})
Explanation: ${q.explanation ? q.explanation.substring(0, 250) : 'None'}
---`).join('\n')}`;

  async function tryModel(modelName: string) {
    const response = await getClient().chat.completions.create({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.0,
      max_tokens: 600,
    });
    const text = response.choices[0]?.message?.content || '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array in response: ' + text.substring(0, 150));
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid array response');
    return parsed;
  }

  try {
    return await tryModel('qwen/qwen3.8-27b');
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('rate_limit') || msg.includes('429') || msg.includes('tokens') || msg.includes('TPD')) {
      throw err;
    }
    return await tryModel('openai/gpt-oss-20b');
  }
}

async function run() {
  console.log("Starting Full 14,000 Questions Re-Validation Audit with Groq...\n");
  const BATCH_SIZE = 10;
  let totalVerified = Object.keys(progress).length;
  let totalFlagged = flagged.length;

  console.log(`Current status: ${totalVerified}/14000 verified, ${totalFlagged} flagged.\n`);

  while (true) {
    let pendingQuestionsFound = false;

    for (const file of files) {
      const filePath = path.join(questionsDir, file);
      let questions: any[];
      try {
        questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        continue;
      }

      const pending = questions.filter(q => progress[`${file}:${q.id}`] === undefined);
      if (pending.length === 0) {
        continue;
      }

      pendingQuestionsFound = true;
      console.log(`\n[${file}] Auditing ${pending.length} pending questions (of ${questions.length} total)...`);

      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        const batch = pending.slice(i, i + BATCH_SIZE);
        let success = false;

        while (!success) {
          try {
            const results = await verifyBatch(batch);

            for (const res of results) {
              const q = questions.find(item => String(item.id) === String(res.id));
              if (!q) continue;

              const isCorrect = Boolean(res.isCorrect);
              progress[`${file}:${q.id}`] = isCorrect;

              if (!isCorrect) {
                totalFlagged++;
                flagged.push({
                  file,
                  id: q.id,
                  question: q.question,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation
                });
                console.log(`\n  ⚠ FLAGGED [${file}] ID ${q.id}: Answer index ${q.correctAnswer} (${q.options[q.correctAnswer]})`);
              }
            }

            totalVerified += batch.length;
            fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
            fs.writeFileSync(flaggedPath, JSON.stringify(flagged, null, 2));

            process.stdout.write(`\r  Verified: ${totalVerified}/14000 | Flagged: ${totalFlagged} | Key ${currentKeyIndex + 1}/${apiKeys.length}`);
            await sleep(300);
            success = true;

          } catch (error: any) {
            const msg = error?.message || '';

            if (msg.includes('rate_limit') || msg.includes('429') || msg.includes('tokens') || msg.includes('TPD')) {
              const rotated = rotateKey();
              if (!rotated) {
                console.log('\n  All keys on cooldown. Waiting 15s for next rolling window...');
                exhaustedKeys.clear();
                currentKeyIndex = 0;
                await sleep(15000);
              }
            } else {
              console.error(`\n  [API ERROR]: ${msg.substring(0, 100)}`);
              await sleep(3000);
            }
          }
        }
      }
    }

    if (!pendingQuestionsFound) {
      break;
    }
  }

  console.log(`\n\n🎉 Full Re-Validation Audit Complete!`);
  console.log(`Total questions checked: ${totalVerified}/14000`);
  console.log(`Total flagged questions: ${totalFlagged}`);
  console.log(`Report saved to scratch/revalidation_flagged.json`);
}

run().catch(console.error);