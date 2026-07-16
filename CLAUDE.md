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
- `src/analyze.js` — the actual deliverable: `npm run analyze -- <path-to-posting.txt | url>`, sends posting
  text to Gemini with a fixed system instruction, prints a structured breakdown (must-haves, nice-to-haves,
  skills, culture signals, red flags, questions to ask) to stdout only — nothing is written to disk. URLs are
  fetched and stripped to text via `html-to-text`; on modern ATS platforms (confirmed on Hays and Expleo/iCIMS)
  the real posting is loaded client-side via JS, so plain `fetch` gets nav/search-shell boilerplate instead —
  the length-based warning does NOT reliably catch this (both returned thousands of characters of *wrong*
  content, not obviously-short content). Save those postings as `.txt` instead; that path is proven reliable.
- `samples/example-posting.txt` — fake EM posting for quick smoke-testing
- `.env` (gitignored) — holds `GEMINI_API_KEY` and optional `GEMINI_MODEL` override, copy from `.env.example`

## Where this leaves off — W2 card closed out
Model-id debugging is resolved: this Google Cloud project (new, created 2026-07-14) has **zero free-tier
quota for the 2.0/2.5-generation Gemini models** — `gemini-2.5-flash` and `gemini-2.5-flash-lite` 404
("no longer available to new users"), `gemini-2.0-flash-001` came back 429 RESOURCE_EXHAUSTED with a hard 0
quota. `gemini-3-flash-preview` returned a real 200 on the first try and is now the default everywhere
(`.env`, `.env.example`, `src/first-call.js`, `src/analyze.js` — all overridable via `GEMINI_MODEL`).

Scope grew once, deliberately, beyond the original card: added URL input (`npm run analyze -- <url>`) so
postings don't need manual copy/paste into a `.txt` file first — see
`docs/superpowers/plans/2026-07-15-url-input-for-analyze.md` for the design rationale. Built via
subagent-driven-development (fresh implementer + task reviewer + final whole-change reviewer, all
independent) — no Critical/Important findings, only two Minor ones (missing `engines` field in
`package.json`, and a slightly overconfident implementer test-coverage claim).

**Real-posting validation (the card's actual bar) is done:**
- `npm run analyze -- samples/example-posting.txt` (a real Engineering Manager posting, pasted in by the
  user, not the original placeholder) produced a specific, non-generic breakdown — real red flags tied to
  the posting's actual wording, sharp follow-up questions. This is the deliverable working as intended.
- The URL path was tested against two real postings (Hays, Expleo/iCIMS) and failed both — both sites load
  the actual job content client-side via JS, which plain `fetch` can't execute, so the analysis came back
  based on nav-shell/wrong-listing text instead of the real posting. This is a known, documented limitation,
  not a bug — the file-path route is the reliable fallback and is called out in `## Structure` above.

**Next up: Week 3 — Agents.** A small tool-using agent from scratch, no framework, then deliberately breaking
it to learn failure modes. See `## Looking ahead` below for the options discussed and where that's headed.

## Looking ahead (planning talk, not yet built — read before starting W3)

**Parked idea: daily job-opening scraper + email alert (scope TBD, likely W4+, not W3).**
User's idea: something that checks specific job sources daily and emails postings matching criteria. Sized
this out before committing to anything:
- The matching/email parts are the easy, well-trodden part (reuse W2's analyze logic for matching; any
  SMTP/email API for delivery).
- The hard part is **sourcing** — "online job openings" generally means scraping, and W2's URL-input work
  already proved real ATS sites (Hays, Expleo/iCIMS) resist plain `fetch` because they render postings via
  client-side JS. LinkedIn/Indeed are worse (ToS-restricted, bot-detected). Realistic scope narrows to a
  short list of specific company career pages/ATS platforms with predictable structure, not "online" broadly.
- The other new piece is **hosting**: "daily" needs something running unattended (a laptop cron only fires
  if the laptop is awake at that time; otherwise this needs a small always-on host or scheduled cloud
  function) — infrastructure this project hasn't touched yet.
- Considered whether a headless browser (Playwright/Puppeteer) fixes the scraping problem: yes, likely, for
  plain client-side-rendering cases like Hays/iCIMS specifically (it executes the JS `fetch` can't) — but
  it's a real dependency/complexity jump (bundles a browser binary, seconds not milliseconds per page,
  doesn't help against sites with active bot-detection like LinkedIn). Verdict: not worth retrofitting into
  W2's small CLI script, but plausibly the right foundation *if and when* the scraper project gets built,
  since that project needs serious sourcing infra regardless.
- **Before writing any scraper code**, validate the approach with zero code: Claude Code's `/chrome` command
  drives the actual Claude in Chrome browser extension (separate install from the Chrome Web Store, needs an
  Anthropic direct plan) — it can navigate to a real ATS URL, wait for JS to render, and read the actual
  page content. Runs a visible browser window (not headless, not for a silent daily cron), but it's the
  fastest way to confirm "would a real browser even see this posting" before investing in headless-browser
  infrastructure. Try this on Hays/Expleo before scoping the scraper project for real.
- **Status:** parked, not scoped as a card yet. Revisit after W3.

**W3 shape: what makes a task actually "agentic."** User knows little about agents going in, so this needs
some teaching, not just a task assignment. Key distinction established: W2's `analyze.js` is a single-shot
call (fixed number of steps, no decisions made by the model about what happens next). An **agent** adds a
loop — model gets a goal + a list of callable tools, reasons about what to do, calls a tool, your code
executes it and feeds the result back as an observation, model decides again, repeats until done (the
ReAct pattern). "No framework" (per the original card wording) means hand-writing that loop — the `while`,
the tool dispatch, the message-history bookkeeping — instead of LangChain/similar, because the loop mechanics
are the actual lesson.

**W3 candidate tasks discussed (none chosen yet)**, roughly clean-mechanics → connected-but-messy:
1. **Postings triage agent (current lean).** Turn W2's own code into tools: `list_postings()`,
   `read_posting(filename)`, `analyze_posting(text)` (literally the W2 system prompt, now callable),
   `check_against_criteria(analysis, criteria)`. Goal: "go through these local posting files and tell me
   which are worth applying to." Model decides how many to check and when it has enough to conclude. Reuses
   W2 code as agent tools (concretizes "tool calling" as literally your existing function, now with a
   description attached) and stays on local files — sidesteps the scraping mess entirely.
2. **To-do list agent.** Tools: `add_task`, `list_tasks`, `complete_task`, `find_task(query)` over a local
   JSON file. Goal like "add three tasks, don't duplicate what's already there" — forces the model to
   sequence tool calls correctly (list before add). Cleanest textbook shape, zero domain baggage, good for
   "break it later" experiments (remove the duplicate-check instruction, see if it self-corrects).
3. **Research-and-compute agent.** Search tool + calculator tool, question like "combined population of
   Portugal and Ireland, and what year did each join the EU." Standard tutorial shape — two unrelated tools,
   cleanest illustration of "decide which tool, in what order." Least connected to user's actual interests.
4. **Real scraper prototype, one site.** `fetch_page` + `extract_postings` tools against one real company
   career page. Most exciting, doubles as an early prototype of the parked scraper idea — but reintroduces
   this week's JS-rendering/scraping fight, which would compete with "learn what an agent loop is" for
   attention in the same week. Probably too much at once for a first agent.

Leaning toward **option 1** for continuity and motivation, with **option 2** as the fallback if zero domain
baggage turns out to matter more while learning the loop mechanics for the first time. Not decided — pick up
this conversation at the start of the W3 session rather than assuming option 1 is locked in.

## Session log (Built / Failed / Learned / Energy — per RULES card)
- **Built:** Fixed the free-tier model-id issue (`gemini-3-flash-preview` now default everywhere); added
  URL input to `npm run analyze`; validated the analyzer end-to-end against a real EM posting.
- **Failed:** URL input didn't work on either real ATS site tried (Hays, Expleo/iCIMS) — both render posting
  content client-side via JS, so `fetch` only got nav/search-shell boilerplate, not the posting.
- **Learned:** Gemini free-tier quota depends on project age as much as model id — new projects only get
  quota on the gemini-3 generation. A length-only heuristic can't reliably detect JS-rendered pages — they
  return plenty of characters, just the wrong ones — so file-path input remains the dependable path for
  modern ATS platforms.
- **Energy:** not logged here — this needs the user's own rating on the Trello card (no Trello access from
  this tool).

## Known gotcha
Gemini free-tier model ids churn faster than expected, and quota allocation can differ by *project age*, not
just model id — a "latest" alias (`gemini-flash-latest`) has been reported deprecated elsewhere, the
2.0/2.5-generation models 404 or 429-with-zero-quota on brand-new free-tier projects, and only newer
generations (`gemini-3-flash-preview` confirmed working; `gemini-3.1-flash-lite`, `gemini-3.5-flash` untested
but likely fine) get live free quota. Model id is overridable via `GEMINI_MODEL` in `.env` specifically so
this doesn't require a code change when it happens again. If `npm run first-call` fails, test candidate model
ids one at a time with a single direct curl call before touching code — don't loop through several in one
shell command, and don't just retry the same ids that already failed.
