# Lydia's Moving Sale

A shareable moving sale site with a pan/zoom canvas of items, friend claims, and admin tools.

## Stack

- Next.js 15 (App Router)
- Vercel Postgres (Neon) + Drizzle
- Vercel Blob (admin photo uploads, optional in dev)

## Local development

```bash
npm install
npm run migrate:jsx   # only if re-extracting images from moving-sale.jsx
npm run dev
```

Without `POSTGRES_URL`, the app uses a file-backed dev store (`.data/dev-state.json`) seeded from `scripts/seed-data.json`. Admin password defaults to `lydia` in dev.

## Production setup

1. Create a Vercel project and link the repo.
2. Add **Vercel Postgres** — copy `POSTGRES_URL` into env vars.
3. Set env vars:

   - `POSTGRES_URL`
   - `ADMIN_PASSWORD` — your private admin password
   - `SESSION_SECRET` — random 32+ char string
   - `ANTHROPIC_API_KEY` — optional, for Add Item AI auto-fill
   - `BLOB_READ_WRITE_TOKEN` — optional, for image uploads (from Vercel Blob)

4. Run migrations and seed:

   ```bash
   # Apply schema (use drizzle-kit push or run drizzle/0000_init.sql in Neon SQL editor)
   npm run db:push
   npm run db:seed
   ```

5. Deploy: push to GitHub or `vercel --prod`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run migrate:jsx` | Extract images + seed JSON from prototype JSX |
| `npm run db:seed` | Seed Postgres from `scripts/seed-data.json` |
| `npm run db:push` | Push Drizzle schema to database |

## Admin

Long-press the title to unlock admin mode. Mark items sold, edit prices, or add new listings with photo AI assist.
