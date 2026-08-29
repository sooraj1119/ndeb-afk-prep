import fs from 'fs';

let content = fs.readFileSync('generateQuestions.mjs', 'utf8');

const oldPromptBlock = /const prompt = \You are an expert NDEB AFK examiner.*?No conversational text\.\;/s;

const newPromptBlock = \const prompt = \\\You are an expert NDEB AFK (Assessment of Fundamental Knowledge) examiner.
Generate exactly \ highly realistic, challenging multiple-choice questions for the topic of "\".
Return ONLY a valid JSON array of objects. Do not include markdown formatting like \\\\\\\\\\\\\\\\\\json.

STRICT NDEB AFK GUIDELINES & QUESTION PATTERN:
1. Format: Use the standard NDEB structure. Include clinical scenario-based questions (patient age, gender, symptoms, clinical/radiographic findings) AND theoretical fundamental knowledge questions.
2. Single Best Answer: There must be exactly 4 options. Only ONE option is definitively correct. 
3. Plausible Distractors: Incorrect options MUST be plausible misconceptions, alternative diagnoses, or related but incorrect treatments. No "joke" or obviously wrong options.
4. NO "All of the above" or "None of the above" options (NDEB explicitly avoids these).
5. Explanations: The explanation MUST be 2-3 sentences detailing exactly why the correct answer is right AND why the major distractors are wrong according to Canadian dental standards.
6. NO DUPLICATES: You must generate entirely unique clinical scenarios and question stems. Ensure deep variety across all sub-topics within "\".

Each object MUST follow this exact schema:
{
  "id": <random unique integer>,
  "topicId": "\",
  "difficulty": "hard",
  "question": "Clear, concise question text here...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": <integer 0, 1, 2, or 3>,
  "explanation": "Detailed explanation of the rationale."
}\\\;\;

content = content.replace(oldPromptBlock, newPromptBlock);
fs.writeFileSync('generateQuestions.mjs', content);
console.log("Prompt updated to STRICT NDEB standards.");