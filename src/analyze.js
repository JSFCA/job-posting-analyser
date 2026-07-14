import 'dotenv/config';
import { readFileSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.');
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: npm run analyze -- <path-to-job-posting.txt>');
  process.exit(1);
}

const posting = readFileSync(filePath, 'utf-8');

const client = new Anthropic();

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

const message = await client.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 1024,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: posting }],
});

console.log(message.content[0].text);
