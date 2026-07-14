# W2 — Job Posting Analyzer

Part of the self-directed "AI Exploration — Month 1" ramp-up (Trello board). Week 2 goal: get a working
LLM API call, then build a small tool that puts it to real use — a job-posting analyzer.

Runs on Google's **Gemini API free tier** (no billing/card required) rather than Claude's paid API — the
fundamentals (system prompts, roles, tool calling, structured output) transfer directly to any provider,
so there was no reason to pay for this exercise. MCP itself is no longer Claude-exclusive either — Gemini
added native MCP client support in March 2026.

## Setup

```bash
npm install
cp .env.example .env   # then paste your Gemini API key into .env
```

Get a free key at https://aistudio.google.com/apikey — no billing required, just a Google account.

**Note:** on the free tier, Google's terms allow using your inputs/outputs to improve their models. Fine
for the sample posting; if you paste a real employer's confidential posting, be aware of that before running it.

## Usage

First call — confirms the key and SDK work:

```bash
npm run first-call
```

Job posting analyzer — breaks a posting down into must-haves, nice-to-haves, culture signals, red flags,
and questions to ask:

```bash
npm run analyze -- samples/example-posting.txt
```

Swap in any `.txt` file with real posting text.

## If the model 404s

Google's free-tier model ids churn (aliases like `gemini-flash-latest` have been deprecated before).
Check https://ai.google.dev/gemini-api/docs/models for the current free-tier flash model id, then set
`GEMINI_MODEL` in `.env` to override the default (`gemini-2.5-flash`).

## Status

- [x] First API call working
- [x] Job posting analyzer (v1) — single-shot analysis, no persistence
- [ ] Tested against real postings (not just the sample)
