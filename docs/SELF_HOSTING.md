# How to Save the World — Self-Hosting a Sovereign Backend

The hub deployment at **https://howtosavetheworld.info** stays canonical — but your backend can be sovereign. Just like you bring your own AI key, you (or your community) can bring your own database: a free Supabase project that holds the lesson curriculum, runs the Echelon edge functions, and stores mission sync data under **your** control.

There are two ways to use a sovereign backend:

1. **Hub app + your backend** — keep using the hub-hosted frontend and point it at your Supabase project via **Settings → Data Sovereignty**. Zero hosting on your side beyond the free Supabase project.
2. **Fully self-hosted** — build and host your own frontend with your project's env vars baked in.

Both paths share the same backend setup, described below.

---

## 💰 The Cost Story

**$0.** Everything fits comfortably in Supabase's free tier:

- The database holds 96 lessons plus lightweight per-user sync rows — a few megabytes at most.
- Edge functions are pure relays: your users' AI keys travel with each request, so the AI cost stays on each user's own key. The functions themselves are well within free-tier invocation limits.

**One caveat:** free Supabase projects are **paused after ~7 days without traffic**. A paused project makes the app fall back to its local lesson JSON, but Echelon chat (edge functions) will fail until you restore it from the dashboard. Keep it alive with a scheduled ping — this repo ships a ready-made template at [`.github/workflows/supabase-keepalive.yml`](../.github/workflows/supabase-keepalive.yml). Fork it, swap in your project URL and anon key, and GitHub Actions will ping your REST API twice a week for free.

---

## Prerequisites

- A free account at [supabase.com](https://supabase.com)
- The [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase` or `brew install supabase/tap/supabase`)
- Node.js v18+ and this repository cloned locally:

```bash
git clone https://github.com/NeuroverseOS/HowToSaveTheWorld.git
cd neuroverseos
npm install
```

---

## Step 1 — Create a Free Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Pick any name (e.g. `my-neuroverse`), a strong database password, and a region near your community.
3. Once provisioned, note down from **Project Settings → API**:
   - **Project URL** — `https://<project-ref>.supabase.co`
   - **anon / publishable key** — safe to share with your community
   - **service_role key** — secret; only used for seeding, never ships to browsers

---

## Step 2 — Apply the Schema (Migrations)

The schema is **not** created by any script — it comes exclusively from the migrations in [`supabase/migrations/`](../supabase/migrations/). Link your project and push them:

```bash
supabase login
supabase link --project-ref <project-ref>   # the part before .supabase.co
supabase db push
```

This creates the `lessons`, `lesson_metadata`, `user_reflections`, and related tables with their RLS policies (lessons are world-readable, writes are protected).

---

## Step 3 — Deploy the Edge Functions

Echelon's chat, voice, transcription, and trait analysis run as Supabase edge functions. Deploy all four:

```bash
supabase functions deploy echelon-chat
supabase functions deploy echelon-speak
supabase functions deploy transcribe-audio
supabase functions deploy analyze-trait-unlocks
```

The repo's [`supabase/config.toml`](../supabase/config.toml) sets `verify_jwt = false` for all four functions — the CLI applies this on deploy, and it's required because operators call these functions with the publishable key plus their **own** AI provider key in headers (no Supabase auth session). No AI API secrets need to be configured on the server; keys travel with each request from each user's browser.

---

## Step 4 — Seed the Curriculum

Load the canonical 96-lesson curriculum from `public/lessons.json` into your database:

```bash
SUPABASE_URL=https://<project-ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
npm run seed
```

The seed script upserts all lessons (safe to re-run any time the curriculum updates) and updates `lesson_metadata` (`total_lessons`, bumps `lesson_version`). It runs no DDL — if you see a "relation does not exist" error, revisit Step 2.

---

## Step 5a — Use the Hub App with Your Backend (easiest)

1. Open the hub app (or any deployment of this PWA).
2. Go to **Settings → Data Sovereignty**.
3. Enter your **Project URL** and **anon/publishable key**.
4. Press **Connect**. The app validates the connection by counting lessons and reports "Connected — N lessons found", then reloads onto your backend.

From that point, that browser's database queries and edge-function calls target your project. Mission data syncs to your backend going forward (nothing is migrated automatically), and Echelon chat uses **your** deployed functions. **Reset to Hub** in the same section returns to the canonical backend at any time.

The override lives in `localStorage` (`neuroverse_supabase_url`, `neuroverse_supabase_anon_key`) — per browser, per device, just like AI keys.

## Step 5b — Or Host Your Own Frontend

Build the PWA with your project baked in as the default backend:

```bash
# .env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

```bash
npm run build
```

Deploy `dist/` to any static host (Netlify, Vercel, GitHub Pages, your own server). See [INSTALLATION.md](./INSTALLATION.md) for general deployment guidance and [CONFIGURATION.md](./CONFIGURATION.md) for all environment variables.

---

## Verifying Your Backend

- **Lessons:** `curl "https://<project-ref>.supabase.co/rest/v1/lessons?select=id&limit=1" -H "apikey: <anon-key>"` should return one row after seeding.
- **Functions:** the Supabase dashboard → Edge Functions should list all four functions; Echelon chat in a lesson exercises `echelon-chat` end-to-end.
- **In-app:** Settings → Data Sovereignty shows the active backend host and whether you're on Hub or Sovereign.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Connect says "no 'lessons' table exists" | Migrations not applied — run Step 2 |
| "Connected — 0 lessons found" | Seed not run — run Step 4 |
| Echelon chat fails, lessons load fine | Edge functions not deployed (Step 3), or project paused |
| Everything fails after a week idle | Free project paused — restore in dashboard, add the keep-alive workflow |
