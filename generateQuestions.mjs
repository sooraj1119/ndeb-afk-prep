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
const dir = 'public/questions';

const targetCount = 500;
const topicsToFill = ["prosthodontics", "general-medicine", "ethics"];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function generateId() { return Math.floor(Math.random() * 1000000000); }

async function run() {
  for (const topicId of topicsToFill) {
    const filePath = path.join(dir, topicId + '.json');
    let questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let needed = targetCount - questions.length;
    if (needed <= 0) {
      console.log(`Topic '${topicId}' already has ${questions.length} questions. Skipping.`);
      continue;
    }
    
    console.log(`\nTopic '${topicId}' needs ${needed} more questions to reach ${targetCount}.`);
    
    // Using batch size of 20 to speed this up, 2.5 Flash can easily handle 20 questions in a response
    const batchSize = 20;
    
    while (needed > 0) {
      const fetchCount = Math.min(needed, batchSize);
      console.log(`Fetching batch of ${fetchCount} questions for '${topicId}'...`);
      
      const prompt = `You are an expert NDEB AFK examiner.
Generate exactly ${fetchCount} highly realistic, challenging multiple-choice questions for the topic of "${topicId}".
Return ONLY a valid JSON array of objects. Do not include markdown formatting like \`\`\`json.
Each object MUST follow this exact schema:
{
  "id": <random unique integer>,
  "topicId": "${topicId}",
  "difficulty": "medium",
  "question": "Clear, concise question text here...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": <integer 0, 1, 2, or 3>,
  "explanation": "1-2 sentence explanation of why the answer is correct."
}
Rules:
1. Provide exactly 4 options for every question.
2. Questions must be clinically or theoretically relevant to NDEB AFK standard.
3. No duplicate questions. Ensure variety in sub-topics.
4. Output must be perfectly parsable JSON. No conversational text.`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        let text = response.text;
        text = text.replace(/^```json/mi, '').replace(/^```/mi, '').trim();
        if (text.endsWith('```')) text = text.slice(0, -3).trim();

        const newQuestions = JSON.parse(text);
        if (!Array.isArray(newQuestions) || newQuestions.length === 0) {
           throw new Error("API did not return a valid JSON array.");
        }

        // Validate structure
        for (const q of newQuestions) {
          if (typeof q.question !== 'string' || !Array.isArray(q.options) || q.options.length !== 4) {
             throw new Error("Invalid question schema detected.");
          }
          q.id = generateId(); // enforce fresh ID
          q.topicId = topicId;
        }

        questions.push(...newQuestions);
        fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
        
        needed -= newQuestions.length;
        console.log(`Saved ${newQuestions.length} questions. Remaining: ${needed}`);
        
        // Update manifest
        const manifestPath = path.join(dir, 'manifest.json');
        let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const topicRef = manifest.find(t => t.id === topicId);
        if (topicRef) {
           topicRef.count = questions.length;
           fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        }

        await sleep(3000); // Prevent rate limiting
      } catch (err) {
        console.error("Error generating batch, retrying...", err.message);
        await sleep(5000);
      }
    }
  }
  console.log("ALL DONE!");
}

run();
