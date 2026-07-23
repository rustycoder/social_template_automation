# Backend — Social Template API

Express API for auth, subscriptions, templates, posts, payments (MPGS), and social connections.

## Prerequisites

- Node.js 18+
- MySQL / MariaDB

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before seeding the admin user.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API on port `3001` |
| `npm start` | Same as `dev` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:reset` | Drop all tables and re-migrate |
| `npm run db:seed` | Seed plans, categories, templates, admin |
| `npm run cron` | Subscription expiry cron daemon |
| `npm run cron:expire` | Run expiry check once |

## Environment

See `.env.example`. Important values:

- `PORT` — API port (default `3001`)
- `CORS_ORIGIN` / `APP_URL` — frontend origin (default `http://localhost:3000`)
- `DB_*` — MySQL connection
- `JWT_SECRET` — auth token secret
- MPGS and OAuth vars for payments / social connect

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
    ├── middleware/
    ├── payment-gateway/
    └── jobs/
```
