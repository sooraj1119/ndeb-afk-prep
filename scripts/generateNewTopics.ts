import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
const apiKey = process.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });
const targetCount = 500;
const MIN_CLINICAL_PCT = 0.65; // Strict: 65% must be clinical scenarios

const topicsToFill = [
  { id: 'infection-control', promptTopic: 'Prevention and Infection Control in Dentistry' },
];

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
  if (!q.explanation || q.explanation.trim().length < 80) return false;
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
  const minClinical = Math.ceil(requestCount * 0.65);
  return `You are a highly strict examiner writing questions for the NDEB AFK (National Dental Examining Board of Canada - Assessment of Fundamental Knowledge) exam.

Generate exactly ${requestCount} unique multiple-choice questions for the topic: "${topicName}".

==========================
MANDATORY NDEB STRICT GUIDELINES
==========================

RULE 1 - CLINICAL SCENARIOS (MANDATORY: at least ${minClinical} of ${requestCount} questions MUST be clinical):
Each clinical question MUST follow this format:
"A [specific age]-year-old [male/female] patient presents to your dental office with [specific chief complaint]. [Relevant medical/dental history]. [Key clinical or radiographic findings]. What is the MOST appropriate [diagnosis / management / next step]?"

RULE 2 - THEORY QUESTIONS (maximum 25% of batch):
Remaining questions may be direct knowledge questions about mechanisms, pharmacology, anatomy, or Canadian dental standards. Must still be at exam difficulty level.

RULE 3 - ANSWER OPTIONS:
- Exactly 4 options per question
- ONE definitively correct answer
- All 3 wrong options must be plausible clinical misconceptions, NOT obviously wrong
- STRICTLY FORBIDDEN in any option: "All of the above", "None of the above", "Both A and B"
- Distribute correct answer positions evenly across 0, 1, 2, 3 â€” do NOT cluster at position 1 or 2

RULE 4 - EXPLANATION (MANDATORY, minimum 100 characters):
Must contain exactly 2-3 sentences that:
  a) State WHY the correct answer is right (cite mechanism, guideline, or Canadian dental standard)
  b) Explicitly explain why at least 2 of the wrong options are incorrect

RULE 5 - NO DUPLICATES:
Do NOT repeat or closely paraphrase any of these existing question stems:
${existingStems || '(none yet)'}

RULE 6 - OUTPUT:
Return a RAW JSON array ONLY. No markdown. No code fences. No commentary.

Schema for each object:
{
  "question": "Full question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "2-3 sentences explaining correctness and rejecting 2+ distractors."
}`;
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

    console.log(`\nStarting ${t.id}. Currently ${questions.length}/500 â€” needs ${needed} more.`);

    while (needed > 0) {
      const requestCount = Math.min(needed + 6, 20); // Request slightly more to account for filtering
      console.log(`[${t.id}] Requesting batch of ${requestCount} (strict clinical mode)...`);

      const existingStems = questions.slice(-60).map((q: any, i: number) =>
        `${i + 1}. ${q.question.substring(0, 90)}`
      ).join('\n');

      const prompt = buildPrompt(t.promptTopic, requestCount, existingStems);

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

          // Validate every question strictly
          const valid = parsed.filter((q: any) => validateQuestion(q));
          const clinicalCount = valid.filter((q: any) => isClinical(q)).length;
          const clinicalPct = valid.length > 0 ? clinicalCount / valid.length : 0;

          console.log(`[${t.id}] Batch: ${parsed.length} received, ${valid.length} valid, ${clinicalCount} clinical (${(clinicalPct * 100).toFixed(0)}%)`);

          // Enforce 75% clinical â€” retry batch if not met
          
          let finalBatch = [];
          if (clinicalPct >= MIN_CLINICAL_PCT) {
            finalBatch = valid;
          } else {
            const clinicalQs = valid.filter((q) => isClinical(q));
            const theoryQs = valid.filter((q) => !isClinical(q));
            const allowedTheory = Math.floor(clinicalQs.length * (1 - MIN_CLINICAL_PCT) / MIN_CLINICAL_PCT);
            finalBatch = [...clinicalQs, ...theoryQs.slice(0, allowedTheory)];
            console.log('[' + t.id + '] ADAPTED: Batch was ' + (clinicalPct*100).toFixed(0) + '%. Kept ' + clinicalQs.length + ' clinical and ' + (finalBatch.length - clinicalQs.length) + ' theory to hit 65%+');
          }


          let added = 0;
          for (const q of finalBatch) {
            if (needed <= 0) break;
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
          const manifest: any[] = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
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
            console.log(`Error: ${e?.message || e}. Retrying in 10s...`);
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

    console.log(`âœ… Done with ${t.id}! Total: ${questions.length}`);
  }

  console.log('\nðŸŽ‰ ALL TOPICS COMPLETED.');
}

run();

