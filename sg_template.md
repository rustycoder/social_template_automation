# Style Guide — Post Templates

**Project:** Content Studio  
**Location:** `src/templates/`  
**Loader:** `src/templates/htmlTemplateLoader.js`  
**Rendering:** `src/features/rendering/socialRenderHost.js` → `server/renderApi.js` (Puppeteer PNG export)

This guide defines how to author HTML post templates that work with the app’s preview and export pipeline.

---

## Principles

1. **One file = one visual design** — self-contained HTML with inline `<style>`; no external CSS or JavaScript.
2. **Design for square first** — author at **1080×1080**; the loader auto-adapts to portrait, story, and landscape.
3. **Explicit placeholders** — every user-editable value uses `{{FIELD_KEY}}` tokens registered in `htmlTemplateLoader.js`.
4. **Fixed canvas** — `html, body` and `.card` must declare pixel `width` and `height`; content is positioned inside `.card`.
5. **Export-safe** — fonts via Google Fonts `<link>` tags; images via `{{PHOTO}}` or URL placeholders; `overflow: hidden` on the root.

---

## File naming & registration

| Rule | Example |
|------|---------|
| File name | `template-{id-letter}-{slug}.html` |
| Examples | `template-c-viral.html`, `template-f-stamp.html` |
| Register import | Add `import … from './template-x-name.html?raw'` in `htmlTemplateLoader.js` |
| Export object | `parseHtmlTemplate(rawHtml, { id, name, previewBucket, fields })` |
| Gallery sample | Add row to `BUILTIN_SAMPLES` in `src/features/domain/templateSampleData.js` |

**Template `id`** uses kebab-case (e.g. `viral-shock-card`). **`id` in filename** is a short letter prefix for sorting, not the runtime id.

---

## Required HTML skeleton

Every template must follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Template Name</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=…&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: 1080px; overflow: hidden; font-family: 'Inter', sans-serif; }
  .card { position: relative; width: 1080px; height: 1080px; background: #0a0a0b; }
  /* … template-specific rules … */
</style>
</head>
<body>
  <div class="card">
    <!-- All visible content inside .card -->
  </div>
</body>
</html>
```

### Non-negotiable selectors

The layout adapter in `htmlTemplateLoader.js` regex-replaces dimensions **only** on these selectors:

```css
html, body { width: 1080px; height: 1080px; … }
.card       { width: 1080px; height: 1080px; … }
```

| Layout bucket | Width | Height | Use case |
|---------------|-------|--------|----------|
| `square`      | 1080  | 1080   | Instagram 1:1 (default / author size) |
| `portrait`    | 1080  | 1350   | Instagram / Facebook 4:5 |
| `story`       | 1080  | 1920   | Story / Reel 9:16 |
| `landscape`   | 1200  | 628    | Facebook horizontal |

Do **not** hard-code 1080×1080 on inner elements that should reflow — only `html, body` and `.card` are resized automatically. Use `%`, `calc()`, or `position: absolute` for inner layout.

---

## Placeholders

### Syntax

```
{{FIELD_KEY}}
```

- Keys are **UPPERCASE_SNAKE_CASE** (e.g. `{{PHOTO}}`, `{{HEADLINE}}`, `{{BANNER_TEXT}}`).
- Keys are case-insensitive at render time but must match the `fields` array in `htmlTemplateLoader.js`.
- Missing values render as empty string; unresolved `{{…}}` in image `src` hides the image.

### Field types (registration)

| `type`     | Use for | Example key |
|------------|---------|-------------|
| `image`    | Photo URL | `PHOTO` |
| `text`     | Short single-line copy | `BADGE`, `TAG`, `SOURCE` |
| `textarea` | Headlines, descriptions | `HEADLINE`, `DESCRIPTION`, `SUBTEXT` |

```js
fields: [
  { key: 'PHOTO',       label: 'Photo',       type: 'image',    required: true },
  { key: 'HEADLINE',    label: 'Headline',     type: 'textarea', required: true },
  { key: 'SOURCE',      label: 'Source',       type: 'text',     required: false },
]
```

### Conditional blocks (optional)

Supported by the renderer but **not used** in current templates:

```html
{{#if SOURCE}}
  <div class="source-pill">{{SOURCE}}</div>
{{/if}}
```

The block is kept only when the field has a non-empty value.

### Highlight syntax (text fields)

Applied at render time in `socialRenderHost.js` (not in the HTML file):

| User types | Rendered HTML | Typical CSS class |
|------------|---------------|-------------------|
| `[phrase]` | `<mark>phrase</mark>` | `mark { background: #FFD600; color: #0a0a0b; }` |
| `[[phrase]]` | `<span class="highlight-red">phrase</span>` | `.highlight-red { background: #D6293E; color: #fff; }` |

**Rules:**
- Define styles for `mark` and `.highlight-red` in every template that uses highlights in headlines or body copy.
- `[[…]]` is processed before `[…]` so double brackets are not partially consumed.
- Highlight syntax is **skipped** when the value looks like a URL (`http://`, `https://`, `data:`, etc.) — important for `PHOTO` fields.
- Banner template overrides `mark` to red text without background — pattern is allowed per template.

```css
/* Dark templates (viral, highlight, stamp) */
.t-headline mark { background: #FFD600; color: #0a0a0b; padding: 2px 6px; border-radius: 2px; }
.t-headline .highlight-red { background: #D6293E; color: #fff; padding: 2px 6px; border-radius: 2px; }

/* Light template (banner) — different mark treatment */
.t-headline mark { background: none; color: #D6293E; font-weight: 700; }
```

---

## Images

### Standard photo slot

```html
<img class="t-photo" src="{{PHOTO}}" alt="">
```

```css
.t-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

- **`PHOTO`** is required on all current templates.
- Use `object-fit: cover` for full-bleed backgrounds.
- Banner template places the photo below a fixed header — `top` / `height: calc(…)` instead of `inset: 0`.

### Scrim overlay (photo templates)

Dark templates use a gradient scrim between photo and text:

```css
.scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(2, 2, 3, 0.92) 0%,
    rgba(2, 2, 3, 0.65) 40%,
    rgba(2, 2, 3, 0.25) 70%,
    rgba(2, 2, 3, 0.10) 100%
  );
}
```

Stack order: `.t-photo` → `.scrim` → text/UI layers.

---

## Typography

Templates use an **editorial / news** palette distinct from the app shell (Kinetic Logic).

### Font families (current templates)

| Role | Family | Used in |
|------|--------|---------|
| Body / UI | **Inter** | Descriptions, tags, subtext, some headlines |
| Display / impact | **Barlow Condensed** | Badges, large headlines, banner strip |
| Dateline / mono accent | **JetBrains Mono** | Stamp template badges and date pill |

Load fonts in `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

The loader extracts `fonts.googleapis.com` links and injects them as `@import` into exported CSS.

### Editorial color tokens

| Token | Hex | Usage |
|-------|-----|-------|
| Canvas dark | `#0a0a0b` | Card background (photo templates) |
| Canvas light | `#fff` | Banner template |
| Accent yellow | `#FFD600` | Badges, highlights, stamp accent headline |
| Accent red | `#D6293E` | Breaking badges, red highlights, banner emphasis |
| Text primary (on dark) | `#fff` | Headlines |
| Text secondary (on dark) | `#b0b1b5` – `#d4d5d9` | Descriptions, metadata |
| Text primary (on light) | `#1a1a1a` | Banner headline |

---

## Layout patterns (from existing templates)

### Pattern A — Centered viral card (`template-c-viral.html`)

- Full-bleed photo + scrim
- Flex column `.body` centered vertically
- Large skewed `.badge`, centered `.t-headline`, `.t-desc`, `.source-pill`
- **Fields:** `PHOTO`, `BADGE`, `HEADLINE`, `DESCRIPTION`, `SOURCE`

### Pattern B — Lower-third wire (`template-d-highlight.html`)

- Photo + scrim; content anchored to bottom third (`.lower`)
- Top-left `.top-tag`; fixed `.cta-bar` at bottom with static “Follow …” wrapper around `{{SOURCE}}`
- **Fields:** `PHOTO`, `TAG`, `HEADLINE`, `SUBTEXT`, `SOURCE`

### Pattern C — Banner + panel (`template-e-banner.html`)

- Light theme; no scrim
- Fixed-height `.banner` strip at top (`{{BANNER_TEXT}}`)
- Photo in middle band; `.bottom-panel` with headline + source
- **Fields:** `PHOTO`, `BANNER_TEXT`, `HEADLINE`, `SOURCE`

### Pattern D — Stamp / breaking (`template-f-stamp.html`)

- Photo + scrim; asymmetric absolute positioning
- Decorative `.stamp` circle (`{{STAMP_TEXT}}`), split headline (`.headline-big` + `.headline-accent`)
- Mono `.breaking-badge` / `.date-pill`; `.bottom-bar` for source
- **Fields:** `PHOTO`, `DATELINE`, `STAMP_TEXT`, `HEADLINE_BIG`, `HEADLINE_ACCENT`, `DESCRIPTION`, `SOURCE`

---

## CSS conventions

| Convention | Rule |
|------------|------|
| Reset | `* { box-sizing: border-box; margin: 0; padding: 0; }` |
| Root overflow | `overflow: hidden` on `html, body` — prevents scrollbars in screenshots |
| Card root | Single `.card` wrapper; `position: relative` |
| Layering | Photo at z-index 0; scrim and text above (natural DOM order) |
| Spacing | Edge insets typically **48–60px** from canvas edge |
| Class prefix | `t-` for template text blocks (`.t-headline`, `.t-desc`, `.t-photo`) |
| Positioning | `position: absolute` for overlays; flex for centered stacks |

### What to avoid

| Don't | Why |
|-------|-----|
| External `.css` files | Loader only reads inline `<style>` blocks |
| JavaScript | Puppeteer renders static HTML only |
| Viewport units (`vh`, `vw`) for canvas size | Breaks when bucket dimensions change |
| Animations / `@keyframes` | `isAnimated: false` in pipeline; motion won’t export reliably |
| Multiple `.card` roots | Breaks dimension adaptation |
| Placeholders in CSS | Only body HTML is substituted; tokens in `<style>` are not replaced |

---

## Checklist — new template

- [ ] File added under `src/templates/html/template-*.html`
- [ ] `html, body` and `.card` set to `1080px × 1080px`
- [ ] `overflow: hidden` on root
- [ ] Google Fonts loaded via `<link>` in `<head>`
- [ ] All copy uses `{{FIELD_KEY}}` placeholders
- [ ] `mark` / `.highlight-red` styled if headlines use `[…]` / `[[…]]`
- [ ] `PHOTO` image uses `object-fit: cover` (or documented crop region)
- [ ] Registered in `legacyTemplateRegistry.js` or `nicheTemplateRegistry.js` with `category` and `fields`
- [ ] Sample row added to `templateSampleData.js`
- [ ] Preview tested in all four buckets (square, portrait, story, landscape)
- [ ] Export PNG verified via Step 3

---

## File reference

| File | Role |
|------|------|
| `src/templates/html/template-*.html` | Authoring source |
| `src/templates/htmlTemplateLoader.js` | Parse, dimension adapt, export template objects |
| `src/features/rendering/socialRenderHost.js` | Placeholder + highlight substitution |
| `src/features/domain/templateSampleData.js` | Gallery / preview sample rows |
| `src/features/rendering/socialFormats.js` | Bucket dimensions and platform presets |
| `server/renderApi.js` | Puppeteer screenshot to PNG |

---

## Quick reference

```
Author size     →  1080 × 1080 on html, body + .card
Placeholder     →  {{FIELD_KEY}}  (UPPERCASE_SNAKE)
Yellow highlight →  [text]  →  <mark>
Red highlight    →  [[text]]  →  <span class="highlight-red">
Photo field     →  {{PHOTO}} on <img class="t-photo">
Register        →  htmlTemplateLoader.js → parseHtmlTemplate(...)
Sample data     →  templateSampleData.js → BUILTIN_SAMPLES
Buckets         →  square | portrait | story | landscape (auto)
```
