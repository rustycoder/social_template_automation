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

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### Installation

1. **Clone or navigate to the project directory:**

   ```bash
   cd /path/to/social-media-template-automation
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up MySQL:**

   Copy `.env.example` to `.env` and set your database credentials:

   ```bash
   cp .env.example .env
   ```

   Create the database and tables:

   ```bash
   npm run db:setup
   ```

   Or run migrations after the initial setup:

   ```bash
   npm run db:migrate
   ```

4. **Start the app (frontend + API):**

   ```bash
   npm run dev:all
   ```

   Or run separately in two terminals:

   ```bash
   npm run dev:server   # API on http://localhost:3001
   npm run dev          # Frontend on http://localhost:3000
   ```

5. **Open in browser:**

   The app opens at [http://localhost:3000](http://localhost:3000).

### Subscriptions

- **Monthly Pro** — $50/month
- **Yearly Pro** — $499/year

Users can browse all templates for free. **Downloading exports requires an active subscription.** If a user clicks download without a subscription, a subscribe popup appears. Sign in (or create an account), then choose a plan to unlock downloads.

> Payment integration (Stripe, etc.) can be added to `POST /api/subscriptions/subscribe`. Currently subscriptions activate immediately for development.

### Production Build

```bash
npm run build
npm run preview
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite frontend dev server |
| `npm run dev:server` | Start the API server (`http://localhost:3001`) |
| `npm run dev:all` | Start frontend and API together |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production build locally |
| `npm run db:setup` | Create the database and tables from `server/schema.sql` |
| `npm run db:migrate` | Run pending database migrations |
| `npm run db:reset` | Drop and recreate the database, then run all migrations |

## How to Use

### Step 1: Choose a Template

Click a template card to open the data step. Each template defines its own fields (headline, images, tags, etc.).

### Step 2: Enter Data

- **Single Post** — Fill the form; the live preview updates as you type.
- **Bulk (Excel)** — Download the sample Excel for your template, add rows, then upload. Column names must match template field keys (e.g. `HEADLINE`, `PHOTO`).

### Step 3: Export

Select platform presets (Instagram, TikTok, Facebook, LinkedIn, X), then export PNG images or video where supported.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Vite](https://vite.dev/) | Dev server and build |
| [ExcelJS](https://github.com/exceljs/exceljs) | Excel parsing and sample file generation |
| [html2canvas](https://html2canvas.hertzen.com/) | Post image rendering |
| [CodeMirror 6](https://codemirror.net/) | Template HTML/CSS editor |

## Project Structure

```
social-media-template-automation/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.js
    ├── style.css
    ├── modules/
    └── templates/social/
```
# social_template_automation
