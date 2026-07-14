# W2 — Job Posting Analyzer

Part of a self-directed month-long AI ramp-up (Trello board: "AI Exploration — Month 1"), set up via a Claude
Desktop session connected to Trello, which created the cards. Week 1 was a static portfolio one-pager
(sibling folder `../W1 - Portfolio one-pager`). Week 2 goal, per the card: **Claude API key + first call,
then a job-posting analyzer tested on real postings.** That's the full scope — no more detail on the card.

## Program rules (carried over from W1's RULES card — respect these)
- Hard cap 15h/week, target 10-12. No sessions after a bad night's sleep.
- Each work session gets logged on its Trello card: Built / Failed / Learned / Energy 1-5. Nothing more.
- Avoid scope creep — build only what the card asks for, don't gold-plate.

## Stack
Node.js (ESM), official `@anthropic-ai/sdk`, `dotenv` for the API key. Chosen over Python to stay in the
user's existing JS/TS comfort zone while the new thing being learned is the API/LLM integration itself, not
a new language.

## Structure
- `src/first-call.js` — minimal script proving the API key + SDK work (single hardcoded prompt)
- `src/analyze.js` — the actual deliverable: `npm run analyze -- <path-to-posting.txt>`, sends posting text
  to Claude with a fixed system prompt, prints a structured breakdown (must-haves, nice-to-haves, skills,
  culture signals, red flags, questions to ask)
- `samples/example-posting.txt` — fake EM posting for quick smoke-testing
- `.env` (gitignored) — holds `ANTHROPIC_API_KEY`, copy from `.env.example`

## Where this leaves off
Built and installed, not yet run against a real API key (user was getting one set up as of last session) or
tested against a real job posting (only the fake sample). Next session: confirm `npm run first-call` works,
then run `npm run analyze` against 2-3 real postings the user is actually looking at, and see if the output
is actually useful or needs prompt tweaks. After that, log the RULES comment on this card, then move to
**Week 3 — Agents**: a small tool-using agent from scratch, no framework, then deliberately breaking it to
learn failure modes.

## Known gotcha
None yet — first real session on this repo.
