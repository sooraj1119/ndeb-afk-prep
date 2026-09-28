import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
const apiKey = process.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });
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

MANDATORY NDEB STRICT GUIDELINES:
RULE 1 - CLINICAL SCENARIOS: At least ${minClinical} of ${requestCount} questions MUST be clinical scenarios starting with "A [age]-year-old [gender] patient presents...".
RULE 2 - ANSWER OPTIONS: Exactly 4 options per question. ONE definitively correct answer. NO "All of the above" or "None of the above". Distribute correct answers evenly.
RULE 3 - EXPLANATION: Must contain 2-3 sentences explaining WHY the correct answer is right and why at least 2 of the wrong options are incorrect.
RULE 4 - NO DUPLICATES: Do NOT repeat any of these existing questions:
${existingStems || '(none yet)'}

OUTPUT: Return a RAW JSON array ONLY. No markdown. No commentary.`;
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
    
    // Create readable topic name from filename (e.g. operative-dentistry -> Operative Dentistry)
    const topicName = topicId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    let questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    questions = deduplicateQuestions(questions);

    // Determine target based on current count
    let targetCount = 500;
    if (questions.length > 550) {
      targetCount = 1000;
    }

    let needed = targetCount - questions.length;
    if (needed <= 0) {
      console.log(`[${topicId}] Already full (${questions.length}/${targetCount}). Skipping.`);
      
      // Ensure manifest is up to date even if we skip
      const mItem = manifest.find((m: any) => m.id === topicId);
      if (mItem) mItem.count = questions.length;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      continue;
    }

    console.log(`\nStarting ${topicId} (${topicName}). Currently ${questions.length}/${targetCount} - needs ${needed} more.`);

    while (needed > 0) {
      const requestCount = Math.min(needed, 10); // Request exact amount up to 10 at a time
      console.log(`[${topicId}] Requesting batch of ${requestCount} via Gemini...`);

      const existingStems = questions.slice(-40).map((q: any, i: number) =>
        `${i + 1}. ${q.question.substring(0, 90)}`
      ).join('\n');

      const prompt = buildPrompt(topicName, requestCount, existingStems);

      let retries = 10;
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

          const valid = parsed.filter((q: any) => validateQuestion(q));
          const clinicalCount = valid.filter((q: any) => isClinical(q)).length;
          const clinicalPct = valid.length > 0 ? clinicalCount / valid.length : 0;

          console.log(`[${topicId}] Batch: ${parsed.length} received, ${valid.length} valid, ${clinicalCount} clinical (${(clinicalPct * 100).toFixed(0)}%)`);

          if (clinicalPct < MIN_CLINICAL_PCT && requestCount > 2) {
            console.log(`[${topicId}] REJECTED: Only ${(clinicalPct * 100).toFixed(0)}% clinical. Retrying...`);
            retries--;
            await sleep(5000);
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

          success = true;
          fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));

          const mItem = manifest.find((m: any) => m.id === topicId);
          if (mItem) mItem.count = questions.length;
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

          console.log(`[${topicId}] +${added} added. Total: ${questions.length}/${targetCount}. Remaining: ${needed}`);
          if (needed > 0) await sleep(10000);

        } catch (e: any) {
          if (e?.status === 429 || e?.status === 503 || e?.message?.includes('429')) {
            console.log(`Rate limit hit on Gemini. Waiting 60s...`);
            await sleep(60000);
            retries--;
          } else {
            console.log(`Error: ${e?.message || e}. Retrying in 10s...`);
            retries--;
            await sleep(10000);
          }
        }
      }

      if (!success) {
        console.log(`Failed after retries on ${topicId}. Skipping to next topic.`);
        break; // skip to next topic instead of exiting completely
      }
    }
  }

  console.log('\nALL TOP-UPS COMPLETED!');
}

run().catch(console.error);
