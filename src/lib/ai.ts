import { GoogleGenAI } from '@google/genai';

// Initialize the SDK. It will automatically pick up VITE_GEMINI_API_KEY from .env.local
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function generateExplanation(question: string, correctAnswer: string, wrongAnswer: string): Promise<string> {
  if (!ai) {
    return "API Key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file in the project folder.";
  }

  const prompt = `You are an expert dental tutor helping a student prepare for the NDEB AFK exam.
The student answered a multiple-choice question incorrectly.
Question: "${question}"
Correct Answer: "${correctAnswer}"
Student's Wrong Answer: "${wrongAnswer}"

In 2-3 concise sentences, explain WHY the student's answer is incorrect, and WHY the correct answer is right. Be encouraging and medically accurate.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Sorry, I couldn't generate an explanation.";
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "An error occurred while connecting to the AI. Check the console or your API key.";
  }
}
