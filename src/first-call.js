import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY. Copy .env.example to .env and add your key.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

const response = await ai.models.generateContent({
  model,
  contents: 'In one sentence, what does a Gemini API "content" object contain?',
});

console.log(response.text);
