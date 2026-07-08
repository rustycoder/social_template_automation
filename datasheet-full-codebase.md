# DataSheet — Excel to PDF Generator (Full Codebase)

> A sleek web application that reads Excel files (with embedded images), lets you design PDF templates using HTML/CSS with a live code editor, and generates downloadable PDFs.

---

## Table of Contents

1. [File: .gitignore](#file-gitignore)
2. [File: package.json](#file-packagejson)
3. [File: vite.config.js](#file-viteconfigjs)
4. [File: index.html](#file-indexhtml)
5. [File: src/main.js](#file-srcmainjs)
6. [File: src/style.css](#file-srcstylecss)
7. [File: src/modules/csvParser.js](#file-srcmodulescsvparserjs)
8. [File: src/modules/templateEditor.js](#file-srcmodulestemplateeditorjs)
9. [File: src/modules/templateStore.js](#file-srcmodulestemplatestorejs)
10. [File: src/modules/pdfGenerator.js](#file-srcmodulespdfgeneratorjs)
11. [File: src/templates/azoogiDatasheet.js](#file-srctemplatesazoogidatasheetjs)
12. [File: src/templates/heistSocialPost.js](#file-srctemplatesheistsocialpostjs)

---

## File: `.gitignore`

```js
# Dependency directories
node_modules/

# Build outputs
dist/

# System files
.DS_Store
Thumbs.db
git_helper.js
generate_excel.js
public/sample-datasheet.xlsx

# Local env files
.env*.local

# Editor directories
.vscode/
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

```

---

## File: `package.json`

```json
{
  "name": "datasheet-pdf-generator",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^6.0.0"
  },
  "dependencies": {
    "@codemirror/lang-css": "^6.3.1",
    "@codemirror/lang-html": "^6.4.9",
    "@codemirror/theme-one-dark": "^6.1.2",
    "codemirror": "^6.0.1",
    "exceljs": "^3.4.0",
    "html2pdf.js": "^0.14.0"
  }
}

```

---

## File: `vite.config.js`

```js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true,
    port: 3000,
  },
});

```

---

## File: `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Excel to PDF Generator — Upload Excel files with embedded images, design templates with HTML/CSS, and generate beautiful PDFs instantly." />
  <title>DataSheet — Excel to PDF Generator</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/src/style.css" />
  <script>
    window.global = window;
  </script>
</head>
<body>
  <div id="app">
    <!-- Header -->
    <header id="app-header">
      <div class="header-left">
        <div class="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
            <path d="M8 10h16M8 16h12M8 22h14" stroke="#fff" stroke-width="2" stroke-linecap="round" />
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
                <stop stop-color="#6366f1" />
                <stop offset="1" stop-color="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <h1>DataSheet</h1>
        </div>
        <p class="tagline">Excel → PDF, beautifully.</p>
      </div>
      <nav class="header-nav">
        <div class="step-indicators" id="step-indicators">
          <button class="step-btn active" data-step="1">
            <span class="step-num">1</span>
            <span class="step-label">Upload</span>
          </button>
          <div class="step-connector"></div>
          <button class="step-btn" data-step="2">
            <span class="step-num">2</span>
            <span class="step-label">Design</span>
          </button>
          <div class="step-connector"></div>
          <button class="step-btn" data-step="3">
            <span class="step-num">3</span>
            <span class="step-label">Export</span>
          </button>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main id="main-content">
      <!-- Step 1: Upload Excel -->
      <section class="step-panel active" id="step-1">
        <div class="panel-card">
          <div class="panel-header">
            <h2>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L14 6H11V12H9V6H6L10 2Z" fill="currentColor"/>
                <path d="M3 14V16C3 17.1 3.9 18 5 18H15C16.1 18 17 17.1 17 16V14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Upload Your Excel File
            </h2>
            <p class="panel-desc">Drag & drop or click to select your .xlsx file (supports embedded images)</p>
          </div>

          <div class="dropzone" id="csv-dropzone">
            <div class="dropzone-content">
              <div class="dropzone-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.4"/>
                  <path d="M24 14V34M14 24H34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <p class="dropzone-text">Drop your <strong>.xlsx</strong> file here</p>
              <p class="dropzone-subtext">or click to browse · supports embedded images</p>
            </div>
          </div>
          <input type="file" id="csv-file-input" accept=".xlsx,.xls" hidden />



          <div class="file-info hidden" id="file-info">
            <div class="file-badge">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 1H10L14 5V13C14 14.1 13.1 15 12 15H4C2.9 15 2 14.1 2 13V3C2 1.9 2.9 1 4 1Z" stroke="currentColor" stroke-width="1.2"/>
                <path d="M10 1V5H14" stroke="currentColor" stroke-width="1.2"/>
              </svg>
              <span id="file-name"></span>
              <span class="file-meta" id="file-meta"></span>
              <button class="btn-icon" id="remove-file" title="Remove file">✕</button>
            </div>
          </div>

          <!-- Data Preview Table -->
          <div class="data-preview hidden" id="data-preview">
            <div class="preview-header">
              <h3>Data Preview</h3>
              <span class="row-count" id="row-count"></span>
            </div>
            <div class="table-wrapper">
              <table id="preview-table">
                <thead id="preview-thead"></thead>
                <tbody id="preview-tbody"></tbody>
              </table>
            </div>
          </div>

          <!-- Template Showcase -->
          <div class="template-showcase" id="template-showcase">
            <div class="showcase-header">
              <h3>Select a Template</h3>
              <p>Choose a template to format your Excel data. You can customize the HTML/CSS design in the next step.</p>
            </div>
            <div class="template-grid">
              <!-- Template 1: Datasheet -->
              <div class="template-card" data-template="datasheet">
                <div class="template-preview-container">
                  <div class="mini-preview mini-datasheet">
                    <div class="mini-ds-header">
                      <div class="mini-ds-logo-left"></div>
                      <div class="mini-ds-logo-right"></div>
                    </div>
                    <div class="mini-ds-bar"></div>
                    <div class="mini-ds-title"></div>
                    <div class="mini-ds-body">
                      <div class="mini-ds-col-left">
                        <div class="mini-line-long"></div>
                        <div class="mini-line-short"></div>
                        <div class="mini-table">
                          <div class="mini-table-row"></div>
                          <div class="mini-table-row"></div>
                        </div>
                      </div>
                      <div class="mini-ds-col-right">
                        <div class="mini-img-main"></div>
                        <div class="mini-img-dim"></div>
                      </div>
                    </div>
                    <div class="mini-ds-footer"></div>
                  </div>
                </div>
                <div class="template-info">
                  <h4>Product Datasheet</h4>
                  <p>Clean, professional layout for product details, specifications table, and dimension diagrams. Ideal for catalogs and technical sheets.</p>
                  <button type="button" class="btn btn-outline btn-try-template">Select Template</button>
                </div>
              </div>

              <!-- Template 2: AI Heist Social Post Layout -->
              <div class="template-card" data-template="heist">
                <div class="template-preview-container">
                  <div class="mini-preview mini-heist">
                    <div class="mini-heist-bg"></div>
                    <div class="mini-heist-overlay"></div>
                    <div class="mini-heist-content">
                      <div class="mini-heist-badge">A<span>i</span></div>
                      <div class="mini-heist-headline"></div>
                      <div class="mini-heist-headline-sub"></div>
                      <div class="mini-heist-btn"></div>
                    </div>
                  </div>
                </div>
                <div class="template-info">
                  <h4>AI Heist Social Post</h4>
                  <p>Stunning, dark-themed social post template featuring large headlines, high contrast highlights, a custom badge, and swipe indicator.</p>
                  <button type="button" class="btn btn-outline btn-try-template">Select Template</button>
                </div>
              </div>

              <!-- Template 3: Certificate -->
              <div class="template-card" data-template="certificate">
                <div class="template-preview-container">
                  <div class="mini-preview mini-certificate">
                    <div class="mini-cert-frame">
                      <div class="mini-cert-pre"></div>
                      <div class="mini-cert-title"></div>
                      <div class="mini-cert-recipient"></div>
                      <div class="mini-cert-divider"></div>
                      <div class="mini-cert-desc"></div>
                      <div class="mini-cert-sigs">
                        <div class="mini-cert-sig"></div>
                        <div class="mini-cert-sig"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="template-info">
                  <h4>Award Certificate</h4>
                  <p>Elegant, formal certificate with border ornaments and classic typography. Perfect for awards, completion certificates, or diplomas.</p>
                  <button type="button" class="btn btn-outline btn-try-template">Select Template</button>
                </div>
              </div>

              <!-- Template 4: Invoice -->
              <div class="template-card" data-template="invoice">
                <div class="template-preview-container">
                  <div class="mini-preview mini-invoice">
                    <div class="mini-inv-header">
                      <div class="mini-inv-brand"></div>
                      <div class="mini-inv-meta"></div>
                    </div>
                    <div class="mini-inv-parties">
                      <div class="mini-inv-party"></div>
                      <div class="mini-inv-party"></div>
                    </div>
                    <div class="mini-inv-table-header"></div>
                    <div class="mini-inv-table-row"></div>
                    <div class="mini-inv-total"></div>
                    <div class="mini-inv-footer"></div>
                  </div>
                </div>
                <div class="template-info">
                  <h4>Business Invoice</h4>
                  <p>Modern billing invoice template with a distinct header bar, itemized pricing tables, tax details, and notes section.</p>
                  <button type="button" class="btn btn-outline btn-try-template">Select Template</button>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-actions">
            <button class="btn btn-primary" id="btn-to-design" disabled>
              Continue to Export
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Step 2: Template Editor -->
      <section class="step-panel" id="step-2">
        <div class="editor-layout">
          <!-- Left: Editors -->
          <div class="editor-pane">
            <div class="panel-card">
              <div class="panel-header">
                <h2>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 5L7 3L10 5L13 3L17 5V15L13 17L10 15L7 17L3 15V5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                  </svg>
                  Template Editor
                </h2>
                <div class="template-actions">
                  <select id="template-select" class="select-input">
                    <option value="default">Default Template</option>
                    <option value="datasheet">Data Sheet</option>
                    <option value="heist">AI Heist Social Post</option>
                    <option value="certificate">Award Certificate</option>
                    <option value="invoice">Business Invoice</option>
                  </select>
                  <button class="btn btn-ghost" id="btn-save-template" title="Save template">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M11 13H3C2.4 13 2 12.6 2 12V2C2 1.4 2.4 1 3 1H9L12 4V12C12 12.6 11.6 13 11 13Z" stroke="currentColor" stroke-width="1.2"/>
                      <path d="M4 1V5H9V1" stroke="currentColor" stroke-width="1.2"/>
                      <path d="M4 13V8H10V13" stroke="currentColor" stroke-width="1.2"/>
                    </svg>
                    Save
                  </button>
                </div>
              </div>

              <!-- Column Tags -->
              <div class="column-tags" id="column-tags">
                <span class="tags-label">Insert column:</span>
                <div class="tags-list" id="tags-list"></div>
              </div>

              <!-- Editor Tabs -->
              <div class="editor-tabs">
                <button class="tab-btn active" data-tab="html">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M4 4L1 7L4 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 4L13 7L10 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 2L6 12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  </svg>
                  HTML
                </button>
                <button class="tab-btn" data-tab="css">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M5 6C5 5.4 5.9 5 7 5C8.1 5 9 5.4 9 6C9 7 7 7 7 8V9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  </svg>
                  CSS
                </button>
              </div>

              <!-- Code Editors -->
              <div class="code-editor-wrapper">
                <div class="code-editor active" id="html-editor-container"></div>
                <div class="code-editor" id="css-editor-container"></div>
              </div>
            </div>

            <div class="panel-actions editor-actions">
              <button class="btn btn-ghost" id="btn-back-upload">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13 8H3M7 4L3 8L7 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Back
              </button>
              <button class="btn btn-primary" id="btn-to-export">
                Continue to Export
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Right: Live Preview -->
          <div class="preview-pane">
            <div class="panel-card preview-card">
              <div class="panel-header">
                <h3>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M1 5H17" stroke="currentColor" stroke-width="1.2"/>
                    <circle cx="3.5" cy="3" r="0.8" fill="currentColor"/>
                    <circle cx="5.5" cy="3" r="0.8" fill="currentColor"/>
                    <circle cx="7.5" cy="3" r="0.8" fill="currentColor"/>
                  </svg>
                  Live Preview
                </h3>
                <div class="preview-nav" aria-label="Row navigation">
                  <button type="button" class="preview-nav-btn" id="btn-prev-row" title="Previous row" disabled>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <div class="preview-nav-meta">
                    <span class="preview-nav-label">Row</span>
                    <span class="preview-nav-badge" id="preview-row-indicator">1 / 1</span>
                  </div>
                  <button type="button" class="preview-nav-btn" id="btn-next-row" title="Next row">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <span class="preview-format-tag">A4</span>
                </div>
              </div>
              <div class="preview-frame-wrapper">
                <div class="preview-mount" id="preview-mount" aria-label="Datasheet preview"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Step 3: Export -->
      <section class="step-panel" id="step-3">
        <div class="export-layout">
          <div class="panel-card export-settings">
            <div class="panel-header">
              <h2>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2V12M6 8L10 12L14 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M3 14V16C3 17.1 3.9 18 5 18H15C16.1 18 17 17.1 17 16V14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Export PDF
              </h2>
            </div>

            <div class="settings-grid hidden">
              <div class="setting-group">
                <label for="page-size">Page Size</label>
                <select id="page-size" class="select-input">
                  <option value="a4" selected>A4 (210 × 297mm)</option>
                  <option value="letter">Letter (8.5 × 11in)</option>
                  <option value="legal">Legal (8.5 × 14in)</option>
                </select>
              </div>

              <div class="setting-group">
                <label for="orientation">Orientation</label>
                <select id="orientation" class="select-input">
                  <option value="portrait" selected>Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div class="setting-group">
                <label for="margin">Margins</label>
                <select id="margin" class="select-input">
                  <option value="3" selected>Minimal (3mm)</option>
                  <option value="5">Narrow (5mm)</option>
                  <option value="10">Normal (10mm)</option>
                  <option value="20">Wide (20mm)</option>
                  <option value="0">None</option>
                </select>
              </div>

              <div class="setting-group">
                <label for="export-mode">Export Mode</label>
                <select id="export-mode" class="select-input">
                  <option value="all" selected>All rows (single PDF)</option>
                  <option value="range">Row range</option>
                </select>
              </div>

              <div class="setting-group range-group hidden" id="range-group">
                <label>Row Range</label>
                <div class="range-inputs">
                  <input type="number" id="range-start" class="text-input" placeholder="From" min="1" />
                  <span>to</span>
                  <input type="number" id="range-end" class="text-input" placeholder="To" min="1" />
                </div>
              </div>

              <div class="setting-group">
                <label for="filename-input">Filename</label>
                <input type="text" id="filename-input" class="text-input" value="datasheet-output" placeholder="filename" />
              </div>
            </div>

            <div class="export-actions">
              <button class="btn btn-ghost" id="btn-back-design">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13 8H3M7 4L3 8L7 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Back to Design
              </button>
              <button class="btn btn-primary btn-export" id="btn-generate-pdf">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2V12M5 8L9 12L13 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 14V15C2 15.6 2.4 16 3 16H15C15.6 16 16 15.6 16 15V14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Generate PDF
              </button>
            </div>

            <!-- Progress -->
            <div class="progress-section hidden" id="progress-section">
              <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
              </div>
              <p class="progress-text" id="progress-text">Generating...</p>
            </div>
          </div>

          <!-- Export Preview -->
          <div class="panel-card export-preview-card">
            <div class="panel-header">
              <h3>Preview</h3>
              <div class="preview-nav" aria-label="Row navigation">
                <button type="button" class="preview-nav-btn" id="btn-export-prev-row" title="Previous row" disabled>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div class="preview-nav-meta">
                  <span class="preview-nav-label">Row</span>
                  <span class="preview-nav-badge" id="export-row-indicator">1 / 1</span>
                </div>
                <button type="button" class="preview-nav-btn" id="btn-export-next-row" title="Next row">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <span class="preview-format-tag">A4</span>
              </div>
            </div>
            <div class="preview-frame-wrapper">
              <div class="preview-mount" id="export-preview-mount" aria-label="Datasheet preview"></div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Toast Notifications -->
    <div class="toast-container" id="toast-container"></div>
  </div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>

```

---

## File: `src/main.js`

```js
/**
 * DataSheet — Main Application Entry Point
 * Wires together all modules and handles navigation
 */
import './style.css';
import { ExcelParser } from './modules/csvParser.js';
import { TemplateStore } from './modules/templateStore.js';
import { TemplateEditor } from './modules/templateEditor.js';
import { PDFGenerator } from './modules/pdfGenerator.js';

class App {
  constructor() {
    this.currentStep = 1;

    // Initialize modules
    this.templateStore = new TemplateStore();
    this.csvParser = new ExcelParser();
    this.templateEditor = new TemplateEditor(this.templateStore);
    this.pdfGenerator = new PDFGenerator(this.csvParser, this.templateEditor);

    this._bindNavigation();
    this._bindToast();
    this._wireModules();
  }

  _wireModules() {
    // When Excel data is loaded, pass headers to the template editor
    this.csvParser.onDataLoaded = (headers, rows) => {
      this.templateEditor.setHeaders(headers);
      if (this.currentStep >= 2) {
        this.pdfGenerator.updatePreview();
      }
      if (this.currentStep === 3) {
        this.pdfGenerator.updateExportPreview();
      }
    };

    // When template content changes, update live preview
    this.templateEditor.onContentChange = () => {
      if (this.currentStep >= 2) {
        this.pdfGenerator.updatePreview();
      }
    };
  }



  _bindNavigation() {
    // Step indicator buttons
    const stepBtns = document.querySelectorAll('.step-btn');
    stepBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.step);
        // Only allow navigating to steps that are accessible
        if (step <= this._getMaxAccessibleStep()) {
          this._goToStep(step);
        }
      });
    });

    // Step 1 → Step 3
    document.getElementById('btn-to-design').addEventListener('click', () => {
      this._goToStep(3);
    });

    // Step 2 → Step 1 (back)
    document.getElementById('btn-back-upload').addEventListener('click', () => {
      this._goToStep(1);
    });

    // Step 2 → Step 3
    document.getElementById('btn-to-export').addEventListener('click', () => {
      this._goToStep(3);
    });

    // Step 3 → Step 2 (back)
    document.getElementById('btn-back-design').addEventListener('click', () => {
      this._goToStep(2);
    });

    // Template Selector Showcase click handlers
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach((card) => {
      card.addEventListener('click', () => {
        const templateKey = card.dataset.template;
        
        // Select template in the editor
        this.templateEditor.selectTemplate(templateKey);

        // If no file has been uploaded, load sample data
        if (this.csvParser.getRowCount() === 0) {
          this.csvParser.loadSampleData(templateKey);
        }

        // Advance to Step 2 (Design)
        this._goToStep(2);
      });
    });
  }

  _getMaxAccessibleStep() {
    if (this.csvParser.getRowCount() === 0) return 1;
    return 3;
  }

  _goToStep(step) {
    this.currentStep = step;

    // Update panels
    document.querySelectorAll('.step-panel').forEach((panel) => {
      panel.classList.remove('active');
    });
    document.getElementById(`step-${step}`).classList.add('active');

    // Update step indicators
    document.querySelectorAll('.step-btn').forEach((btn) => {
      const btnStep = parseInt(btn.dataset.step);
      btn.classList.remove('active', 'completed');
      if (btnStep === step) {
        btn.classList.add('active');
      } else if (btnStep < step) {
        btn.classList.add('completed');
      }
    });

    // Trigger preview updates when navigating
    if (step === 2) {
      const key = this.templateEditor.currentTemplateKey;
      if (
        (key === 'datasheet' || key === 'default') &&
        !this.templateEditor.getHTML().includes('{{CODE}}')
      ) {
        this.templateEditor.selectTemplate(key);
      }
      setTimeout(() => {
        this.pdfGenerator.updatePreview();
        requestAnimationFrame(() => {
          this.pdfGenerator._fitPreviewMount(this.pdfGenerator.previewMount);
        });
      }, 50);
    } else if (step === 3) {
      setTimeout(() => {
        this.pdfGenerator.updateExportPreview();
        requestAnimationFrame(() => {
          this.pdfGenerator._fitPreviewMount(this.pdfGenerator.exportPreviewMount);
        });
      }, 50);
    }
  }

  _bindToast() {
    const toastContainer = document.getElementById('toast-container');

    window.addEventListener('toast', (e) => {
      const { message, type } = e.detail;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;

      const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
      toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;

      toastContainer.appendChild(toast);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    });
  }


}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});

```

---

## File: `src/style.css`

```css
/* ============================================
   DataSheet — Design System & Styles
   ============================================ */

/* ---------- CSS Variables ---------- */
:root {
  /* Colors */
  --color-bg: #0a0a0f;
  --color-bg-raised: #12121a;
  --color-bg-card: #16161f;
  --color-bg-hover: #1e1e2a;
  --color-bg-input: #1a1a26;
  --color-border: #2a2a3a;
  --color-border-hover: #3a3a4f;
  --color-border-focus: #6366f1;

  --color-text: #e4e4ed;
  --color-text-muted: #8888a0;
  --color-text-dim: #55556a;

  --color-primary: #6366f1;
  --color-primary-hover: #818cf8;
  --color-primary-glow: rgba(99, 102, 241, 0.25);
  --color-primary-soft: rgba(99, 102, 241, 0.1);

  --color-accent: #a855f7;
  --color-accent-soft: rgba(168, 85, 247, 0.1);

  --color-success: #22c55e;
  --color-success-soft: rgba(34, 197, 94, 0.1);
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Gradient */
  --gradient-primary: linear-gradient(135deg, #6366f1, #a855f7);
  --gradient-bg: linear-gradient(180deg, #0a0a0f 0%, #0f0f18 100%);
  --gradient-card: linear-gradient(145deg, rgba(22, 22, 31, 0.9), rgba(18, 18, 26, 0.95));

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Sizing */
  --header-height: 64px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px var(--color-primary-glow);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ---------- Reset & Base ---------- */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-sans);
  background: var(--gradient-bg);
  color: var(--color-text);
  min-height: 100vh;
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ---------- Header ---------- */
#app-header {
  height: var(--header-height);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo h1 {
  font-size: 1.25rem;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  padding-left: 16px;
  border-left: 1px solid var(--color-border);
}

/* Step Indicators */
.step-indicators {
  display: flex;
  align-items: center;
  gap: 0;
}

.step-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-base);
  font-family: var(--font-sans);
  font-size: 0.8rem;
}

.step-btn:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text);
}

.step-btn.active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary-hover);
  box-shadow: var(--shadow-glow);
}

.step-btn.completed {
  background: var(--color-success-soft);
  border-color: var(--color-success);
  color: var(--color-success);
}

.step-num {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 600;
  background: var(--color-bg-hover);
}

.step-btn.active .step-num {
  background: var(--color-primary);
  color: #fff;
}

.step-btn.completed .step-num {
  background: var(--color-success);
  color: #fff;
}

.step-connector {
  width: 32px;
  height: 1px;
  background: var(--color-border);
}

.step-label {
  font-weight: 500;
}

/* ---------- Main Content ---------- */
#main-content {
  flex: 1;
  padding: 24px;
  position: relative;
}

/* Step Panels */
.step-panel {
  display: none;
  animation: fadeSlideIn 0.4s ease;
}

.step-panel.active {
  display: block;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---------- Panel Cards ---------- */
.panel-card {
  background: var(--gradient-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  backdrop-filter: blur(8px);
}

.panel-header {
  margin-bottom: 20px;
}

.panel-header h2,
.panel-header h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
}

.panel-header h2 svg,
.panel-header h3 svg {
  color: var(--color-primary-hover);
}

.panel-header .panel-desc {
  margin-top: 6px;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

/* ---------- Dropzone ---------- */
.dropzone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.dropzone::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.dropzone:hover,
.dropzone.drag-over {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.dropzone:hover::before,
.dropzone.drag-over::before {
  opacity: 0.04;
}

.dropzone-content {
  position: relative;
  z-index: 1;
}

.dropzone-icon {
  color: var(--color-text-dim);
  margin-bottom: 16px;
  transition: color var(--transition-base);
}

.dropzone:hover .dropzone-icon {
  color: var(--color-primary-hover);
}

.dropzone-text {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.dropzone-text strong {
  color: var(--color-primary-hover);
}

.dropzone-subtext {
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

/* File Info */
.file-info {
  margin-top: 16px;
}

.file-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--color-success-soft);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: var(--radius-md);
  color: var(--color-success);
  font-size: 0.85rem;
  font-weight: 500;
}

.file-meta {
  color: var(--color-text-dim);
  font-weight: 400;
}

/* ---------- Data Preview Table ---------- */
.data-preview {
  margin-top: 24px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.preview-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
}

.row-count {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background: var(--color-bg-hover);
  padding: 3px 10px;
  border-radius: var(--radius-sm);
}

.table-wrapper {
  overflow-x: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  max-height: 320px;
  overflow-y: auto;
}

.table-wrapper table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.table-wrapper th {
  position: sticky;
  top: 0;
  background: var(--color-bg-raised);
  color: var(--color-primary-hover);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.table-wrapper td {
  padding: 8px 14px;
  border-bottom: 1px solid rgba(42, 42, 58, 0.5);
  color: var(--color-text-muted);
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-wrapper tr:hover td {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* ---------- Buttons ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--gradient-primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.btn-ghost:hover:not(:disabled) {
  border-color: var(--color-border-hover);
  color: var(--color-text);
  background: var(--color-bg-hover);
}

.btn-export {
  padding: 14px 28px;
  font-size: 0.95rem;
  font-weight: 600;
}

.btn-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1rem;
  transition: all var(--transition-fast);
}

.btn-icon:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary-hover);
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.panel-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

/* ---------- Form Inputs ---------- */
.select-input,
.text-input {
  padding: 8px 12px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  transition: border-color var(--transition-fast);
  outline: none;
}

.select-input:focus,
.text-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 2px var(--color-primary-glow);
}

.select-input {
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%238888a0' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;
}

/* ---------- Editor Layout (Step 2) ---------- */
.editor-layout {
  display: grid;
  grid-template-columns: minmax(260px, 34%) minmax(0, 1fr);
  gap: 16px;
  height: calc(100vh - var(--header-height) - 48px);
}

.editor-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

.editor-layout .preview-pane {
  min-height: 0;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-layout > .editor-pane,
.editor-layout > .preview-pane {
  height: 100%;
  min-height: 0;
}

.editor-pane .panel-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-actions {
  justify-content: space-between;
}

/* Column Tags */
.column-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tags-label {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  white-space: nowrap;
}

.tags-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.column-tag {
  padding: 3px 10px;
  background: var(--color-accent-soft);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  font-size: 0.72rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.column-tag:hover {
  background: rgba(168, 85, 247, 0.2);
  border-color: var(--color-accent);
  transform: translateY(-1px);
}

/* Editor Tabs */
.editor-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 12px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  color: var(--color-text-dim);
  font-family: var(--font-sans);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--color-text-muted);
}

.tab-btn.active {
  background: var(--color-bg-input);
  border-color: var(--color-border);
  color: var(--color-text);
}

/* Code Editor */
.code-editor-wrapper {
  flex: 1;
  position: relative;
  min-height: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.code-editor {
  display: none;
  height: 100%;
}

.code-editor.active {
  display: block;
}

.code-editor .cm-editor {
  height: 100%;
  font-size: 0.82rem;
}

.code-editor .cm-editor .cm-scroller {
  font-family: var(--font-mono);
}

/* Template Actions */
.template-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ---------- Preview ---------- */
.preview-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.preview-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.preview-card .panel-header,
.export-preview-card .panel-header {
  flex-shrink: 0;
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0;
}

.preview-card .panel-header h3,
.export-preview-card .panel-header h3 {
  font-size: 0.95rem;
}

/* Row navigation */
.preview-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.preview-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-input);
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.preview-nav-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-border-hover);
  color: var(--color-primary-hover);
}

.preview-nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.preview-nav-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 52px;
  line-height: 1.2;
}

.preview-nav-label {
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-dim);
}

.preview-nav-badge {
  font-size: 0.88rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
}

.preview-format-tag {
  margin-left: 4px;
  padding: 4px 8px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-primary-hover);
  background: var(--color-primary-soft);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 999px;
}

/* Preview canvas — fills available height, scales A4 sheet to fit */
.preview-frame-wrapper {
  flex: 1 1 auto;
  min-height: 320px;
  height: 100%;
  margin-top: 8px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background:
    radial-gradient(ellipse 90% 60% at 50% 20%, rgba(99, 102, 241, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 70% 40% at 50% 100%, rgba(115, 191, 68, 0.06) 0%, transparent 50%),
    linear-gradient(168deg, #1e1e2c 0%, #0a0a10 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  position: relative;
}

.preview-mount {
  position: absolute;
  inset: 0;
  overflow: hidden;
  padding: 12px;
  background: transparent;
}

/* Sheet/page layout lives in preview shadow root (pdfGenerator PREVIEW_SHADOW_CSS) */

/* ---------- Export Layout (Step 3) ---------- */
.export-layout {
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: 16px;
  height: calc(100vh - var(--header-height) - 48px);
  align-items: stretch;
}

.export-settings {
  height: fit-content;
  align-self: start;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-group label {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.setting-group .select-input,
.setting-group .text-input {
  width: 100%;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-inputs .text-input {
  flex: 1;
}

.range-inputs span {
  color: var(--color-text-dim);
  font-size: 0.8rem;
}

.export-actions {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-preview-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.export-layout > .export-preview-card {
  min-height: 0;
}

.export-preview-card .preview-frame-wrapper {
  flex: 1 1 auto;
  min-height: 0;
  height: auto;
}

/* ---------- Progress ---------- */
.progress-section {
  margin-top: 20px;
}

.progress-bar {
  height: 6px;
  background: var(--color-bg-hover);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: 0%;
  background: var(--gradient-primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Off-screen PDF capture staging (opacity must stay 1 for html2canvas) */
#pdf-staging-root {
  position: fixed;
  left: 0;
  top: 0;
  transform: translateX(-100vw);
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
  opacity: 1;
  visibility: visible;
}

body.pdf-exporting {
  overflow: hidden;
}

body.pdf-exporting * {
  transition: none !important;
  animation: none !important;
}

body.pdf-exporting .progress-fill {
  transition: none !important;
}

.progress-text {
  margin-top: 8px;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  text-align: center;
}

/* ---------- Toast Notifications ---------- */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  padding: 12px 20px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 0.85rem;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 10px;
  animation: toastIn 0.3s ease;
  backdrop-filter: blur(12px);
}

.toast.success {
  border-color: rgba(34, 197, 94, 0.3);
}

.toast.error {
  border-color: rgba(239, 68, 68, 0.3);
}

.toast-icon {
  font-size: 1.1rem;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
}

/* ---------- Utility ---------- */
.hidden {
  display: none !important;
}

/* ---------- Responsive ---------- */
@media (max-width: 1024px) {
  .editor-layout {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(280px, auto) minmax(55vh, 1fr);
    height: auto;
  }

  .export-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .export-preview-card .preview-frame-wrapper {
    min-height: 60vh;
  }

  .preview-pane {
    order: 2;
  }

  .editor-pane {
    order: 1;
  }

  .preview-frame-wrapper {
    min-height: 55vh;
    padding: 12px;
  }

  .tagline {
    display: none;
  }
}

@media (max-width: 768px) {
  #app-header {
    flex-direction: column;
    height: auto;
    padding: 12px 16px;
    gap: 12px;
  }

  .step-label {
    display: none;
  }

  #main-content {
    padding: 12px;
  }

  .panel-card {
    padding: 16px;
  }

  .panel-header {
    flex-direction: column;
  }
}

/* ---------- Scrollbar ---------- */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}

/* ---------- Template Showcase ---------- */
.template-showcase {
  margin-top: 36px;
  border-top: 1px solid var(--color-border);
  padding-top: 30px;
  animation: fadeSlideIn 0.5s ease;
}

.showcase-header {
  margin-bottom: 24px;
}

.showcase-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 6px;
}

.showcase-header p {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.template-grid {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.template-card {
  background: var(--gradient-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  max-width: 380px;
  width: 100%;
}

.template-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow);
}

.template-preview-container {
  height: 180px;
  background: #0a0a0f;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
  position: relative;
}

.mini-preview {
  width: 120px;
  height: 160px;
  background: #ffffff;
  border-radius: 3px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  padding: 10px;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  font-size: 4px;
  line-height: 1;
  box-sizing: border-box;
}

/* Mini Datasheet Design */
.mini-datasheet {
  border-top: 3px solid #139B58;
}

.mini-ds-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  height: 6px;
}

.mini-ds-logo-left {
  width: 18px;
  height: 4px;
  background: #139B58;
  border-radius: 0.5px;
}

.mini-ds-logo-right {
  width: 16px;
  height: 4px;
  background: #003566;
  border-radius: 0.5px;
}

.mini-ds-bar {
  height: 1px;
  background: linear-gradient(90deg, #139B58 0%, #8BC34A 100%);
  margin-bottom: 6px;
}

.mini-ds-title {
  width: 45px;
  height: 3px;
  background: #139B58;
  margin-bottom: 8px;
  border-radius: 0.5px;
}

.mini-ds-body {
  display: flex;
  gap: 6px;
  flex: 1;
  min-height: 0;
}

.mini-ds-col-left {
  width: 60%;
  display: flex;
  flex-direction: column;
  gap: 2.5px;
}

.mini-line-long {
  width: 100%;
  height: 1.5px;
  background: #e2e8f0;
  border-radius: 0.3px;
}

.mini-line-short {
  width: 70%;
  height: 1.5px;
  background: #e2e8f0;
  border-radius: 0.3px;
}

.mini-table {
  margin-top: 4px;
  border: 0.5px solid #cbd5e1;
  border-radius: 1px;
  padding: 1.5px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mini-table-row {
  height: 1.5px;
  background: #f1f5f9;
  border-radius: 0.2px;
}

.mini-ds-col-right {
  width: 40%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mini-img-main {
  width: 100%;
  height: 28px;
  background: #f8fafc;
  border: 0.5px solid #e2e8f0;
  border-radius: 1.5px;
  background-image: radial-gradient(circle, #94a3b8 1px, transparent 1px);
  background-size: 8px 8px;
  background-position: center;
}

.mini-img-dim {
  width: 100%;
  height: 22px;
  background: #f8fafc;
  border: 0.5px solid #e2e8f0;
  border-radius: 1.5px;
  background-image: linear-gradient(45deg, #f1f5f9 25%, transparent 25%, transparent 75%, #f1f5f9 75%), linear-gradient(45deg, #f1f5f9 25%, transparent 25%, transparent 75%, #f1f5f9 75%);
  background-size: 6px 6px;
  background-position: 0 0, 3px 3px;
}

.mini-ds-footer {
  height: 6px;
  background: #1e293b;
  margin-top: auto;
  border-radius: 0.5px;
  width: 100%;
}

/* Mini Heist Design */
.mini-heist {
  background: #0f1115;
  border: 1px solid #1a1d24;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 8px;
  box-sizing: border-box;
}

.mini-heist-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 65%;
  background: linear-gradient(135deg, #1e293b, #0f172a);
}

.mini-heist-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 35%, #000000 65%);
}

.mini-heist-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 100%;
}

.mini-heist-badge {
  color: #ffffff;
  font-size: 5px;
  font-weight: bold;
  letter-spacing: -0.2px;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
}

.mini-heist-badge span {
  font-style: italic;
  font-weight: normal;
}

.mini-heist-headline {
  width: 80px;
  height: 4px;
  background: #ffffff;
  border-radius: 0.5px;
}

.mini-heist-headline-sub {
  width: 60px;
  height: 4px;
  background: #2ce2cc;
  border-radius: 0.5px;
  margin-bottom: 6px;
}

.mini-heist-btn {
  width: 40px;
  height: 5px;
  border: 0.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
}

/* Mini Certificate Design */
.mini-certificate {
  background: #fdfcfa;
  border: 1px solid #e2e8f0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.mini-cert-frame {
  width: 100%;
  height: 100%;
  border: 1px double #d97706;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.mini-cert-pre {
  width: 25px;
  height: 1px;
  background: #d97706;
  margin-bottom: 2px;
}

.mini-cert-title {
  width: 45px;
  height: 3px;
  background: #1e293b;
  margin-bottom: 12px;
}

.mini-cert-recipient {
  width: 50px;
  height: 4px;
  background: #d97706;
  margin-bottom: 3px;
  border-radius: 0.5px;
}

.mini-cert-divider {
  width: 25px;
  height: 0.5px;
  background: #d97706;
  margin-bottom: 8px;
}

.mini-cert-desc {
  width: 70px;
  height: 14px;
  background-image: linear-gradient(180deg, #94a3b8 1px, transparent 1px, transparent 3px, #94a3b8 3px, #94a3b8 4px, transparent 4px, transparent 6px, #94a3b8 6px, #94a3b8 7px, transparent 7px);
  margin-bottom: 14px;
}

.mini-cert-sigs {
  width: 100%;
  display: flex;
  justify-content: space-around;
  margin-top: auto;
}

.mini-cert-sig {
  width: 22px;
  height: 0.8px;
  background: #475569;
}

/* Mini Invoice Design */
.mini-invoice {
  padding: 8px;
}

.mini-inv-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  border-bottom: 0.8px solid #6366f1;
  padding-bottom: 3px;
}

.mini-inv-brand {
  width: 24px;
  height: 3.5px;
  background: #6366f1;
}

.mini-inv-meta {
  width: 16px;
  height: 3.5px;
  background: #cbd5e1;
}

.mini-inv-parties {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  width: 100%;
}

.mini-inv-party {
  width: 32px;
  height: 12px;
  background-image: linear-gradient(180deg, #6366f1 1px, transparent 1px, transparent 3px, #94a3b8 3px, #94a3b8 4px, transparent 4px, transparent 6px, #94a3b8 6px, #94a3b8 7px, transparent 7px);
}

.mini-inv-table-header {
  height: 4.5px;
  background: #6366f1;
  border-radius: 0.5px;
  margin-bottom: 3px;
  width: 100%;
}

.mini-inv-table-row {
  height: 4px;
  border-bottom: 0.5px solid #f1f5f9;
  margin-bottom: 3px;
  width: 100%;
  background-image: linear-gradient(90deg, #64748b 60%, transparent 60%, transparent 80%, #6366f1 80%);
}

.mini-inv-total {
  width: 45px;
  height: 6px;
  background: #f8f9ff;
  border: 0.5px solid #6366f1;
  border-radius: 1px;
  align-self: flex-end;
  margin-top: 4px;
  margin-bottom: 12px;
  background-image: linear-gradient(90deg, #475569 40%, transparent 40%, transparent 60%, #6366f1 60%);
  background-size: 100% 3px;
  background-repeat: no-repeat;
  background-position: center;
}

.mini-inv-footer {
  height: 4.5px;
  background: #e2e8f0;
  width: 100%;
  margin-top: auto;
  border-radius: 0.5px;
}

/* Template Card Info */
.template-info {
  padding: 18px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.template-info h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.template-info p {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  line-height: 1.4;
  margin-bottom: 18px;
  flex: 1;
}

.btn-try-template {
  width: 100%;
  justify-content: center;
  border-color: var(--color-border);
  color: var(--color-text-muted);
}

.btn-try-template:hover {
  background: var(--color-primary-soft) !important;
  border-color: var(--color-primary) !important;
  color: var(--color-primary-hover) !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .template-grid {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
}


```

---

## File: `src/modules/csvParser.js`

```js
/**
 * Excel Parser Module
 * Handles file upload (drag & drop + file picker) and Excel parsing via ExcelJS
 * Extracts embedded images from Picture and Dimension columns
 */
import ExcelJS from 'exceljs';

export class ExcelParser {
  constructor() {
    this.data = null;
    this.headers = [];
    this.rows = [];
    this.fileName = '';
    this.onDataLoaded = null;
    /** @type {Set<string>} columns that contain images (lowercase) */
    this.imageColumns = new Set();

    this._bindElements();
    this._bindEvents();
  }

  _bindElements() {
    this.dropzone = document.getElementById('csv-dropzone');
    this.fileInput = document.getElementById('csv-file-input');
    this.fileInfo = document.getElementById('file-info');
    this.fileNameEl = document.getElementById('file-name');
    this.fileMetaEl = document.getElementById('file-meta');
    this.removeFileBtn = document.getElementById('remove-file');
    this.dataPreview = document.getElementById('data-preview');
    this.previewThead = document.getElementById('preview-thead');
    this.previewTbody = document.getElementById('preview-tbody');
    this.rowCount = document.getElementById('row-count');
    this.btnToDesign = document.getElementById('btn-to-design');
  }

  _bindEvents() {
    // Dropzone click → open file picker
    this.dropzone.addEventListener('click', () => this.fileInput.click());

    // Prevent click events on the file input from bubbling up to the dropzone
    this.fileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // File input change
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this._handleFile(e.target.files[0]);
      }
    });

    // Drag & drop
    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('drag-over');
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('drag-over');
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        this._handleFile(e.dataTransfer.files[0]);
      }
    });

    // Remove file
    this.removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._reset();
    });
  }

  async _handleFile(file) {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      this._showError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    this.fileName = file.name;
    const fileSizeKB = (file.size / 1024).toFixed(1);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        this._showError('No worksheet found in the Excel file');
        return;
      }

      // Extract headers from row 1
      this.headers = [];
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        this.headers[colNumber - 1] = cell.value?.toString().trim() || `Column ${colNumber}`;
      });

      // Fill any gaps in headers
      const maxCol = this.headers.length;
      for (let i = 0; i < maxCol; i++) {
        if (!this.headers[i]) this.headers[i] = `Column ${i + 1}`;
      }

      // Extract data rows (starting from row 2)
      this.rows = [];
      const rowCount = worksheet.rowCount;
      for (let r = 2; r <= rowCount; r++) {
        const row = worksheet.getRow(r);
        const rowData = {};
        let hasData = false;

        this.headers.forEach((header, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          const value = cell.value;

          if (value !== null && value !== undefined && value !== '') {
            hasData = true;
          }

          // Handle different cell value types
          if (value && typeof value === 'object') {
            if (value.richText) {
              // Rich text: concatenate all parts
              rowData[header] = value.richText.map((rt) => rt.text).join('');
            } else if (value.text) {
              rowData[header] = value.text;
            } else if (value.result !== undefined) {
              rowData[header] = value.result?.toString() ?? '';
            } else {
              rowData[header] = value.toString();
            }
          } else {
            rowData[header] = value?.toString() ?? '';
          }
        });

        if (hasData) {
          this.rows.push(rowData);
        }
      }

      // Extract embedded images and map them to cells
      this.imageColumns.clear();
      await this._extractImages(workbook, worksheet);

      // Update UI
      this.fileNameEl.textContent = this.fileName;
      this.fileMetaEl.textContent = `${fileSizeKB} KB · ${this.rows.length} rows · ${this.headers.length} columns`;
      this.fileInfo.classList.remove('hidden');
      this.dropzone.style.display = 'none';

      this._renderPreview();
      this.btnToDesign.disabled = false;

      if (this.onDataLoaded) {
        this.onDataLoaded(this.headers, this.rows);
      }
    } catch (error) {
      console.error('Excel parse error:', error);
      this._showError(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Extract embedded images from the worksheet and map them to data rows.
   * Images are converted to base64 data URLs and stored in the row data.
   */
  async _extractImages(workbook, worksheet) {
    const images = worksheet.getImages();

    if (!images || images.length === 0) {
      console.log('No embedded images found in worksheet');
      return;
    }

    for (const imageInfo of images) {
      try {
        const imageId = imageInfo.imageId;
        const image = workbook.getImage(imageId);

        if (!image || !image.buffer) continue;

        // Get the cell position (0-indexed) with fallback to floating coordinates
        const col = imageInfo.range.tl.nativeCol !== undefined ? imageInfo.range.tl.nativeCol : (imageInfo.range.tl.col !== undefined ? Math.floor(imageInfo.range.tl.col) : undefined);
        const row = imageInfo.range.tl.nativeRow !== undefined ? imageInfo.range.tl.nativeRow : (imageInfo.range.tl.row !== undefined ? Math.floor(imageInfo.range.tl.row) : undefined);

        if (col === undefined || row === undefined) continue;

        // Row 0 = header row, so data row index = row - 1
        const dataRowIndex = row - 1;
        const header = this.headers[col];

        if (dataRowIndex < 0 || dataRowIndex >= this.rows.length || !header) continue;

        // Convert image buffer to base64 data URL
        const ext = image.extension || 'png';
        const mimeType = this._getMimeType(ext);
        const base64 = this._arrayBufferToBase64(image.buffer);
        const dataUrl = `data:${mimeType};base64,${base64}`;

        // Store the image data URL in the row data
        this.rows[dataRowIndex][header] = dataUrl;
        this.imageColumns.add(header.toLowerCase());
      } catch (e) {
        console.warn('Failed to extract image:', e);
      }
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Get MIME type from file extension
   */
  _getMimeType(ext) {
    const types = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      tiff: 'image/tiff',
      emf: 'image/emf',
      wmf: 'image/wmf',
    };
    return types[ext.toLowerCase()] || 'image/png';
  }

  /**
   * Check if a column contains image data
   */
  isImageColumn(header) {
    return this.imageColumns.has(header.toLowerCase());
  }

  _renderPreview() {
    // Header row
    const headerRow = document.createElement('tr');
    this.headers.forEach((h) => {
      const th = document.createElement('th');
      th.textContent = h;
      if (this.isImageColumn(h)) {
        th.textContent += ' 🖼️';
      }
      headerRow.appendChild(th);
    });
    this.previewThead.innerHTML = '';
    this.previewThead.appendChild(headerRow);

    // Data rows (show max 50 for performance)
    this.previewTbody.innerHTML = '';
    const previewRows = this.rows.slice(0, 50);
    previewRows.forEach((row) => {
      const tr = document.createElement('tr');
      this.headers.forEach((h) => {
        const td = document.createElement('td');
        const value = row[h] ?? '';

        // Render image thumbnail if it's a data URL
        if (value.startsWith('data:image/')) {
          const img = document.createElement('img');
          img.src = value;
          img.style.maxWidth = '60px';
          img.style.maxHeight = '40px';
          img.style.borderRadius = '4px';
          img.style.objectFit = 'cover';
          img.style.verticalAlign = 'middle';
          td.appendChild(img);
          td.style.padding = '4px 14px';
        } else if (h.trim().toLowerCase() === 'specs' && value.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(value.replace(/""/g, '"'));
            const keys = Object.keys(parsed);
            td.textContent = keys.length
              ? `${keys.length} fields (${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '…' : ''})`
              : value;
            td.title = value;
          } catch {
            td.textContent = value;
            td.title = value;
          }
        } else {
          td.textContent = value;
          td.title = value;
        }
        tr.appendChild(td);
      });
      this.previewTbody.appendChild(tr);
    });

    this.rowCount.textContent = `Showing ${previewRows.length} of ${this.rows.length} rows`;
    this.dataPreview.classList.remove('hidden');
  }

  _reset() {
    this.data = null;
    this.headers = [];
    this.rows = [];
    this.fileName = '';
    this.imageColumns.clear();
    this.fileInput.value = '';

    this.fileInfo.classList.add('hidden');
    this.dataPreview.classList.add('hidden');
    this.dropzone.style.display = '';
    this.btnToDesign.disabled = true;

    // Restore default dropzone text
    const textEl = this.dropzone.querySelector('.dropzone-text');
    if (textEl) {
      textEl.innerHTML = `Drop your <strong>.xlsx</strong> file here`;
    }
    const subtextEl = this.dropzone.querySelector('.dropzone-subtext');
    if (subtextEl) {
      subtextEl.innerHTML = `or click to browse · supports embedded images`;
    }

    // Show showcase section again on reset
    const showcase = document.getElementById('template-showcase');
    if (showcase) {
      showcase.classList.remove('hidden');
    }
  }

  loadSampleData(templateKey) {
    let headers = [];
    let rows = [];
    this.imageColumns.clear();
    if (templateKey === 'datasheet' || templateKey === 'default') {
      headers = ['CODE', 'NAME', 'IMAGE', 'DESCRIPTION', 'DIAGRAM', 'SPECS'];
      this.imageColumns.add('image');
      this.imageColumns.add('diagram');
      
      const samplePicture = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f8fafc" stroke="%23e2e8f0" stroke-width="2"/><circle cx="150" cy="80" r="45" fill="%23f1f5f9" stroke="%23139B58" stroke-width="4"/><circle cx="150" cy="80" r="25" fill="%23ffffff"/><path d="M150 25 L150 5 M150 135 L150 155 M95 80 L75 80 M205 80 L225 80" stroke="%23139B58" stroke-width="3"/><text x="150" y="165" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="%231e293b" text-anchor="middle">Azoogi Premium LED Downlight</text></svg>`;
      const sampleDimension = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f8fafc" stroke="%23e2e8f0" stroke-width="2"/><line x1="50" y1="120" x2="250" y2="120" stroke="%2364748b" stroke-width="2" stroke-dasharray="4 4"/><line x1="50" y1="105" x2="50" y2="135" stroke="%2364748b" stroke-width="2"/><line x1="250" y1="105" x2="250" y2="135" stroke="%2364748b" stroke-width="2"/><text x="150" y="95" font-family="monospace" font-size="11" fill="%23475569" text-anchor="middle">Cutout Diameter: 90mm</text><circle cx="150" cy="55" r="8" fill="none" stroke="%23475569" stroke-width="1.5"/><path d="M142 55 L158 55 M150 47 L150 63" stroke="%23475569" stroke-width="1.5"/><text x="150" y="165" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="%231e293b" text-anchor="middle">Technical Dimension Drawing</text></svg>`;
 
      const sampleSpecs12W = JSON.stringify({
        Series: 'IP65 Series',
        Brand: 'Azoogi',
        Finish: 'Clear',
        Dimensions: '1100mm (L) x 92mm (W) x 90mm (H)',
        'Lamp Type': 'LED',
        Wattage: '12W',
        'Lumen Output': '960lm',
        Optics: 'Diffuse',
        'Color Temperature': '3000K / 4000K / 5000K',
        'IP Rating': 'IP44',
        Control: 'Triac Dimmable',
        Mounting: 'Recessed ceiling',
        Warranty: '3 Years',
      });

      // Second row uses a different set of keys — specs are fully dynamic per product
      const sampleSpecs15W = JSON.stringify({
        Series: 'Commercial Series',
        'Product Code': 'AZ-LN-15-SM',
        CRI: '90+',
        'Driver Type': 'Constant current',
        'Beam Angle': '38°',
        'Housing Material': 'Die-cast aluminium',
        'Operating Temp': '-20°C to 45°C',
        Certifications: 'SAA, RCM, IC-4',
        'Lead Time': '2–3 weeks',
      });

      rows = [
        {
          CODE: 'AZ-LLL001',
          NAME: 'IP65 Series',
          IMAGE: samplePicture,
          DESCRIPTION: 'The Azoogi 12W LED Downlight is a premium recessed luminaire designed for exceptional performance, modern aesthetics, and energy efficiency. It features high CRI (>80) for vibrant, accurate colors, a wide 90-degree beam angle for uniform light distribution, and a durable IP44-rated design. It is fully dimmable and matches standard cutouts, making it perfect for residential, retail, and commercial spaces.',
          DIAGRAM: sampleDimension,
          SPECS: sampleSpecs12W,
        },
        {
          CODE: 'AZ-LN-15-SM',
          NAME: 'Commercial Series',
          IMAGE: samplePicture.replace('12W', '15W').replace('45', '50').replace('25', '28'),
          DESCRIPTION: 'A high-powered 15W LED Downlight designed for higher ceilings and premium commercial spaces. It provides up to 1300 lumens of bright, comfortable light with excellent color rendering and triac dimming capability.',
          DIAGRAM: sampleDimension.replace('90mm', '110mm').replace('50', '40').replace('250', '260'),
          SPECS: sampleSpecs15W,
        },
      ];
    } else if (templateKey === 'heist') {
      headers = ['HEADLINE', 'IMAGE', 'SWIPE_TEXT'];
      this.imageColumns.add('image');
      rows = [
        {
          HEADLINE: 'China ran one of the <br> <span class="highlight">biggest AI heists <br> against Anthropic</span> for 45 <br> days without getting caught',
          IMAGE: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
          SWIPE_TEXT: 'Swipe for details'
        },
        {
          HEADLINE: 'State-sponsored hackers <br> <span class="highlight">breach defense grid</span> <br> using zero-day flaw',
          IMAGE: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
          SWIPE_TEXT: 'Learn more'
        }
      ];
    } else if (templateKey === 'certificate') {
      headers = ['certificate_type', 'name', 'description', 'issuer', 'date'];
      rows = [
        {
          certificate_type: 'Employee of the Month',
          name: 'Alex Johnson',
          description: 'For outstanding performance, dedication, and exemplary leadership in driving project success and demonstrating our core corporate values throughout May 2026.',
          issuer: 'Sarah Miller',
          date: 'May 31, 2026'
        },
        {
          certificate_type: 'Honorary Achievement',
          name: 'Jordan Smith',
          description: 'In recognition of your exceptional contributions to the development of our open-source tools and community-driven initiatives.',
          issuer: 'Robert Chen',
          date: 'May 20, 2026'
        }
      ];
    } else if (templateKey === 'invoice') {
      headers = ['invoice_number', 'date', 'due_date', 'company', 'company_address', 'client_name', 'client_address', 'description', 'amount', 'notes'];
      rows = [
        {
          invoice_number: 'INV-2026-0042',
          date: '2026-05-21',
          due_date: '2026-06-04',
          company: 'Antigravity Dev Solutions',
          company_address: '123 Innovation Way, Tech Valley',
          client_name: 'Azoogi Lighting Solutions',
          client_address: '456 Commerce St, Sydney NSW 2020',
          description: 'Professional Web Development & Testing Services',
          amount: '$4,500.00',
          notes: 'Thank you for your business! Payment is due within 14 days.'
        },
        {
          invoice_number: 'INV-2026-0043',
          date: '2026-05-22',
          due_date: '2026-06-05',
          company: 'Antigravity Dev Solutions',
          company_address: '123 Innovation Way, Tech Valley',
          client_name: 'Lighting Council Australia',
          client_address: '789 Federation Blvd, Melbourne VIC 3000',
          description: 'Cloud Infrastructure Setup & API Integration',
          amount: '$8,200.00',
          notes: 'Please quote invoice number on bank transfer.'
        }
      ];
    }

    this.headers = headers;
    this.rows = rows;
    this.fileName = `Sample - ${templateKey.charAt(0).toUpperCase() + templateKey.slice(1)} Data`;

    // Update UI
    this.fileNameEl.textContent = this.fileName;
    this.fileMetaEl.textContent = `Sample Data · ${this.rows.length} rows · ${this.headers.length} columns`;
    this.fileInfo.classList.remove('hidden');
    this.dropzone.style.display = 'none';

    // Hide showcase section
    const showcase = document.getElementById('template-showcase');
    if (showcase) {
      showcase.classList.add('hidden');
    }

    this._renderPreview();
    this.btnToDesign.disabled = false;

    if (this.onDataLoaded) {
      this.onDataLoaded(this.headers, this.rows);
    }
  }

  _showError(message) {
    // Dispatch custom event for toast
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'error' } }));
  }

  getHeaders() {
    return this.headers;
  }

  getRows() {
    return this.rows;
  }

  getRow(index) {
    return this.rows[index] || null;
  }

  getRowCount() {
    return this.rows.length;
  }
}

```

---

## File: `src/modules/templateEditor.js`

```js
/**
 * Template Editor Module
 * CodeMirror-based HTML/CSS editor with column tag insertion
 */
import { EditorView, basicSetup } from 'codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';

export class TemplateEditor {
  constructor(templateStore) {
    this.templateStore = templateStore;
    this.htmlEditor = null;
    this.cssEditor = null;
    this.headers = [];
    this.onContentChange = null;
    this.currentTemplateKey = 'default';

    this._bindElements();
    this._bindEvents();
    this._initEditors();
  }

  _bindElements() {
    this.htmlContainer = document.getElementById('html-editor-container');
    this.cssContainer = document.getElementById('css-editor-container');
    this.tagsList = document.getElementById('tags-list');
    this.templateSelect = document.getElementById('template-select');
    this.saveTemplateBtn = document.getElementById('btn-save-template');
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.codeEditors = document.querySelectorAll('.code-editor');
  }

  _bindEvents() {
    // Tab switching
    this.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.codeEditors.forEach((editor) => {
          editor.classList.toggle('active', editor.id === `${tab}-editor-container`);
        });
      });
    });

    // Template selection
    this.templateSelect.addEventListener('change', (e) => {
      this.currentTemplateKey = e.target.value;
      this._loadTemplate(this.currentTemplateKey);
    });

    // Save template
    this.saveTemplateBtn.addEventListener('click', () => {
      const name = prompt('Save template as:', this.currentTemplateKey);
      if (name) {
        this.templateStore.saveTemplate(name, this.getHTML(), this.getCSS());
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: `Template "${name}" saved!`, type: 'success' },
          })
        );
      }
    });
  }

  _initEditors() {
    const defaultTemplate = this.templateStore.getTemplate('default');

    // HTML Editor
    this.htmlEditor = new EditorView({
      state: EditorState.create({
        doc: defaultTemplate.html,
        extensions: [
          basicSetup,
          html(),
          oneDark,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && this.onContentChange) {
              this.onContentChange();
            }
          }),
          EditorView.theme({
            '&': { height: '100%' },
            '.cm-scroller': { overflow: 'auto' },
          }),
        ],
      }),
      parent: this.htmlContainer,
    });

    // CSS Editor
    this.cssEditor = new EditorView({
      state: EditorState.create({
        doc: defaultTemplate.css,
        extensions: [
          basicSetup,
          css(),
          oneDark,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && this.onContentChange) {
              this.onContentChange();
            }
          }),
          EditorView.theme({
            '&': { height: '100%' },
            '.cm-scroller': { overflow: 'auto' },
          }),
        ],
      }),
      parent: this.cssContainer,
    });
  }

  selectTemplate(key) {
    this.templateSelect.value = key;
    this.currentTemplateKey = key;
    this._loadTemplate(key);
  }

  _loadTemplate(key) {
    const template = this.templateStore.getTemplate(key);
    this._setEditorContent(this.htmlEditor, template.html);
    this._setEditorContent(this.cssEditor, template.css);
    if (this.onContentChange) this.onContentChange();
  }

  _setEditorContent(editor, content) {
    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: content,
      },
    });
  }

  /**
   * Set available CSV column headers and render clickable tags
   */
  setHeaders(headers) {
    this.headers = headers;
    this.tagsList.innerHTML = '';

    headers.forEach((header) => {
      const tag = document.createElement('button');
      tag.className = 'column-tag';
      tag.textContent = `{{${header}}}`;
      tag.title = `Insert {{${header}}} at cursor`;
      tag.addEventListener('click', () => {
        this._insertAtCursor(`{{${header}}}`);
      });
      this.tagsList.appendChild(tag);
    });
  }

  _insertAtCursor(text) {
    // Determine which editor is active
    const activeTab = document.querySelector('.tab-btn.active');
    const editor = activeTab?.dataset.tab === 'css' ? this.cssEditor : this.htmlEditor;

    const cursor = editor.state.selection.main.head;
    editor.dispatch({
      changes: { from: cursor, insert: text },
      selection: { anchor: cursor + text.length },
    });
    editor.focus();
  }

  getHTML() {
    return this.htmlEditor.state.doc.toString();
  }

  getCSS() {
    return this.cssEditor.state.doc.toString();
  }
}

```

---

## File: `src/modules/templateStore.js`

```js
/**
 * Template Store Module
 * Manages default templates and localStorage persistence
 */

import { azoogiDatasheetTemplate } from '../templates/azoogiDatasheet.js';
import { heistSocialPostTemplate } from '../templates/heistSocialPost.js';

const STORAGE_KEY = 'datasheet-templates';
const TEMPLATE_VERSION_KEY = 'datasheet-template-version';
const TEMPLATE_VERSION = 8;

const DEFAULT_TEMPLATES = {
  default: azoogiDatasheetTemplate,
  datasheet: azoogiDatasheetTemplate,
  heist: heistSocialPostTemplate,

  certificate: {
    name: 'Certificate',
    html: `<div class="certificate">
  <div class="border-frame">
    <div class="ornament top-left"></div>
    <div class="ornament top-right"></div>
    <div class="ornament bottom-left"></div>
    <div class="ornament bottom-right"></div>
    
    <div class="content">
      <p class="pre-title">Certificate of</p>
      <h1 class="title">{{certificate_type}}</h1>
      
      <p class="presented">This is proudly presented to</p>
      <h2 class="recipient">{{name}}</h2>
      <div class="divider"></div>
      
      <p class="description">{{description}}</p>
      
      <div class="signatures">
        <div class="sig-block">
          <div class="sig-line"></div>
          <p>{{issuer}}</p>
          <span>Director</span>
        </div>
        <div class="date-block">
          <p class="date-value">{{date}}</p>
          <span>Date</span>
        </div>
      </div>
    </div>
  </div>
</div>`,
    css: `@page {
  margin: 0;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Georgia', serif;
  color: #2c3e50;
  background: #fff;
}

.certificate {
  width: 100%;
  min-height: 100%;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fefefe, #f0f0ff);
}

.border-frame {
  position: relative;
  width: 100%;
  padding: 56px 48px;
  border: 3px double #b8860b;
  text-align: center;
}

.ornament {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 2px solid #b8860b;
}

.top-left { top: 8px; left: 8px; border-right: none; border-bottom: none; }
.top-right { top: 8px; right: 8px; border-left: none; border-bottom: none; }
.bottom-left { bottom: 8px; left: 8px; border-right: none; border-top: none; }
.bottom-right { bottom: 8px; right: 8px; border-left: none; border-top: none; }

.pre-title {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #b8860b;
  margin-bottom: 8px;
}

.title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 32px;
}

.presented {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
  font-style: italic;
}

.recipient {
  font-size: 32px;
  font-weight: 400;
  color: #b8860b;
  font-style: italic;
  margin-bottom: 8px;
}

.divider {
  width: 180px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #b8860b, transparent);
  margin: 0 auto 28px;
}

.description {
  font-size: 14px;
  line-height: 1.8;
  color: #4a4a6a;
  max-width: 480px;
  margin: 0 auto 40px;
}

.signatures {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  margin-top: 20px;
}

.sig-block, .date-block {
  text-align: center;
}

.sig-line {
  width: 160px;
  height: 1px;
  background: #333;
  margin-bottom: 8px;
}

.sig-block p, .date-block .date-value {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.sig-block span, .date-block span {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
}`,
  },

  invoice: {
    name: 'Invoice',
    html: `<div class="invoice">
  <div class="invoice-header">
    <div class="brand">
      <h1>INVOICE</h1>
      <p class="invoice-number">#{{invoice_number}}</p>
    </div>
    <div class="invoice-meta">
      <div class="meta-item">
        <span class="meta-label">Date</span>
        <span class="meta-value">{{date}}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Due Date</span>
        <span class="meta-value">{{due_date}}</span>
      </div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>From</h3>
      <p class="party-name">{{company}}</p>
      <p>{{company_address}}</p>
    </div>
    <div class="party">
      <h3>Bill To</h3>
      <p class="party-name">{{client_name}}</p>
      <p>{{client_address}}</p>
    </div>
  </div>

  <div class="line-items">
    <div class="item-header">
      <span>Description</span>
      <span>Amount</span>
    </div>
    <div class="item-row">
      <span>{{description}}</span>
      <span>{{amount}}</span>
    </div>
  </div>

  <div class="total-section">
    <div class="total-row grand-total">
      <span>Total</span>
      <span>{{amount}}</span>
    </div>
  </div>

  <div class="invoice-footer">
    <p>{{notes}}</p>
  </div>
</div>`,
    css: `@page {
  margin: 0;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #1a1a2e;
  background: #fff;
}

.invoice {
  width: 100%;
  min-height: 100%;
  padding: 48px;
  display: flex;
  flex-direction: column;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 2px solid #6366f1;
}

.brand h1 {
  font-size: 32px;
  font-weight: 800;
  color: #6366f1;
  letter-spacing: 2px;
}

.invoice-number {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.invoice-meta {
  text-align: right;
}

.meta-item {
  margin-bottom: 8px;
}

.meta-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #999;
  display: block;
}

.meta-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.parties {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 40px;
}

.party h3 {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6366f1;
  margin-bottom: 8px;
}

.party-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.party p {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.line-items {
  margin-bottom: 24px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #6366f1;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 6px 6px 0 0;
}

.item-row {
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.total-section {
  margin-left: auto;
  width: 260px;
  margin-bottom: 40px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  font-size: 14px;
}

.grand-total {
  background: #f8f9ff;
  border-radius: 6px;
  font-weight: 700;
  font-size: 18px;
  color: #6366f1;
}

.invoice-footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.invoice-footer p {
  font-size: 12px;
  color: #999;
  font-style: italic;
}`,
  },
};

export class TemplateStore {
  constructor() {
    this._loadSaved();
  }

  _loadSaved() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.saved = saved ? JSON.parse(saved) : {};
    } catch {
      this.saved = {};
    }

    const version = parseInt(localStorage.getItem(TEMPLATE_VERSION_KEY), 10) || 0;
    if (version < TEMPLATE_VERSION) {
      delete this.saved.default;
      delete this.saved.datasheet;
      delete this.saved.heist;
      delete this.saved.certificate;
      delete this.saved.invoice;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saved));
        localStorage.setItem(TEMPLATE_VERSION_KEY, String(TEMPLATE_VERSION));
      } catch {
        /* ignore quota errors */
      }
    }
  }

  getTemplate(key) {
    // Built-in datasheet templates always use latest defaults unless explicitly saved as custom
    if (DEFAULT_TEMPLATES[key] && !this.saved[key]?.custom) {
      return { ...DEFAULT_TEMPLATES[key] };
    }
    if (this.saved[key]) return { ...this.saved[key] };
    if (DEFAULT_TEMPLATES[key]) return { ...DEFAULT_TEMPLATES[key] };
    return { ...DEFAULT_TEMPLATES.default };
  }

  saveTemplate(key, html, css) {
    this.saved[key] = {
      name: `Custom: ${key}`,
      html,
      css,
      custom: true,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saved));
    } catch (e) {
      console.error('Failed to save template:', e);
    }
  }

  getDefaultTemplateKeys() {
    return Object.keys(DEFAULT_TEMPLATES);
  }

  getAllTemplateKeys() {
    return [...new Set([...Object.keys(DEFAULT_TEMPLATES), ...Object.keys(this.saved)])];
  }

  /**
   * Adapts a template's HTML to use actual CSV headers.
   * Replaces the default placeholder names with the real column names.
   */
  adaptTemplate(templateKey, headers) {
    const template = this.getTemplate(templateKey);
    // Return as-is; users can manually adjust or use their own column names
    return template;
  }
}

```

---

## File: `src/modules/pdfGenerator.js`

```js
/**
 * PDF Generator Module
 * Handles live preview rendering and PDF generation via html2canvas + jsPDF
 */
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** CSS pixels per millimeter at 96 DPI */
const MM_TO_PX = 96 / 25.4;

const A4_WIDTH_PX = Math.round(210 * MM_TO_PX);
const A4_HEIGHT_PX = Math.round(297 * MM_TO_PX);

/** Overrides inside preview shadow root (template html/body rules must not leak to the app) */
const PREVIEW_SHADOW_CSS = `
:host {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: transparent;
}
.preview-sheet {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.page {
  flex-shrink: 0;
  margin: 0 !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  border-radius: 2px;
  transform-origin: center center;
  transition: transform 0.2s ease;
  will-change: transform;
}
`;

export class PDFGenerator {
  constructor(csvParser, templateEditor) {
    this.csvParser = csvParser;
    this.templateEditor = templateEditor;
    this.currentPreviewRow = 0;

    this._bindElements();
    this._bindEvents();
    this._initStagingRoot();
    this._bindPreviewResize();
  }

  _bindPreviewResize() {
    this._onPreviewResize = () => {
      this._fitPreviewMount(this.previewMount);
      this._fitPreviewMount(this.exportPreviewMount);
    };
    window.addEventListener("resize", this._onPreviewResize);

    if (typeof ResizeObserver !== "undefined") {
      this._previewResizeObserver = new ResizeObserver(this._onPreviewResize);
      for (const mount of [this.previewMount, this.exportPreviewMount]) {
        const wrapper = mount?.parentElement;
        if (wrapper?.classList.contains("preview-frame-wrapper")) {
          this._previewResizeObserver.observe(wrapper);
        }
      }
    }
  }

  _formatRowIndicator(currentIndex, rowCount) {
    return `${currentIndex + 1} / ${rowCount}`;
  }

  _updatePreviewNav(rowCount) {
    const text = this._formatRowIndicator(this.currentPreviewRow, rowCount);
    const atStart = this.currentPreviewRow === 0;
    const atEnd = this.currentPreviewRow >= rowCount - 1;

    if (this.rowIndicator) this.rowIndicator.textContent = text;
    if (this.prevRowBtn) this.prevRowBtn.disabled = atStart;
    if (this.nextRowBtn) this.nextRowBtn.disabled = atEnd;

    if (this.exportRowIndicator) this.exportRowIndicator.textContent = text;
    if (this.exportPrevBtn) this.exportPrevBtn.disabled = atStart;
    if (this.exportNextBtn) this.exportNextBtn.disabled = atEnd;
  }

  _getPreviewRoot(mount) {
    if (!mount) return null;
    if (!mount.shadowRoot) {
      mount.attachShadow({ mode: "open" });
    }
    return mount.shadowRoot;
  }

  _fitPreviewMount(mount) {
    if (!mount) return;
    const wrapper = mount.parentElement;
    const root = this._getPreviewRoot(mount);
    const page = root?.querySelector(".page");
    if (!wrapper || !page || wrapper.clientWidth < 1 || wrapper.clientHeight < 1) return;

    page.style.width = `${A4_WIDTH_PX}px`;
    page.style.height = `${A4_HEIGHT_PX}px`;
    page.style.transform = "none";

    const pageW = page.offsetWidth || A4_WIDTH_PX;
    const pageH = page.offsetHeight || A4_HEIGHT_PX;
    const pad = 12;
    const availW = wrapper.clientWidth - pad;
    const availH = wrapper.clientHeight - pad;
    const scale = Math.min(availW / pageW, availH / pageH);

    page.style.transform = `scale(${scale})`;
  }

  /**
   * Persistent off-screen root — reusing it avoids append/remove flicker per page
   */
  _initStagingRoot() {
    this.stagingRoot = document.getElementById("pdf-staging-root");
    if (!this.stagingRoot) {
      this.stagingRoot = document.createElement("div");
      this.stagingRoot.id = "pdf-staging-root";
      this.stagingRoot.setAttribute("aria-hidden", "true");
      document.body.appendChild(this.stagingRoot);
    }
    this._exportContainer = null;
  }

  _bindElements() {
    // Step 2 preview
    this.previewMount = document.getElementById("preview-mount");
    this.prevRowBtn = document.getElementById("btn-prev-row");
    this.nextRowBtn = document.getElementById("btn-next-row");
    this.rowIndicator = document.getElementById("preview-row-indicator");

    // Step 3 export preview
    this.exportPreviewMount = document.getElementById("export-preview-mount");
    this.exportPrevBtn = document.getElementById("btn-export-prev-row");
    this.exportNextBtn = document.getElementById("btn-export-next-row");
    this.exportRowIndicator = document.getElementById("export-row-indicator");

    // Export controls
    this.pageSizeSelect = document.getElementById("page-size");
    this.orientationSelect = document.getElementById("orientation");
    this.marginSelect = document.getElementById("margin");
    this.exportModeSelect = document.getElementById("export-mode");
    this.rangeGroup = document.getElementById("range-group");
    this.rangeStart = document.getElementById("range-start");
    this.rangeEnd = document.getElementById("range-end");
    this.filenameInput = document.getElementById("filename-input");
    this.generateBtn = document.getElementById("btn-generate-pdf");

    // Progress
    this.progressSection = document.getElementById("progress-section");
    this.progressFill = document.getElementById("progress-fill");
    this.progressText = document.getElementById("progress-text");
  }

  _bindEvents() {
    // Row navigation — Step 2
    this.prevRowBtn.addEventListener("click", () => {
      if (this.currentPreviewRow > 0) {
        this.currentPreviewRow--;
        this.updatePreview();
      }
    });

    this.nextRowBtn.addEventListener("click", () => {
      if (this.currentPreviewRow < this.csvParser.getRowCount() - 1) {
        this.currentPreviewRow++;
        this.updatePreview();
      }
    });

    // Row navigation — Step 3
    this.exportPrevBtn.addEventListener("click", () => {
      if (this.currentPreviewRow > 0) {
        this.currentPreviewRow--;
        this.updateExportPreview();
      }
    });

    this.exportNextBtn.addEventListener("click", () => {
      if (this.currentPreviewRow < this.csvParser.getRowCount() - 1) {
        this.currentPreviewRow++;
        this.updateExportPreview();
      }
    });

    // Export mode toggle
    this.exportModeSelect.addEventListener("change", () => {
      const isRange = this.exportModeSelect.value === "range";
      this.rangeGroup.classList.toggle("hidden", !isRange);
    });

    // Generate PDF
    this.generateBtn.addEventListener("click", () => this._generatePDF());
  }

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Root-relative paths (e.g. /datasheet-template/...) break in blob iframes — use absolute URLs
   */
  _absolutizePublicUrls(content) {
    if (!content) return content;
    const origin = window.location.origin;
    return content.replace(/(\b(?:src|href)\s*=\s*["'])\/([^"']+)/gi, (_, attr, path) => {
      return `${attr}${origin}/${path}`;
    });
  }

  _normalizeSpecValue(val) {
    if (val === null || val === undefined) return "";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "number") return String(val);
    if (Array.isArray(val)) return val.map((v) => this._normalizeSpecValue(v)).join(", ");
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  }

  /**
   * Parse SPECS cell value as JSON — any keys allowed, no fixed schema
   */
  _parseSpecsJson(specStr) {
    if (specStr === undefined || specStr === null || specStr === "") return null;
    if (typeof specStr === "object" && !Array.isArray(specStr)) return specStr;

    let raw = String(specStr).trim().replace(/^\uFEFF/, "");
    if (!raw) return null;

    if (raw.includes("<table") || raw.includes("<tr")) return null;

    raw = raw.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
    if (raw.includes('""')) raw = raw.replace(/""/g, '"');

    if (!raw.startsWith("{") && /["']?[^"':]+["']?\s*:/.test(raw)) {
      const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const obj = {};
      for (const line of lines) {
        const m = line.match(/^["']?([^"':]+)["']?\s*:\s*(.+)$/);
        if (m) obj[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
      }
      if (Object.keys(obj).length > 0) return obj;
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      /* fallback below */
    }

    // Loose fallback: pull any "key": "value" pairs from malformed JSON
    const obj = {};
    const pairRe = /["']?([^"':\{\},]+)["']?\s*:\s*["']?([^"',\n\}]+)["']?/g;
    let m;
    while ((m = pairRe.exec(raw)) !== null) {
      const k = m[1].trim();
      const v = m[2].trim();
      if (k) obj[k] = v;
    }
    return Object.keys(obj).length > 0 ? obj : null;
  }

  /**
   * Turn parsed SPECS object into [key, value] rows (supports nested objects)
   */
  _flattenSpecsEntries(obj) {
    const entries = [];
    for (const [key, val] of Object.entries(obj)) {
      if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        for (const [subKey, subVal] of Object.entries(val)) {
          entries.push([`${key} — ${subKey}`, subVal]);
        }
      } else {
        entries.push([key, val]);
      }
    }
    return entries;
  }

  /**
   * Map alternate column names (e.g. Product Code) onto CODE for {{CODE}}
   */
  _normalizeRowKeys(rowData) {
    const data = { ...rowData };
    const findKey = (pred) => Object.keys(data).find((k) => pred(k.trim()));

    const codeKey = findKey((k) => k.toLowerCase() === "code");
    const codeVal = codeKey ? String(data[codeKey] ?? "").trim() : "";

    if (!codeVal) {
      const altKey = findKey((k) => /^(product\s*code|sku|model)$/i.test(k));
      if (altKey) data.CODE = data[altKey];
    }

    return data;
  }

  /**
   * Expose every SPECS JSON key for {{placeholders}} (dynamic, per row)
   */
  _expandRowData(rowData) {
    const expanded = this._normalizeRowKeys(rowData);
    const specsHeader = Object.keys(rowData).find((h) => {
      const n = h.trim().toLowerCase();
      return n === "specs" || n === "specification";
    });
    if (!specsHeader) return expanded;

    const parsed = this._parseSpecsJson(rowData[specsHeader]);
    if (!parsed) return expanded;

    for (const [key, val] of this._flattenSpecsEntries(parsed)) {
      expanded[key] = this._normalizeSpecValue(val);
    }
    return expanded;
  }

  _specsObjectToTable(entries) {
    const tableClass = this._usesFullPageTemplate() ? "params" : "specs-table";
    const rows = entries.map(([key, val]) => {
      const display = this._normalizeSpecValue(val);
      if (tableClass === "params") {
        return `<tr><td>${this._escapeHtml(key)}</td><td>${this._escapeHtml(display)}</td></tr>`;
      }
      return `<tr><td class="spec-key">${this._escapeHtml(key)}</td><td class="spec-val">${this._escapeHtml(display)}</td></tr>`;
    });
    return `<table class="${tableClass}"><tbody>${rows.join("")}</tbody></table>`;
  }

  /** Azoogi template uses a fixed 210×297mm `.page` — export at full A4, no shrink margins */
  _usesFullPageTemplate() {
    const html = this.templateEditor.getHTML() || "";
    return /\bclass\s*=\s*["'][^"']*\bpage\b/.test(html);
  }

  /**
   * Format SPECS / Specification into a key-value HTML table (JSON or plain text)
   */
  _formatSpecification(specStr) {
    if (specStr === undefined || specStr === null || specStr === "") return "";

    const spec = String(specStr);

    if (spec.includes("<table") || spec.includes("<tr")) {
      return spec;
    }

    const jsonObj = this._parseSpecsJson(spec);
    if (jsonObj) {
      return this._specsObjectToTable(this._flattenSpecsEntries(jsonObj));
    }

    const lines = spec
      .split(/\r?\n|<br\s*\/?>/gi)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return "";

    const tableRows = [];
    let isTableLike = false;

    const useParamsTable = this._usesFullPageTemplate();

    for (const line of lines) {
      const match = line.match(/^([^:\-\|]+)[:\-\|](.+)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        tableRows.push(
          useParamsTable
            ? `<tr><td>${this._escapeHtml(key)}</td><td>${this._escapeHtml(val)}</td></tr>`
            : `<tr><td class="spec-key">${this._escapeHtml(key)}</td><td class="spec-val">${this._escapeHtml(val)}</td></tr>`
        );
        isTableLike = true;
      } else {
        tableRows.push(`<tr><td colspan="2" class="spec-text">${this._escapeHtml(line)}</td></tr>`);
      }
    }

    if (isTableLike) {
      const tableClass = this._usesFullPageTemplate() ? "params" : "specs-table";
      return `<table class="${tableClass}"><tbody>${tableRows.join("")}</tbody></table>`;
    }

    return lines.map((line) => `<div class="spec-line">${this._escapeHtml(line)}</div>`).join("");
  }

  /**
   * Replace {{placeholders}} in template with actual row data
   */
  _replacePlaceholders(templateStr, rowData) {
    if (!templateStr) return "";
    const data = this._expandRowData(rowData);

    let processedStr = templateStr;

    // Evaluate {{#if COLUMN}} ... {{/if}} blocks from inside out (recursive check)
    const ifRegex = /\{\{#if\s+([^}]+?)\s*\}\}([\s\S]*?)\{\{\/if\}\}/gi;
    let matchFound = true;
    let iterations = 0;

    while (matchFound && iterations < 10) {
      matchFound = false;
      processedStr = processedStr.replace(ifRegex, (match, key, content) => {
        matchFound = true;
        const trimmedKey = key.trim();
        const header = Object.keys(data).find((h) => h.trim().toLowerCase() === trimmedKey.toLowerCase());
        const value = header ? data[header] : null;

        if (value !== null && value !== undefined && String(value).trim() !== "") {
          return content;
        }
        return "";
      });
      iterations++;
    }

    return processedStr.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      const header = Object.keys(data).find((h) => h.trim().toLowerCase() === trimmedKey.toLowerCase());

      if (!header) return "";

      const value = data[header] ?? "";

      if (trimmedKey.toLowerCase() === "specification" || trimmedKey.toLowerCase() === "specs") {
        const specsHeader = Object.keys(rowData).find((h) => {
          const n = h.trim().toLowerCase();
          return n === "specs" || n === "specification";
        });
        return this._formatSpecification(specsHeader ? rowData[specsHeader] : value);
      }

      return value;
    });
  }

  /**
   * Build preview fragment (HTML + CSS) for a single row
   */
  _buildPreviewContent(rowData) {
    const htmlTemplate = this.templateEditor.getHTML();
    const cssTemplate = this.templateEditor.getCSS();
    const htmlContent = this._absolutizePublicUrls(this._replacePlaceholders(htmlTemplate, rowData));
    const cssContent = this._replacePlaceholders(cssTemplate, rowData);
    return { htmlContent, cssContent };
  }

  /**
   * Render preview directly in the page (fills panel, sharp, no iframe scaling bugs)
   */
  _renderPreview(mount, rowData) {
    if (!mount) return;

    const { htmlContent, cssContent } = this._buildPreviewContent(rowData);
    const root = this._getPreviewRoot(mount);
    root.innerHTML = `<style>${cssContent}\n${PREVIEW_SHADOW_CSS}</style><div class="preview-sheet">${htmlContent}</div>`;

    this._resolveAssetUrls(root);

    // Automatically hide empty image elements
    root.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src || src.trim() === "" || src.includes("{{")) {
        img.style.display = "none";
      }
    });

    requestAnimationFrame(() => {
      this._fitPreviewMount(mount);
      this._waitForImages(root).then(() => this._fitPreviewMount(mount));
    });
  }

  /**
   * Update the Step 2 live preview
   */
  updatePreview() {
    const rowCount = this.csvParser.getRowCount();
    if (rowCount === 0) return;

    if (this.currentPreviewRow >= rowCount) {
      this.currentPreviewRow = rowCount - 1;
    }

    const rowData = this.csvParser.getRow(this.currentPreviewRow);
    this._renderPreview(this.previewMount, rowData);
    this._updatePreviewNav(rowCount);
  }

  /**
   * Update the Step 3 export preview
   */
  updateExportPreview() {
    const rowCount = this.csvParser.getRowCount();
    if (rowCount === 0) return;

    if (this.currentPreviewRow >= rowCount) {
      this.currentPreviewRow = rowCount - 1;
    }

    const rowData = this.csvParser.getRow(this.currentPreviewRow);
    this._renderPreview(this.exportPreviewMount, rowData);
    this._updatePreviewNav(rowCount);
  }

  /**
   * Get page size dimensions (mm)
   */
  _getPageFormat() {
    return { format: "a4", orientation: "portrait", width: 210, height: 297 };
  }

  /**
   * Printable area inside margins, in mm and px (for capture + PDF placement)
   */
  _getExportLayout(marginMm) {
    const { width: pageWidthMm, height: pageHeightMm } = this._getPageFormat();

    if (this._usesFullPageTemplate()) {
      return {
        pageWidthMm,
        pageHeightMm,
        marginMm: 0,
        contentWidthMm: pageWidthMm,
        contentHeightMm: pageHeightMm,
        contentWidthPx: Math.round(pageWidthMm * MM_TO_PX),
        contentHeightPx: Math.round(pageHeightMm * MM_TO_PX),
        fullPage: true,
      };
    }

    const contentWidthMm = pageWidthMm - marginMm * 2;
    const contentHeightMm = pageHeightMm - marginMm * 2;

    return {
      pageWidthMm,
      pageHeightMm,
      marginMm,
      contentWidthMm,
      contentHeightMm,
      contentWidthPx: Math.round(contentWidthMm * MM_TO_PX),
      contentHeightPx: Math.round(contentHeightMm * MM_TO_PX),
      fullPage: false,
    };
  }

  /**
   * Turn root-relative image paths into absolute URLs for off-DOM capture
   */
  _resolveAssetUrls(root) {
    root.querySelectorAll("img[src]").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:") || /^https?:/i.test(src)) return;
      try {
        img.src = new URL(src, window.location.href).href;
      } catch {
        /* keep original */
      }
    });
  }

  async _waitForLayout() {
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  _getCaptureTarget(container) {
    return (
      container.querySelector(".page") ||
      container.querySelector(".pdf-page") ||
      container
    );
  }

  _applyCaptureStagingStyles() {
    this._stagingStyleBackup = this.stagingRoot.getAttribute("style");
    Object.assign(this.stagingRoot.style, {
      opacity: "1",
      visibility: "visible",
      overflow: "visible",
      transform: "none",
    });
  }

  _restoreCaptureStagingStyles() {
    if (this._stagingStyleBackup) {
      this.stagingRoot.setAttribute("style", this._stagingStyleBackup);
    } else {
      this.stagingRoot.removeAttribute("style");
    }
    this._stagingStyleBackup = null;
  }

  /**
   * Helper to wait for all images in a container to load/decode
   */
  async _waitForImages(container) {
    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
      images.map(async (img) => {
        if (img.complete && img.naturalWidth > 0) return;
        try {
          if (img.decode) await img.decode();
        } catch {
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }
      }),
    );
  }

  /**
   * Build a single page DOM node sized to fill the printable area
   */
  _buildPageElement(rowData) {
    const htmlTemplate = this.templateEditor.getHTML();
    const cssTemplate = this.templateEditor.getCSS();
    const htmlContent = this._absolutizePublicUrls(this._replacePlaceholders(htmlTemplate, rowData));

    const wrapper = document.createElement("div");
    wrapper.className = "pdf-page-wrapper";

    const fullPage = this._usesFullPageTemplate();
    const layoutStyle = document.createElement("style");
    layoutStyle.textContent = fullPage
      ? `
      .pdf-page-wrapper,
      .pdf-page {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        overflow: hidden;
      }
      .pdf-page .page {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        box-shadow: none !important;
      }
    `
      : `
      .pdf-page-wrapper,
      .pdf-page,
      .pdf-page .datasheet-container {
        width: 100%;
        height: 100%;
        min-height: 100%;
        box-sizing: border-box;
        overflow: hidden;
      }
      .pdf-page .datasheet-container {
        display: flex;
        flex-direction: column;
      }
    `;
    wrapper.appendChild(layoutStyle);

    const styleTag = document.createElement("style");
    styleTag.textContent = this._replacePlaceholders(cssTemplate, rowData);
    wrapper.appendChild(styleTag);

    const pageDiv = document.createElement("div");
    pageDiv.className = "pdf-page";
    pageDiv.innerHTML = htmlContent;

    // Automatically hide empty image elements
    pageDiv.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src || src.trim() === "" || src.includes("{{")) {
        img.style.display = "none";
      }
    });

    wrapper.appendChild(pageDiv);

    return wrapper;
  }

  /**
   * Reuse a single off-screen container (avoids DOM churn flicker each page)
   */
  _getExportContainer(contentWidthPx, contentHeightPx) {
    if (!this._exportContainer) {
      this._exportContainer = document.createElement("div");
      this._exportContainer.className = "pdf-export-container";
      this.stagingRoot.appendChild(this._exportContainer);
    }
    Object.assign(this._exportContainer.style, {
      width: `${contentWidthPx}px`,
      height: `${contentHeightPx}px`,
      minWidth: `${contentWidthPx}px`,
      minHeight: `${contentHeightPx}px`,
      background: "#ffffff",
      overflow: "hidden",
      opacity: "1",
      visibility: "visible",
    });
    this._exportContainer.replaceChildren();
    return this._exportContainer;
  }

  _setExportProgress(current, total, message) {
    this._pendingProgress = { current, total, message };
    if (this._progressRaf) return;
    this._progressRaf = requestAnimationFrame(() => {
      this._progressRaf = null;
      const p = this._pendingProgress;
      if (!p) return;
      if (p.message) this.progressText.textContent = p.message;
      if (p.total > 0) {
        this.progressFill.style.width = `${(p.current / p.total) * 90}%`;
      }
    });
  }

  /**
   * Place captured content at margins, filling the full printable area
   */
  _addCanvasToPdf(pdf, imgData, layout, canvasWidthPx, canvasHeightPx) {
    const pxPerMm = MM_TO_PX;
    const imgWidthMm = canvasWidthPx / pxPerMm;
    const imgHeightMm = canvasHeightPx / pxPerMm;

    if (layout.fullPage) {
      pdf.addImage(imgData, "JPEG", 0, 0, layout.pageWidthMm, layout.pageHeightMm);
      return;
    }

    const { marginMm, contentWidthMm, contentHeightMm } = layout;
    const scale = Math.min(contentWidthMm / imgWidthMm, contentHeightMm / imgHeightMm);
    const drawW = imgWidthMm * scale;
    const drawH = imgHeightMm * scale;
    const offsetX = marginMm + (contentWidthMm - drawW) / 2;
    const offsetY = marginMm + (contentHeightMm - drawH) / 2;
    pdf.addImage(imgData, "JPEG", offsetX, offsetY, drawW, drawH);
  }

  /**
   * Generate PDF from all (or selected range of) rows
   */
  async _generatePDF() {
    const rowCount = this.csvParser.getRowCount();
    if (rowCount === 0) return;

    let startRow = 0;
    let endRow = rowCount - 1;

    if (this.exportModeSelect.value === "range") {
      startRow = Math.max(0, (parseInt(this.rangeStart.value) || 1) - 1);
      endRow = Math.min(rowCount - 1, (parseInt(this.rangeEnd.value) || rowCount) - 1);
    }

    const totalRows = endRow - startRow + 1;
    const marginMm = parseInt(this.marginSelect.value, 10) || 0;
    const filename = this.filenameInput.value.trim() || "datasheet-output";
    const { format, orientation } = this._getPageFormat();
    const layout = this._getExportLayout(marginMm);

    // Show progress (disable transitions via body class to prevent flicker)
    document.body.classList.add("pdf-exporting");
    this.progressSection.classList.remove("hidden");
    this.generateBtn.disabled = true;
    this.progressFill.style.width = "0%";
    this.progressText.textContent = `Preparing ${totalRows} page(s)...`;

    const jsPdfFormat = format === "a4" ? "a4" : format === "letter" ? "letter" : "legal";

    let container = null;
    this._progressRaf = null;
    try {
      const pdf = new jsPDF({
        unit: "mm",
        format: jsPdfFormat,
        orientation,
      });

      const canvasScale = 2;

      for (let i = startRow; i <= endRow; i++) {
        const rowData = this.csvParser.getRow(i);
        const pageIndex = i - startRow;

        this._setExportProgress(pageIndex + 0.5, totalRows, `Rendering page ${pageIndex + 1} of ${totalRows}...`);

        container = this._getExportContainer(layout.contentWidthPx, layout.contentHeightPx);
        container.appendChild(this._buildPageElement(rowData));

        this._resolveAssetUrls(container);
        await this._waitForImages(container);
        await this._waitForLayout();

        const captureTarget = this._getCaptureTarget(container);
        this._applyCaptureStagingStyles();

        let canvas;
        try {
          canvas = await html2canvas(captureTarget, {
            scale: canvasScale,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
            imageTimeout: 15000,
            scrollX: 0,
            scrollY: 0,
            onclone: (clonedDoc) => {
              clonedDoc.querySelectorAll(".pdf-export-container, .pdf-page-wrapper, .pdf-page, .page").forEach((el) => {
                el.style.opacity = "1";
                el.style.visibility = "visible";
              });
              clonedDoc.querySelectorAll("img[src]").forEach((img) => {
                const src = img.getAttribute("src");
                if (src && src.startsWith("/")) {
                  try {
                    img.src = new URL(src, window.location.href).href;
                  } catch {
                    /* ignore */
                  }
                }
              });
            },
          });
        } finally {
          this._restoreCaptureStagingStyles();
        }

        if (!canvas.width || !canvas.height) {
          throw new Error("Page render failed (empty canvas). Check template images and reload the page.");
        }

        const imgData = canvas.toDataURL("image/jpeg", 0.98);

        if (pageIndex > 0) {
          pdf.addPage(jsPdfFormat, orientation);
        }
        this._addCanvasToPdf(pdf, imgData, layout, canvas.width, canvas.height);
      }

      pdf.save(`${filename}.pdf`);

      this.progressFill.style.width = "100%";
      this.progressText.textContent = "PDF generated successfully!";

      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            message: `PDF "${filename}.pdf" downloaded! (${totalRows} pages)`,
            type: "success",
          },
        }),
      );
    } catch (error) {
      console.error("PDF generation error:", error);
      this.progressText.textContent = `Error: ${error.message}`;
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { message: `PDF generation failed: ${error.message}`, type: "error" },
        }),
      );
    } finally {
      if (this._exportContainer) {
        this._exportContainer.replaceChildren();
      }
      if (this._progressRaf) {
        cancelAnimationFrame(this._progressRaf);
        this._progressRaf = null;
      }
      document.body.classList.remove("pdf-exporting");
      this.generateBtn.disabled = false;
      setTimeout(() => {
        this.progressSection.classList.add("hidden");
      }, 3000);
    }
  }
}

```

---

## File: `src/templates/azoogiDatasheet.js`

```js
/**
 * Azoogi product datasheet template (from datasheet-template/azoogi-datasheet-template.html)
 * Placeholders: CODE, NAME, IMAGE, DESCRIPTION, DIAGRAM, SPECS (+ any key inside SPECS JSON)
 */

export const AZOOGI_DATASHEET_CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  font-family: "Open Sans", "Helvetica Neue", Arial, sans-serif;
  color: #1a1a1a;
  background: #ffffff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page {
  position: relative;
  width: 210mm;
  height: 297mm;
  margin: 0;
  background: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pdf-export-container .page,
.pdf-page-wrapper .page {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  box-shadow: none !important;
}

.az-header {
  background: #0e0e0e;
  color: #ffffff;
  padding: 7mm 10mm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #000;
}
.az-header .logo-left { height: 14mm; display: block; max-width: 45%; object-fit: contain; }
.az-header .logo-right { height: 14mm; display: block; max-width: 45%; object-fit: contain; }

.title-block { padding: 6mm 10mm 0; }
.title-block h1 {
  margin: 0;
  font-size: 24pt;
  font-weight: 700;
  color: #111;
  letter-spacing: .3px;
}
.title-block h2 {
  margin: 0 0 3mm;
  font-size: 14pt;
  font-weight: 700;
  color: #73bf44;
}
.title-block h2:empty { display: none; }

.gradient-line {
  height: 2px;
  background: linear-gradient(90deg, #73bf44 0%, #73bf44 35%, rgba(103,208,78,0) 100%);
  border: 0;
  margin: 0 10mm;
}

.body-wrap {
  flex: 1;
  position: relative;
  padding: 6mm 10mm 4mm;
  background: #ffffff;
  min-height: 0;
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6mm;
  position: relative;
  z-index: 1;
}

.desc {
  font-size: 10px;
  line-height: 1.55;
  color: #2a2a2a;
  text-align: justify;
  margin: 0 0 6mm;
}

.params-title {
  font-size: 9pt;
  font-weight: 700;
  color: #111;
  margin: 0 0 2mm;
}

table.params {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  border: 1px solid #73bf44;
}
table.params td {
  padding: 2mm 3mm;
  border: 1px solid #73bf44;
  vertical-align: middle;
}
table.params tr td:first-child {
  font-weight: 700;
  width: 38%;
  background: #1a1a1a;
  color: #ffffff;
}
table.params tr:nth-child(odd) td:last-child { background: #d9f0d0; color: #111; }
table.params tr:nth-child(even) td:last-child { background: #ffffff; color: #111; }

.product-img-container, .dim-img-container {
  height: 78mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.dim-img-container {
  height: 55mm;
  margin-top: 34px;

}

.product-img {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  width: auto;
  display: block;
}

.dim-title {
  text-align: center;
  margin: 6mm 0 3mm;
  font-size: 9pt;
  font-weight: 700;
  color: #111;
}

.dim-img {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  width: auto;
  display: block;
}

.note-img-container {
  height: 55mm;
  margin-top: 34px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.note-img {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  width: auto;
  display: block;
}

.az-footer {
  background: #0e0e0e;
  color: #ffffff;
  padding: 5mm 10mm;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 4mm;
  font-size: 8.5pt;
}
.az-footer .f-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #e6e6e6;
}
.az-footer .f-item svg {
  width: 11px;
  height: 11px;
  fill: #67d04e;
  flex-shrink: 0;
}
`;

export const AZOOGI_DATASHEET_HTML = `<section class="page">

  <header class="az-header">
    <img class="logo-left" src="/datasheet-template/assets/logo.png" alt="Azoogi Lighting Solutions">
    <img class="logo-right" src="/datasheet-template/assets/lc.png" alt="Lighting Council Australia">
  </header>

  <div class="title-block">
    {{#if CODE}}<h1>{{CODE}}</h1>{{/if}}
    {{#if NAME}}<h2>{{NAME}}</h2>{{/if}}
  </div>
  <hr class="gradient-line">

  <div class="body-wrap">
    <div class="content">

      <div>
        {{#if DESCRIPTION}}<p class="desc">{{DESCRIPTION}}</p>{{/if}}
        {{#if SPECS}}
          <p class="params-title">SPECIFICATIONS</p>
          {{SPECS}}
        {{/if}}
      </div>

      <div style="display: flex; flex-direction: column;">
        {{#if IMAGE}}
        <div class="product-img-container">
          <img class="product-img" src="{{IMAGE}}" alt="{{NAME}}">
        </div>
        {{/if}}
        {{#if DIAGRAM}}
        <div class="dim-img-container">
          <div class="dim-title">DIMENSIONS</div>
          <img class="dim-img" src="{{DIAGRAM}}" alt="Dimensions">
        </div>
        {{/if}}
        <div class="note-img-container">
          <img class="note-img" src="/datasheet-template/assets/note.jpeg" alt="Note">
        </div>
      </div>
    </div>
  </div>

  <footer class="az-footer">
    <span class="f-item">
      <svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z"/></svg>
      sales@azoogi.com.au
    </span>
    <span class="f-item">
      <svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.9 15.9 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.25 1z"/></svg>
      1300 641 261
    </span>
    <span class="f-item">
      <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm7.9 9h-3.95a15.7 15.7 0 0 0-1.3-5.7A8 8 0 0 1 19.9 11zM12 4c.97 1.4 1.8 3.7 1.95 7H10.05C10.2 7.7 11.03 5.4 12 4zM4.1 13h3.95a15.7 15.7 0 0 0 1.3 5.7A8 8 0 0 1 4.1 13zm0-2A8 8 0 0 1 9.35 5.3 15.7 15.7 0 0 0 8.05 11zm7.9 9c-.97-1.4-1.8-3.7-1.95-7h3.9c-.15 3.3-.98 5.6-1.95 7zm2.65-.3a15.7 15.7 0 0 0 1.3-5.7h3.95a8 8 0 0 1-5.25 5.7z"/></svg>
      www.azoogi.com.au
    </span>
    <span class="f-item">
      <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"/></svg>
      Unit 47, 10-12 Girawah Place, Matraville, NSW, 2036
    </span>
  </footer>

</section>`;

export const azoogiDatasheetTemplate = {
  name: 'Azoogi Datasheet',
  html: AZOOGI_DATASHEET_HTML,
  css: AZOOGI_DATASHEET_CSS,
};

```

---

## File: `src/templates/heistSocialPost.js`

```js
export const HEIST_HTML = `<section class="page heist-page">
  <div class="post-container">
    <div class="background-image" style="background-image: url('{{IMAGE}}')"></div>
    <div class="background-overlay"></div>

    <div class="content-area">
      <div class="divider-container">
        <div class="line"></div>
        <div class="ai-badge">A<span>i</span></div>
        <div class="line"></div>
      </div>

      <h1 class="headline">
        {{HEADLINE}}
      </h1>

      <div class="swipe-button">
        {{SWIPE_TEXT}}<span class="arrow">&gt;</span>
      </div>
    </div>
  </div>
</section>`;

export const HEIST_CSS = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Inter:wght@400;600&display=swap');

@page {
  size: A4;
  margin: 0;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.heist-page {
  position: relative;
  width: 210mm;
  height: 297mm;
  margin: 0;
  background-color: #0f1115;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.pdf-export-container .page,
.pdf-page-wrapper .page {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  box-shadow: none !important;
}

.post-container {
  width: 100%;
  max-width: 500px;
  aspect-ratio: 4 / 5;
  background-color: #000000;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border-radius: 12px;
}

/* Simulated Background Image Area */
.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 65%;
  background-image: url('https://via.placeholder.com/500x650/1a1a1a/888888?text=Image+Placeholder');
  background-size: cover;
  background-position: center;
  z-index: 1;
}

/* Smooth gradient transition from image to black text area */
.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,1) 65%);
  z-index: 2;
}

.content-area {
  position: relative;
  z-index: 3;
  padding: 0 24px 20px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* Divider with Central AI Badge */
.divider-container {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.line {
  flex-grow: 1;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.3);
}

.ai-badge {
  margin: 0 10px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.ai-badge span {
  font-style: italic;
  font-weight: 400;
}

/* Typography Styling */
.headline {
  font-family: 'Oswald', sans-serif;
  font-size: 38px;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  word-spacing: 2px;
  margin-bottom: 24px;
}

.highlight {
  color: #2ce2cc; /* Teal/Cyan tone matching the image */
}

/* Swipe pill button */
.swipe-button {
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  text-transform: uppercase;
}

.swipe-button .arrow {
  font-size: 12px;
  display: inline-block;
  background: #ffffff;
  color: #000000;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  line-height: 13px;
  text-align: center;
  font-weight: 700;
}
`;

export const heistSocialPostTemplate = {
  name: 'AI Heist Social Post',
  html: HEIST_HTML,
  css: HEIST_CSS,
};

```

---

## Public Assets

Located in `public/datasheet-template/assets/`:

| File | Description |
|---|---|
| `logo.png` | Azoogi logo (used in datasheet template header) |
| `lc.png` | Lighting Council Australia logo |
| `note.jpeg` | Note image in datasheet template |
| `pro01.jpg` | Sample product image |
| `dimension.jpg` | Sample dimension diagram |

---

## Placeholder System

Use double curly braces with the column header name:

```
{{column_name}}
```

**Example:** With columns `CODE`, `NAME`, `IMAGE`, `DESCRIPTION`, `DIAGRAM`, `SPECS`:

```html
<h1>{{CODE}}</h1>
<img src="{{IMAGE}}" alt="{{NAME}}" />
<p>{{DESCRIPTION}}</p>
<img src="{{DIAGRAM}}" />
{{SPECS}}
```

> Placeholder matching is case-insensitive. `{{Title}}` and `{{title}}` both work.

### Conditionals

```
{{#if COLUMN_NAME}}content to show if column has value{{/if}}
```

### SPECS Parsing

The `{{SPECS}}` / `{{Specification}}` placeholder is special:
- If the cell contains a JSON object, it is rendered as a key-value HTML table
- If the cell contains `key: value` lines, they are parsed as key-value rows
- If the cell contains raw HTML tables, they pass through as-is
- All JSON keys are also exposed as individual `{{key_name}}` placeholders

---

## Expected Excel Format

| Column | Type | Description |
|---|---|---|
| CODE | Text | Product code / SKU |
| NAME | Text | Product name |
| IMAGE / Picture | Image | Embedded image (Place in Cell) |
| DESCRIPTION | Text | Product description |
| DIAGRAM / Dimension | Image | Dimension diagram (embedded) |
| SPECS / Specification | Text/JSON | Technical specs (JSON or key:value lines) |

Images must be **embedded** in cells (Insert → Picture → Place in Cell), not floating or linked.

