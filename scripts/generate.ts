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

// Helper to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  let generatedCount = 0;
  
  const totalMissing = questions.filter((q: any) => !q.explanation).length;
  console.log(`Found ${totalMissing} questions that need explanations.`);
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    // Only generate if there isn't an explanation already
    if (!q.explanation) {
      console.log(`[${generatedCount + 1}/${totalMissing}] Generating explanation for Question ${q.id} ("${q.question.substring(0, 30)}...")...`);
      
      const prompt = `You are an expert dental tutor helping a student prepare for the NDEB AFK exam.
The student answered a multiple-choice question incorrectly.
Question: "${q.question}"
Correct Answer: "${q.options[q.correctAnswer]}"

In 2-3 concise sentences, explain WHY the correct answer is right and the other options are wrong. Be encouraging and medically accurate.`;

      let success = false;
      let retries = 3;
      
      while (!success && retries > 0) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          
          q.explanation = response.text;
          generatedCount++;
          success = true;
          
          // Save every 5 generations to not lose progress
          if (generatedCount % 5 === 0) {
            fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
            console.log(`Saved progress (${generatedCount} explanations generated so far)...`);
          }
          
          // Sleep for 4.5 seconds to stay under 15 RPM
          await sleep(15000);
          
        } catch (error: any) {
          if (error?.status === 429) {
             console.log(`Rate limit hit! Waiting 60 seconds before retrying (Retries left: ${retries - 1})...`);
             await sleep(60000); // Wait 60 seconds
             retries--;
          } else {
            console.error(`\nError generating explanation for question ${q.id}:`, error);
            console.log('Saving progress and exiting safely...');
            fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
            process.exit(1);
          }
        }
      }
      
      if (!success) {
         console.log("Failed after multiple retries. Saving progress and exiting.");
         fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
         process.exit(1);
      }
    }
  }
  
  // Final save
  fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
  console.log('\nSuccess! All explanations have been generated and saved to src/lib/questions.json.');
}

run();

