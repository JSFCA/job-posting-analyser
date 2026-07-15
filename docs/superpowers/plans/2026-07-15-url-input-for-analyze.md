# URL Input for `npm run analyze` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let `npm run analyze -- <arg>` accept an `http(s)://` URL as an alternative to a local file path, fetching the page and stripping it to plain text before sending it to Gemini — no copy/paste into a `.txt` file required.

**Architecture:** `src/analyze.js` detects whether its CLI argument is a URL (regex on the `http(s)://` prefix) or a file path (existing behavior, untouched). For URLs, it fetches with a 10s timeout, converts the returned HTML to plain text via the `html-to-text` package, and warns (but still proceeds) if the extracted text looks too short to be real content — the common signature of a JavaScript-rendered page that a plain `fetch` can't execute. Everything downstream (system prompt, Gemini call, output) is unchanged.

**Tech Stack:** Node.js built-in `fetch` + `AbortSignal.timeout`, new dependency `html-to-text`.

## Global Constraints

- No test framework exists in this project (`package.json` has no test script or test dependencies) — verification is manual, by running the actual CLI against real inputs, matching how `first-call.js` and `analyze.js` have been verified so far in this project.
- Avoid scope creep: no headless browser, no HTML caching, no new CLI flags — just URL-or-path detection on the existing single argument.
- Node's built-in `fetch` only — do not add an HTTP client dependency.
- Never fabricate or guess a real job-posting URL. Use `https://example.com` for the mechanical fetch/strip smoke test; ask the human to supply a real posting URL for the semantic test.

---

### Task 1: URL input support in `src/analyze.js`

**Files:**
- Modify: `src/analyze.js` (full file — see below)
- Modify: `package.json` (via `npm install`, adds `html-to-text` to `dependencies`)
- Modify: `CLAUDE.md` (Structure section — note the new URL capability)

**Interfaces:**
- Consumes: nothing from other tasks (this is the only task).
- Produces: nothing consumed elsewhere — this is a leaf, user-facing CLI change.

- [ ] **Step 1: Install the new dependency**

Run:
```bash
cd "/Users/joaoangelo/Documents/Projects/AI Ramp up/W2 - Job Posting Analyzer"
npm install html-to-text
```
Expected: `package.json` gains `"html-to-text": "^<resolved-version>"` under `dependencies`, and `package-lock.json` updates. Confirm with:
```bash
grep html-to-text package.json
```
Expected output: a line like `"html-to-text": "^9.0.5"` (exact version may differ — that's fine, npm resolved it).

- [ ] **Step 2: Rewrite `src/analyze.js` to add URL detection, fetch, and HTML stripping**

Replace the full contents of `src/analyze.js` with:

```js
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
```

- [ ] **Step 3: Regression-check the file-path path still works**

Run:
```bash
cd "/Users/joaoangelo/Documents/Projects/AI Ramp up/W2 - Job Posting Analyzer"
npm run analyze -- samples/example-posting.txt
```
Expected: same structured markdown breakdown (Role summary / Must-haves / … / Questions to ask) as before this change — confirms the file-path branch is untouched.

- [ ] **Step 4: Mechanical smoke-test the URL path**

Run:
```bash
cd "/Users/joaoangelo/Documents/Projects/AI Ramp up/W2 - Job Posting Analyzer"
npm run analyze -- https://example.com
```
Expected: no crash; the script fetches the page, converts it to text, and either prints a Gemini response or (likely, since example.com's body is tiny) prints the "page content looks too short" warning to stderr and still attempts the Gemini call. This step is only checking the fetch → convert → warn → API-call plumbing works, not that the output is a sensible job-posting analysis — example.com isn't a job posting.

- [ ] **Step 5: Semantic test against a real job posting URL**

This step needs a real, currently-live job posting URL, which must come from the human — do not guess or invent one. Ask the user for a URL to a real posting they're evaluating, then run:
```bash
cd "/Users/joaoangelo/Documents/Projects/AI Ramp up/W2 - Job Posting Analyzer"
npm run analyze -- "<url the user provides>"
```
Expected: a specific, non-generic breakdown of that posting (same bar as the file-path output). If the site is JS-rendered, expect the thin-content warning to fire — that's correct behavior per the design, not a bug.

- [ ] **Step 6: Update `CLAUDE.md`'s Structure section**

In the `## Structure` list, change the bullet describing `src/analyze.js` from:
```
- `src/analyze.js` — the actual deliverable: `npm run analyze -- <path-to-posting.txt>`, sends posting text
  to Gemini with a fixed system instruction, prints a structured breakdown (must-haves, nice-to-haves,
  skills, culture signals, red flags, questions to ask)
```
to:
```
- `src/analyze.js` — the actual deliverable: `npm run analyze -- <path-to-posting.txt | url>`, sends posting
  text to Gemini with a fixed system instruction, prints a structured breakdown (must-haves, nice-to-haves,
  skills, culture signals, red flags, questions to ask). URLs are fetched and stripped to text via
  `html-to-text`; JS-rendered pages (e.g. LinkedIn) print a stderr warning since plain `fetch` can't execute
  their JavaScript — save those postings as `.txt` instead.
```

- [ ] **Step 7: Commit**

```bash
cd "/Users/joaoangelo/Documents/Projects/AI Ramp up/W2 - Job Posting Analyzer"
git add package.json package-lock.json src/analyze.js CLAUDE.md
git commit -m "$(cat <<'EOF'
Add URL input support to the job posting analyzer

npm run analyze now accepts an http(s):// URL in addition to a file
path -- fetches the page and strips it to text via html-to-text before
sending it to Gemini. JS-rendered pages (LinkedIn, etc.) can't be
fetched this way; the script warns and falls back to sending whatever
text it got rather than failing outright.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
Expected: commit succeeds, `git status` shows a clean tree.

---
