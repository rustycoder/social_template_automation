# Social Media Template Automation

A web app for creating social media posts from templates — pick a design, fill fields or upload Excel, preview live, and export for Instagram, TikTok, Facebook, LinkedIn, and X.

![Built with](https://img.shields.io/badge/Built%20with-Vite-646CFF?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Features

- **Template gallery** — Built-in social post designs with live thumbnails
- **Single or bulk data** — Fill fields manually or upload Excel with matching columns
- **Sample Excel download** — Per-template `.xlsx` with correct headers and example row
- **Live preview** — See posts update as you type or browse Excel rows
- **Multi-format export** — Square, portrait, story, and landscape presets per platform
- **Template storage** — Custom template edits saved in the browser via localStorage
- **User accounts** — Sign up, sign in, and JWT-based sessions
- **Subscriptions** — Monthly and yearly plans gate template downloads
- **My Billing** — View current plan and full billing history from the profile menu
- **Auto-expiry cron** — Background job marks past-due subscriptions as expired

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)
- [MySQL](https://www.mysql.com/) (v8 or higher recommended)

### Installation

1. **Clone or navigate to the project directory:**

   ```bash
   cd /path/to/social-media-template-automation
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment:**

   Copy `.env.example` to `.env` and set your values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |----------|-------------|
   | `DB_HOST` | MySQL host (default `localhost`) |
   | `DB_PORT` | MySQL port (default `3306`) |
   | `DB_USER` | MySQL username |
   | `DB_PASSWORD` | MySQL password |
   | `DB_NAME` | Database name |
   | `PORT` | API server port (default `3001`) |
   | `JWT_SECRET` | Secret for signing auth tokens |
   | `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
   | `CORS_ORIGIN` | Frontend origin (default `http://localhost:3000`) |
   | `CRON_EXPIRE_SCHEDULE` | Cron expression for subscription expiry (default `0 * * * *`) |

4. **Set up the database:**

   ```bash
   npm run db:migrate
   ```

   This creates the database, tables, and seeds subscription plans. To reset everything:

   ```bash
   npm run db:reset
   ```

5. **Start the app:**

   ```bash
   npm run dev:all
   ```

   Or run each process separately:

   ```bash
   npm run dev:server   # API on http://localhost:3001
   npm run dev          # Frontend on http://localhost:3000
   npm run cron         # Subscription expiry cron (optional)
   ```

6. **Open in browser:**

   The app opens at [http://localhost:3000](http://localhost:3000).

## Subscriptions

| Plan | Price |
|------|-------|
| Monthly Pro | $50/month |
| Yearly Pro | $499/year |

### Access rules

- **Browse templates** — Free, no login required
- **Download exports** — Requires an active subscription
- **Expired subscription** — Downloads blocked; subscribe popup appears

### User flow

1. Browse and customize templates freely
2. Click **Download** on the export step
3. If not signed in → sign-in modal
4. If signed in without a subscription → subscribe modal
5. After subscribing → downloads are unlocked

> Payment integration (Stripe, etc.) can be added to `POST /api/subscriptions/subscribe`. Currently subscriptions activate immediately for development.

## Subscription Expiry Cron

A background job sets `status = 'expired'` on subscriptions where `expires_at` has passed.

### Run the cron daemon

Checks on a schedule (default: every hour) and runs once immediately on startup:

```bash
npm run cron
```

### Run once manually

Useful for testing or a system crontab entry:

```bash
npm run cron:expire
```

### Configure schedule

In `.env`:

```
CRON_EXPIRE_SCHEDULE=0 * * * *
```

| Expression | Frequency |
|------------|-----------|
| `0 * * * *` | Every hour (default) |
| `*/15 * * * *` | Every 15 minutes |
| `0 0 * * *` | Daily at midnight |

### Production

Run `npm run cron` as a separate process alongside the API server:

```bash
npm run dev:server
npm run cron
```

Or add to system crontab:

```bash
0 * * * * cd /path/to/project && npm run cron:expire
```

### What happens when a subscription expires

1. Cron (or API on next check) updates the database row to `status = 'expired'`
2. Frontend refreshes subscription status from the API when opening **My Billing** or before **Download**
3. API returns `hasActiveSubscription: false` and `subscriptionExpired: true`
4. Profile dropdown shows **Expired**
5. Downloads are blocked and the subscribe modal shows a renewal message
6. **My Billing** shows the record with **Expired** status

### Frontend subscription checks

The app always fetches fresh subscription status from the API (not cached) in these cases:

- **Before download** — calls `/api/auth/me`, blocks export if expired
- **My Billing page** — refreshes status and billing history on open
- **Profile dropdown** — updates badge when subscription state changes

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite frontend dev server |
| `npm run dev:server` | Start the API server (`http://localhost:3001`) |
| `npm run dev:all` | Start frontend and API together |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production build locally |
| `npm run db:migrate` | Run pending database migrations |
| `npm run db:reset` | Drop all tables and re-run migrations |
| `npm run cron` | Start the subscription expiry cron daemon |
| `npm run cron:expire` | Run the expiry check once and exit |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Sign in |
| `GET` | `/api/auth/me` | ✓ | Current user + subscription |
| `GET` | `/api/subscriptions/plans` | — | List available plans |
| `GET` | `/api/subscriptions/status` | ✓ | Active subscription status |
| `GET` | `/api/subscriptions/billing` | ✓ | Current plan + billing history |
| `POST` | `/api/subscriptions/subscribe` | ✓ | Activate a subscription |

## How to Use

### Step 1: Choose a Template

Click a template card to open the data step. Each template defines its own fields (headline, images, tags, etc.).

### Step 2: Enter Data

- **Single Post** — Fill the form; the live preview updates as you type.
- **Bulk (Excel)** — Download the sample Excel for your template, add rows, then upload. Column names must match template field keys (e.g. `HEADLINE`, `PHOTO`).

### Step 3: Export

Select platform presets (Instagram, TikTok, Facebook, LinkedIn, X), then export PNG images or video where supported. An active subscription is required to download.

### Account & Billing

- Click your **profile** (top right) to open the dropdown
- **My Billing** — View current plan and billing history
- **Sign out** — End your session

## Production Build

```bash
npm run build
npm run preview
```

The API server (`npm run dev:server`) and cron (`npm run cron`) run independently and are not included in the Vite build.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Vite](https://vite.dev/) | Dev server and frontend build |
| [Express](https://expressjs.com/) | REST API server |
| [MySQL](https://www.mysql.com/) | User accounts, subscriptions, billing |
| [node-cron](https://github.com/node-cron/node-cron) | Scheduled subscription expiry |
| [ExcelJS](https://github.com/exceljs/exceljs) | Excel parsing and sample file generation |
| [CodeMirror 6](https://codemirror.net/) | Template HTML/CSS editor |

## Project Structure

```
social-media-template-automation/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── server/
│   ├── index.js              # API server entry
│   ├── cron.js               # Subscription expiry cron daemon
│   ├── config.js
│   ├── db.js
│   ├── migrate.js
│   ├── schema.sql
│   ├── jobs/
│   │   └── expireSubscriptions.js
│   ├── migrations/
│   ├── middleware/
│   ├── routes/
│   │   ├── auth.js
│   │   └── subscriptions.js
│   └── services/
│       └── subscriptionService.js
└── src/
    ├── main.js
    ├── style.css
    ├── modules/
    │   ├── api.js
    │   ├── auth.js
    │   ├── authUI.js
    │   ├── billingUI.js
    │   ├── subscriptionUI.js
    │   └── ...
    └── templates/social/
```
