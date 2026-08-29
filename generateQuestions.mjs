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
const topicsToFill = ["anatomy", "anesthesia", "biochemistry", "endodontics", "microbiology", "operative-dentistry", "oral-pathology", "pathology", "periodontology", "pharmacology", "prosthodontics", "radiology", "general-medicine", "ethics", "dental-materials"];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function generateId() { return Math.floor(Math.random() * 1000000000); }

async function run() {
  
  // BUILD GLOBAL CROSS-TOPIC SET
  const globalTextSet = new Set();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'manifest.json');
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const q of data) {
      if (q && q.question) {
        globalTextSet.add(q.question.toLowerCase().trim());
      }
    }
  }
  console.log(`Loaded global deduplication set with ${globalTextSet.size} unique questions.`);

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
      
      const prompt = `You are an expert NDEB AFK (Assessment of Fundamental Knowledge) examiner.
Generate exactly ${fetchCount} highly realistic, challenging multiple-choice questions for the topic of "${topicId}".
Return ONLY a valid JSON array of objects. Do not include markdown formatting like \`\`\`json.

STRICT NDEB AFK GUIDELINES & QUESTION PATTERN:
1. Format: Use the standard NDEB structure. Include clinical scenario-based questions (patient age, gender, symptoms, clinical/radiographic findings) AND theoretical fundamental knowledge questions.
2. Single Best Answer: There must be exactly 4 options. Only ONE option is definitively correct. 
3. Plausible Distractors: Incorrect options MUST be plausible misconceptions, alternative diagnoses, or related but incorrect treatments. No "joke" or obviously wrong options.
4. NO "All of the above" or "None of the above" options (NDEB explicitly avoids these).
5. Explanations: The explanation MUST be 2-3 sentences detailing exactly why the correct answer is right AND why the major distractors are wrong according to Canadian dental standards.
6. NO DUPLICATES: You must generate entirely unique clinical scenarios and question stems. Ensure deep variety across all sub-topics within "${topicId}".

Each object MUST follow this exact schema:
{
  "id": <random unique integer>,
  "topicId": "${topicId}",
  "difficulty": "hard",
  "question": "Clear, concise question text here...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": <integer 0, 1, 2, or 3>,
  "explanation": "Detailed explanation of the rationale."
}`;

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

        const validNewQuestions = [];
        for (const q of newQuestions) {
          const normalized = q.question.toLowerCase().trim();
          if (!globalTextSet.has(normalized)) {
            globalTextSet.add(normalized);
            validNewQuestions.push(q);
          } else {
            console.log("Skipping duplicate generated question.");
          }
        }
        questions.push(...validNewQuestions);
        // Overwrite newQuestions length with valid length so the needed counter updates correctly
        newQuestions.length = validNewQuestions.length;
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
