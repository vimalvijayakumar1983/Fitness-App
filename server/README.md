# Fitness App — Backend API

Node + Express + TypeScript API backing the Fitness App. Provides accounts,
cloud data storage, a searchable food database, goals/analytics, and an
AI coach powered by Claude.

## Stack

- **Express** REST API (`/api/*`)
- **SQLite** (better-sqlite3) — zero-config local database
- **JWT** auth (register / login, Bearer tokens)
- **Zod** request validation
- **@anthropic-ai/sdk** — AI coach (chat + photo food logging) on `claude-opus-4-8`

## Setup

```bash
cd server
npm install
cp .env.example .env       # then edit values
npm run dev                # ts-node-dev, hot reload
# or: npm run build && npm start
```

The food database is auto-seeded on first boot (also `npm run seed`).

Set `ANTHROPIC_API_KEY` in `.env` to enable the Claude-powered coach. Without
it, the coach runs in a rule-based **offline mode** and photo logging is
disabled — everything else works.

## API overview

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` · `/login` | Create account / sign in → `{ token, user }` |
| GET/POST | `/api/meals` | List (optionally `?date=`) / log meals |
| GET/POST | `/api/exercises` | List / log workouts (incl. steps, HR, source) |
| GET/POST | `/api/moods` | List / log mood, stress, energy |
| GET/POST | `/api/sleep` | List / log sleep |
| GET/POST | `/api/weights` | Weight & body-fat history |
| GET/POST | `/api/water` | Water intake (daily total) |
| DELETE | `/api/:kind/:id` | Delete an entry (meals, exercises, …) |
| GET/PUT | `/api/goals` | Calorie / protein / steps / water / sleep / weight goals |
| GET | `/api/foods/search?q=` | Search the food database |
| GET | `/api/foods/barcode/:code` | Barcode lookup |
| GET | `/api/analytics/daily?date=` | One-day headline summary |
| GET | `/api/analytics/trend?metric=&days=` | Daily series for charts |
| POST | `/api/coach/chat` | AI coach chat (grounded in your data) |
| POST | `/api/coach/analyze-food` | Estimate calories/macros from a food photo |

All routes except `/api/auth/*` and `/api/health` require
`Authorization: Bearer <token>`.

## AI coach

`src/routes/coach.ts` is the single integration point with Claude. It uses the
official Anthropic SDK with `claude-opus-4-8` and adaptive thinking, builds a
short context snapshot from the user's recent logs, and uses **structured
outputs** to return parseable food estimates from photos. If the API key is
absent or a call fails, it degrades gracefully to the offline path.

## Notes / next steps

- Auth uses JWTs with a 30-day TTL; set a strong `JWT_SECRET` in production.
- The food seed is a small starter set; the schema/search scale to a full
  nutrition dataset and barcode provider without changes.
- For production: move to Postgres, add rate limiting, refresh tokens, and
  HTTPS; never commit `.env`.
