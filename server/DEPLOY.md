# Deploying the backend to Railway

The API is a Node/Express app in `server/` using SQLite. These steps deploy it
on Railway with persistent storage.

## 1. Create the service
1. Railway → **New Project → Deploy from GitHub repo** → pick this repo and the
   branch you want (e.g. `claude/wizardly-archimedes-V9dPZ`).
2. Open the service → **Settings → Root Directory** → set to **`server`**.
   (The backend lives in a subfolder, so Railway must build from there.)

Railway auto-detects Node (Nixpacks) and uses `railway.json`:
`npm install` → `npm run build` → `npm run start`, with a health check on
`/api/health`.

## 2. Add a Volume (so the SQLite database persists)
Railway's filesystem is ephemeral, so the DB must live on a Volume:
1. Service → **Variables/Settings → Volumes → New Volume**.
2. Mount path: **`/data`**.

## 3. Set environment variables
Service → **Variables** → add:

| Variable | Value | Notes |
|---|---|---|
| `JWT_SECRET` | a long random string | required |
| `ADMIN_EMAIL` | your admin login email | creates/promotes the admin |
| `ADMIN_PASSWORD` | a strong password | admin login password |
| `DATABASE_PATH` | `/data/fitness.db` | points SQLite at the Volume |
| `ANTHROPIC_API_KEY` | (optional) | enables the AI coach |
| `CORS_ORIGINS` | (optional) | comma-separated admin + app URLs, e.g. `https://admin.yourbrand.com,https://app.yourbrand.com` |

`PORT` is provided by Railway automatically — don't set it.

## 4. Deploy & get the URL
1. Trigger a deploy (push or **Deploy**).
2. Service → **Settings → Networking → Generate Domain**.
3. Test it: open `https://<your-domain>/api/health` → `{"ok":true,...}`.

## 5. Point the apps at the API
- **Admin** (`admin/`): set `VITE_API_URL=https://<your-domain>` and deploy
  (Vercel/Netlify/Railway static). Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- **Customer app**: will read `EXPO_PUBLIC_API_URL=https://<your-domain>` (wired
  in the next stage).

## Scaling note
SQLite + a Volume is perfect to launch. When you outgrow it, add Railway
**Postgres** and we swap the data layer behind the same API — no app changes.
