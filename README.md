# Pathwise

A small career-tools app I built to scratch a few of my own itches: figuring out what to learn next, checking whether a resume actually matches a JD, and keeping track of progress.

MERN stack. Free AI keys (Groq + Gemini fallbacks). Runs locally.

## What's in it

- **ATS resume scanner** — uploads a resume + JD, returns a deterministic score with a breakdown. The numbers are computed in code (see `parser.js`), the LLM only writes the explanation.
- **Roadmap generator** — give it a target role + hours/week and it spits out a week-by-week plan.
- **Skill-gap analysis** — what you have, what you're missing, what to learn first.
- **Market insights** — salaries, demand, top skills for a role.
- **Resource library** — ~80 hand-picked free links (MDN, fCC, CS50, etc.).

## Scoring

Resume scoring is rule-based, not AI-based. Same input always returns the same score.

```
keyword match   35%
skills match    25%
experience      15%
education       10%
formatting      10%
title match      5%
```

The LLM is only asked for the narrative (verdict reason, red/green flags, recs).

## Run it

Backend:
```bash
cd server
cp .env.example .env   # fill in GROQ_API_KEY at minimum
npm i
npm run dev
```

Frontend:
```bash
cd client
npm i
npm run dev
```

Mongo needs to be running locally on the default port (or change `MONGODB_URI`).

## Tests

```bash
cd server
npm test          # vitest, parser/scoring
npm run test:e2e  # full flow against a running server
```

## Stack

- React + Vite + Tailwind on the front
- Express + Mongoose on the back
- JWT in httpOnly cookies for auth
- Groq (primary), Gemini / Cerebras / OpenRouter as fallbacks when Groq rate-limits

