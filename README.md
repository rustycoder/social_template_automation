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

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open in browser:**

   The app will open at the URL shown in the terminal (typically [http://localhost:5173](http://localhost:5173)).

### Production Build

```bash
npm run build
npm run preview
```

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
