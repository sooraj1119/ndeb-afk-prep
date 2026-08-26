import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const file = 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/scratch/questions.json';
let questions = JSON.parse(fs.readFileSync(file, 'utf8'));

const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  let count = 0;
  for (let i = 0; i < questions.length; i++) {
    if (!questions[i].explanation || questions[i].explanation.trim() === '') {
      const q = questions[i];
      let success = false;
      while (!success) {
        console.log(`Generating explanation for Q${q.id}: ${q.question.substring(0,30)}...`);
        const prompt = `You are an expert NDEB dental instructor. Generate a concise, 1-2 sentence explanation for why the correct answer to this question is "${q.options[q.correctAnswer]}".
Question: ${q.question}
Options: ${q.options.join(', ')}
Correct Answer: ${q.options[q.correctAnswer]}`;

        try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt
          });
          
          q.explanation = response.text;
          console.log(`Success: ${q.explanation}`);
          count++;
          success = true;
          
          // Save incrementally
          if (count % 5 === 0) {
              fs.writeFileSync(file, JSON.stringify(questions, null, 2));
              console.log('Saved progress...');
          }
          
          // Respect rate limits (~15 RPM)
          await delay(4500);
        } catch (err) {
          console.error(`Error generating explanation for Q${q.id}:`, err.message);
          console.log('Waiting 15 seconds before retrying...');
          await delay(15000); // Backoff and retry
        }
      }
    }
  }
  
  fs.writeFileSync(file, JSON.stringify(questions, null, 2));
  console.log('Done generating all explanations!');
}

main();
