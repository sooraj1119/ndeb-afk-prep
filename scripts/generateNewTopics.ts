import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
const apiKey = process.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });
const targetCount = 500;

const topicsToFill = [
  { id: 'oral-surgery', promptTopic: 'Oral Surgery' },
  { id: 'implants', promptTopic: 'Dental Implants' },
  { id: 'emergencies', promptTopic: 'Dental and Medical Emergencies in the Dental Office' },
  { id: 'orthodontics', promptTopic: 'Orthodontics' },
  { id: 'pedodontics', promptTopic: 'Pedodontics / Paediatric Dentistry' },
  { id: 'infection-control', promptTopic: 'Prevention and Infection Control in Dentistry' },
];

function generateId() { return Math.floor(Math.random() * 1000000000); }
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function deduplicateQuestions(questions: any[]): any[] {
  const seen = new Set<string>();
  return questions.filter(q => {
    const fingerprint = q.question.toLowerCase().replace(/[^a-z0-9 ]/g, '').substring(0, 80);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

async function run() {
  for (const t of topicsToFill) {
    const questionsFile = path.resolve(`public/questions/${t.id}.json`);
    let questions: any[] = [];
    if (fs.existsSync(questionsFile)) {
      questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));
    }

    questions = deduplicateQuestions(questions);

    let needed = targetCount - questions.length;
    if (needed <= 0) {
      console.log(`[${t.id}] Already full (${questions.length}). Skipping.`);
      continue;
    }

    console.log(`\nStarting ${t.id}. Currently ${questions.length}/500 — needs ${needed} more.`);
    const batchSize = 20;

    while (needed > 0) {
      const fetchCount = Math.min(needed, batchSize);
      console.log(`[${t.id}] Requesting batch of ${fetchCount}...`);

      const existingStems = questions.slice(-60).map((q: any, i: number) => `${i + 1}. ${q.question.substring(0, 80)}`).join('\n');

      const prompt = `You are a strict expert examiner writing questions for the NDEB AFK (National Dental Examining Board of Canada — Assessment of Fundamental Knowledge) exam.

Generate exactly ${fetchCount} unique multiple-choice questions for the topic: "${t.promptTopic}".

══ MANDATORY FORMAT RULES (NDEB strict guidelines) ══

1. CLINICAL SCENARIOS: At least 60% of questions must follow this format:
   "A [age]-year-old [male/female] patient presents with [chief complaint]. [Relevant history/findings]. [Clinical/radiographic findings if applicable]. What is the MOST appropriate [diagnosis / management / next step]?"

2. THEORETICAL QUESTIONS: Remaining 40% may be direct knowledge questions about mechanisms, pharmacology, anatomy, or standards.

3. SINGLE BEST ANSWER: Exactly 4 options (A–D). ONE is definitively correct. Others must be plausible clinical misconceptions — NOT obvious wrong answers.

4. STRICTLY FORBIDDEN: "All of the above", "None of the above", "Both A and B", joke options.

5. EXPLANATION: Must be exactly 2–3 sentences that:
   - State WHY the correct answer is right (cite mechanism, guideline, or Canadian dental standard)
   - Explain WHY at least 2 distractors are wrong

6. NO DUPLICATES: Do NOT repeat or closely paraphrase any of these already-existing question stems:
${existingStems || '(none yet)'}

7. RANDOMISE CORRECT ANSWER POSITION: Spread correct answers evenly across positions 0, 1, 2, 3. Do NOT cluster correct answers at position 1 or 2.

8. OUTPUT: Return a RAW JSON array ONLY. No markdown. No commentary. No code fences.

Schema for each object:
{
  "question": "Full question text here",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correctAnswer": 0,
  "explanation": "2-3 sentences explaining the answer and rejecting distractors."
}`;

      let retries = 15;
      let success = false;

      while (!success && retries > 0) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              temperature: 0.85,
              responseMimeType: 'application/json',
            },
          });

          let text = response.text || '[]';
          let parsed: any[] = JSON.parse(text);
          if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid array returned');

          let added = 0;
          for (const q of parsed) {
            if (needed <= 0) break;
            if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) continue;
            if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer > 3) continue;
            if (!q.explanation || q.explanation.trim().length < 30) continue;
            const forbidden = /all of the above|none of the above|both a and b/i;
            if (q.options.some((o: string) => forbidden.test(o))) continue;

            questions.push({
              id: generateId(),
              topicId: t.id,
              question: q.question.trim(),
              options: q.options.map((o: string) => o.trim()),
              correctAnswer: q.correctAnswer,
              explanation: q.explanation.trim(),
            });
            needed--;
            added++;
          }

          questions = deduplicateQuestions(questions);
          needed = targetCount - questions.length;

          success = true;
          fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));

          const manifestPath = path.resolve('public/questions/manifest.json');
          let manifest: any[] = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          const mItem = manifest.find((m: any) => m.id === t.id);
          if (mItem) mItem.count = questions.length;
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

          console.log(`[${t.id}] +${added} added. Total: ${questions.length}/500. Remaining: ${needed}`);
          if (needed > 0) await sleep(15000);

        } catch (e: any) {
          if (e?.status === 429 || e?.status === 503) {
            console.log(`Rate limit hit. Waiting 90s...`);
            await sleep(90000);
            retries--;
          } else {
            console.log(`Error: ${e?.message}. Retrying in 10s...`);
            retries--;
            await sleep(10000);
          }
        }
      }

      if (!success) {
        console.log(`Failed after retries on ${t.id}. Saving progress and stopping.`);
        process.exit(1);
      }
    }

    console.log(`✅ Done with ${t.id}! Total: ${questions.length}`);
  }

  console.log('\n🎉 ALL TOPICS COMPLETED.');
}

run();
