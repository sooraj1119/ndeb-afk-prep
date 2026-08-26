import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
async function list() {
  const models = await ai.models.list();
  console.log(models);
}
list();
