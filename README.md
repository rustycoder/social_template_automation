# Backend — Social Template API

Express API for auth, subscriptions, templates, posts, payments (MPGS), and social connections.

## Prerequisites

- Node.js 18+
- MySQL / MariaDB
- Chrome/Chromium (for PNG rendering via Puppeteer)

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run browsers:install   # installs Chrome for Puppeteer if needed
npm run db:migrate
npm run db:seed
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before seeding the admin user.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API on port `3001` |
| `npm start` | Migrate, seed, then start |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:reset` | Drop all tables and re-migrate |
| `npm run db:seed` | Seed plans, categories, templates, admin |
| `npm run browsers:install` | Install Puppeteer Chrome |
| `npm run cron` | Subscription expiry cron daemon |
| `npm run cron:expire` | Run expiry check once |

## Environment

See `.env.example`. Important values:

- `PORT` — API port (default `3001`)
- `CORS_ORIGIN` / `APP_URL` — frontend origin (default `http://localhost:3000`)
- `DB_*` — MySQL connection
- `JWT_SECRET` — auth token secret
- `CHROME_PATH` / `PUPPETEER_EXECUTABLE_PATH` — optional Chrome binary for rendering
- `RENDER_ASSET_ORIGIN` — origin used to load `/uploads` inside Chromium (default `http://127.0.0.1:$PORT`)
- MPGS and OAuth vars for payments / social connect

## Rendering

Pixel-perfect PNG export runs **on the API** with Puppeteer in a **child worker** (stdin isolated from the API process — avoids `open EEXIST` on hosts like LiteSpeed):

- `POST /api/render` — `{ template_id, field_data, format_bucket }` → `image/png` (auth + active subscription)
- `POST /api/posts` — if no `image` file is uploaded, the server renders from `template_id` + `field_data` + `format_bucket`

Live gallery previews stay in the browser (Shadow DOM); only export/save uses Chromium.

## Layout

```
backend/
├── .env.example
├── package.json
├── seed-data/templates/   # HTML + registries used by db:seed
├── scripts/               # template codegen
├── uploads/               # rendered post images
└── src/
    ├── index.js
    ├── config.js
    ├── cron.js
    ├── database/
    ├── routes/
    ├── services/
    │   └── render/        # Puppeteer compose + screenshot
    ├── middleware/
    ├── payment-gateway/
    └── jobs/
```
