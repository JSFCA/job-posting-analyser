# W2 — Job Posting Analyzer

Part of a self-directed month-long AI ramp-up (Trello board: "AI Exploration — Month 1"), set up via a Claude
Desktop session connected to Trello, which created the cards. Week 1 was a static portfolio one-pager
(sibling folder `../W1 - Portfolio one-pager`). Week 2 goal, per the card: **Claude API key + first call,
then a job-posting analyzer tested on real postings.** That's the full scope — no more detail on the card.

**Deviation from the card:** built against Google's Gemini API instead of Claude's. User didn't want to pay
for Anthropic's mandatory billing minimum. Decided the fundamentals being learned (system prompts, roles,
tool calling, structured output) transfer across providers, so provider choice doesn't matter for the
learning goal — and Gemini has a genuinely free tier (no card) with full function-calling support. Also,
MCP (previously a Claude-only reason to prefer Anthropic) got native Gemini SDK support in March 2026, so
that argument no longer holds either. If a future card says "Claude API" specifically, ask before assuming
this substitution still applies.

## Program rules (carried over from W1's RULES card — respect these)
- Each work session gets logged on its Trello card: Built / Failed / Learned / Energy 1-5. Nothing more.
- Avoid scope creep — build only what the card asks for, don't gold-plate.

## Stack
Node.js (ESM), `@google/genai` (Gemini SDK), `dotenv` for the API key. Chosen over Python to stay in the
user's existing JS/TS comfort zone while the new thing being learned is the API/LLM integration itself, not
a new language. Chosen over Claude's SDK to avoid paying — see deviation note above.

## Structure
- `src/first-call.js` — minimal script proving the API key + SDK work (single hardcoded prompt)
- `src/analyze.js` — the actual deliverable: `npm run analyze -- <path-to-posting.txt>`, sends posting text
  to Gemini with a fixed system instruction, prints a structured breakdown (must-haves, nice-to-haves,
  skills, culture signals, red flags, questions to ask)
- `samples/example-posting.txt` — fake EM posting for quick smoke-testing
- `.env` (gitignored) — holds `GEMINI_API_KEY` and optional `GEMINI_MODEL` override, copy from `.env.example`

## Where this leaves off
Model-id debugging is resolved: this Google Cloud project (new, created 2026-07-14) has **zero free-tier
quota for the 2.0/2.5-generation Gemini models** — `gemini-2.5-flash` and `gemini-2.5-flash-lite` 404
("no longer available to new users"), `gemini-2.0-flash-001` came back 429 RESOURCE_EXHAUSTED with a hard 0
quota. `gemini-3-flash-preview` returned a real 200 on the first try and is now the default everywhere
(`.env`, `.env.example`, `src/first-call.js`, `src/analyze.js` — all overridable via `GEMINI_MODEL`).

`npm run first-call` and `npm run analyze -- samples/example-posting.txt` both confirmed working end-to-end
through the SDK. The analyzer's output on the fake EM posting was specific and useful (real red flags, real
questions, not generic filler) — no prompt tweaks needed yet.

**Next session:** run `npm run analyze` against 2-3 *real* job postings the user is actually looking at (the
sample was only ever a smoke test), and judge whether the output holds up on real messy text or needs prompt
adjustments. After that, log the RULES comment on this Trello card, then move to **Week 3 — Agents**: a
small tool-using agent from scratch, no framework, then deliberately breaking it to learn failure modes.

## Known gotcha
Gemini free-tier model ids churn faster than expected, and quota allocation can differ by *project age*, not
just model id — a "latest" alias (`gemini-flash-latest`) has been reported deprecated elsewhere, the
2.0/2.5-generation models 404 or 429-with-zero-quota on brand-new free-tier projects, and only newer
generations (`gemini-3-flash-preview` confirmed working; `gemini-3.1-flash-lite`, `gemini-3.5-flash` untested
but likely fine) get live free quota. Model id is overridable via `GEMINI_MODEL` in `.env` specifically so
this doesn't require a code change when it happens again. If `npm run first-call` fails, test candidate model
ids one at a time with a single direct curl call before touching code — don't loop through several in one
shell command, and don't just retry the same ids that already failed.
