# W2 — Job Posting Analyzer

Part of the self-directed "AI Exploration — Month 1" ramp-up (Trello board). Week 2 goal: get a working
Claude API call, then build a small tool that puts it to real use — a job-posting analyzer.

## Setup

```bash
npm install
cp .env.example .env   # then paste your Anthropic API key into .env
```

Get a key at https://console.anthropic.com/settings/keys (requires billing set up on the account — pay-as-you-go).

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

## Status

- [x] First API call working
- [x] Job posting analyzer (v1) — single-shot analysis, no persistence
- [ ] Tested against real postings (not just the sample)
