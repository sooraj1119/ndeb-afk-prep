import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
  console.error('Error: Please set a valid VITE_GEMINI_API_KEY in your .env.local file.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const questionsFile = path.resolve('src/lib/questions.json');
let questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));

// The topics that need exactly 100 questions.
// Note: Some topics already have > 0 but < 100 questions. We will calculate the diff.
const targetCount = 100;
const topicsToFill = [
  "anatomy",
  "pharmacology",
  "biochemistry",
  "microbiology",
  "dental-materials",
  "periodontology",
  "oral-pathology",
  "radiology"
];

// Helper to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a unique ID
function generateId() {
  return Math.floor(Math.random() * 1000000000);
}

async function run() {
  let totalGenerated = 0;
  
  for (const topicId of topicsToFill) {
    const currentCount = questions.filter((q: any) => q.topicId === topicId).length;
    let needed = targetCount - currentCount;
    
    if (needed <= 0) {
      console.log(`Topic '${topicId}' already has ${currentCount} questions. Skipping.`);
      continue;
    }
    
    console.log(`\nTopic '${topicId}' needs ${needed} more questions to reach ${targetCount}.`);
    
    // We will batch generation in chunks of 20 to avoid output token limits.
    const batchSize = 20;
    
    while (needed > 0) {
      const fetchCount = Math.min(needed, batchSize);
      console.log(`Fetching batch of ${fetchCount} highly realistic NDEB AFK questions for '${topicId}'...`);
      
      const prompt = `You are a strict, expert examiner for the NDEB AFK (National Dental Examining Board of Canada - Assessment of Fundamental Knowledge) exam.
You must generate exactly ${fetchCount} highly realistic, challenging, and medically accurate multiple-choice questions for the topic of "${topicId}".

REQUIREMENTS:
1. The questions MUST perfectly simulate the style, difficulty, and format of the real NDEB AFK exam.
2. Provide EXACTLY 4 options for each question.
3. Provide the correct answer index (0-3).
4. Provide a 2-3 sentence tutor explanation of why the correct answer is right and the others are wrong.
5. Return the output as a RAW JSON array of objects. Do NOT use markdown code blocks (\`\`\`json). Just return the raw array.

Format for each object:
{
  "question": "The question text...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why A is correct and B,C,D are wrong."
}`;

      let success = false;
      let retries = 3;
      
      while (!success && retries > 0) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                responseMimeType: "application/json"
            }
          });
          
          let text = response.text || "[]";
          let parsed: any[] = [];
          
          try {
              parsed = JSON.parse(text);
          } catch (e) {
              console.log("JSON Parse failed, retrying...");
              retries--;
              await sleep(2000);
              continue;
          }
          
          if (!Array.isArray(parsed) || parsed.length === 0) {
              console.log("Invalid array returned, retrying...");
              retries--;
              await sleep(2000);
              continue;
          }
          
          // Map and inject IDs
          for (const q of parsed) {
              if (needed > 0) {
                  questions.push({
                      id: generateId(),
                      topicId: topicId,
                      question: q.question,
                      options: q.options,
                      correctAnswer: q.correctAnswer,
                      explanation: q.explanation
                  });
                  needed--;
                  totalGenerated++;
              }
          }
          
          success = true;
          
          // Save progress
          fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
          console.log(`Saved progress. Added batch. Remaining for ${topicId}: ${needed}`);
          
          // Sleep for 15 seconds to avoid API RPM limits
          console.log("Sleeping for 15 seconds to respect rate limits...");
          await sleep(15000);
          
        } catch (error: any) {
          if (error?.status === 429) {
             console.log(`Rate limit hit! Waiting 60 seconds before retrying (Retries left: ${retries - 1})...`);
             await sleep(60000); // Wait 60 seconds
             retries--;
          } else {
            console.error(`\nError generating batch:`, error);
            retries--;
            await sleep(5000);
          }
        }
      }
      
      if (!success) {
         console.log(`Failed to generate a batch for ${topicId} after multiple retries. Saving progress and exiting.`);
         fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
         process.exit(1);
      }
    }
  }
  
  console.log(`\nSuccess! Generated a total of ${totalGenerated} authentic NDEB AFK questions. All topics now have 100+ questions.`);
}

run();
