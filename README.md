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
| `APP_URL` | Public app URL for MPGS payment return redirect |
| `MPGS_MERCHANT_ID` | MPGS merchant ID |
| `MPGS_API_PASSWORD` | MPGS API password |
| `MPGS_API_VERSION` | MPGS REST API version (default `74`) |
| `MPGS_REGION` | Gateway region: `TEST`, `NA`, `AP`, `EU` |
| `MPGS_CURRENCY` | Payment currency (default `USD`) |
| `MPGS_MERCHANT_NAME` | Merchant name shown on checkout |

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
5. After successful MPGS payment → subscription is activated and downloads are unlocked

Payments are processed via **MPGS Hosted Checkout** (Mastercard Payment Gateway). Configure credentials in `.env` — see [Payment Gateway](#payment-gateway-mpgs).

## Payment Gateway (MPGS)

Subscription purchases use [MPGS Hosted Checkout](https://developer.mastercard.com/) via `server/payment-gateway/` and `server/services/paymentService.js`.

### Configure `.env`

```
APP_URL=http://localhost:3000
MPGS_MERCHANT_ID=your_merchant_id
MPGS_API_PASSWORD=your_api_password
MPGS_API_VERSION=74
MPGS_REGION=TEST
MPGS_CURRENCY=USD
MPGS_MERCHANT_NAME=Social Media Template Automation
```

### Payment flow

1. User clicks **Subscribe** on a plan
2. API creates an MPGS checkout session (`POST /api/subscriptions/checkout`)
3. User is redirected to the MPGS hosted payment page
4. After payment, MPGS redirects back to `APP_URL/?checkout_return=1&orderId=...&resultIndicator=...`
5. Frontend verifies payment (`POST /api/subscriptions/checkout/verify`)
6. On success, subscription is activated in the database

### Run migration for payments table

```bash
npm run db:migrate
```

This applies `003_payment_transactions.sql` which stores pending/completed payment records.

> The legacy `POST /api/subscriptions/subscribe` endpoint remains for development only. Production subscribe buttons use the MPGS checkout flow.

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
| `POST` | `/api/subscriptions/checkout` | ✓ | Create MPGS checkout session |
| `POST` | `/api/subscriptions/checkout/verify` | ✓ | Verify payment and activate subscription |
| `POST` | `/api/subscriptions/subscribe` | ✓ | Direct activate (dev only) |

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
│   ├── payment-gateway/        # MPGS payment gateway client
│   ├── middleware/
│   ├── routes/
│   │   ├── auth.js
│   │   └── subscriptions.js
│   └── services/
│       ├── paymentService.js
│       └── subscriptionService.js
└── src/
    ├── main.js
    ├── style.css
    ├── modules/
    │   ├── api.js
    │   ├── auth.js
    │   ├── authUI.js
    │   ├── billingUI.js
    │   ├── checkout.js
    │   ├── subscriptionUI.js
    │   └── ...
    └── templates/social/
```
