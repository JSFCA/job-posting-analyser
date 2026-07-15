import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { GoogleGenAI } from '@google/genai';
import { convert } from 'html-to-text';

if (!process.env.GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY. Copy .env.example to .env and add your key.');
  process.exit(1);
}

const input = process.argv[2];
if (!input) {
  console.error('Usage: npm run analyze -- <path-to-job-posting.txt | url>');
  process.exit(1);
}

const isUrl = /^https?:\/\//i.test(input);

async function fetchPosting(url) {
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch (err) {
    console.error(`Failed to fetch ${url}: ${err.message}`);
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const html = await res.text();
  const text = convert(html, { wordwrap: false });

  if (text.trim().length < 200) {
    console.error(
      'Warning: page content looks too short — this site may render via JavaScript; ' +
      'try saving the posting as a .txt file instead.'
    );
  }

  return text;
}

const posting = isUrl ? await fetchPosting(input) : readFileSync(input, 'utf-8');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

const SYSTEM_PROMPT = `You analyze job postings for a candidate evaluating fit. Given the raw text of a
job posting, respond with exactly these sections, each as a markdown heading followed by a short bullet list:

## Role summary
One or two bullets: title, seniority, team/scope if stated.

## Must-haves
Hard requirements the posting treats as non-negotiable.

## Nice-to-haves
Explicitly optional or "bonus" requirements.

## Key skills & tools
Concrete technologies, methodologies, or domains named in the posting.

## Culture & soft-skill signals
What the wording implies about team culture, pace, or expectations (e.g. "fast-paced", "ownership").

## Potential red flags
Anything vague, contradictory, or worth probing in an interview (e.g. unclear scope, unrealistic
requirement combos, no mention of team size/structure).

## Questions to ask
2-3 sharp questions this posting doesn't answer.

Be concise and specific to this posting — no generic filler.`;

const response = await ai.models.generateContent({
  model,
  contents: posting,
  config: {
    systemInstruction: SYSTEM_PROMPT,
  },
});

console.log(response.text);
