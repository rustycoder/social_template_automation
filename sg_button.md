# Style Guide — Buttons

**Project:** Content Studio  
**Design system:** Kinetic Logic  
**CSS sources:** `src/style.css` (base), `src/shell.css` (shell/footer)

This guide documents every button pattern used in the app. Combine a **base class** (`.btn` or standalone) with a **variant** and optional **modifiers**.

---

## Principles

1. **One primary action per region** — use `.btn-primary` for the main CTA; secondary actions use `.btn-outline` or `.btn-ghost`.
2. **Icon placement by direction** — Back buttons: icon **left**, label right. Forward CTAs (Next, Export Selected): label **left**, icon **right**.
3. **Always set `type="button"`** on non-submit controls to avoid accidental form submits.
4. **Use `aria-label`** when the visible label is hidden on mobile (footer icon-only mode).
5. **Disabled state** — use the native `disabled` attribute; do not simulate with classes alone.

---

## Base class: `.btn`

All standard buttons should include `.btn` plus a variant.

| Property        | Value                                      |
|-----------------|--------------------------------------------|
| Display         | `inline-flex`, centered                    |
| Gap             | `8px` (icon ↔ label)                       |
| Padding         | `10px 20px`                                |
| Font            | Google Sans Flex, `0.85rem`, weight `500`    |
| Border radius   | `var(--radius-md)` → **8px**               |
| Transition      | `150ms` (background, border, shadow, transform) |
| Disabled        | `opacity: 0.4`, `cursor: not-allowed`        |

```html
<button type="button" class="btn btn-primary">Label</button>
```

---

## Variants

### Primary — `.btn.btn-primary`

**Use for:** Main forward actions (Next, Export, Sign in, Subscribe).

| State    | Appearance                                              |
|----------|---------------------------------------------------------|
| Default  | Indigo background (`#4f46e5`), white text, subtle shadow |
| Hover    | Darker indigo, lifted `translateY(-1px)`, stronger shadow |
| Active   | Returns to baseline (no lift)                           |
| Disabled | 40% opacity                                             |

```html
<button type="button" class="btn btn-primary btn-export" id="btn-to-preview">
  <span class="btn-text">Next</span>
  <svg class="btn-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</button>
```

**Footer forward CTAs** (Next, Export Selected) use `.btn-export` for **semibold** (`font-weight: 600`) and place the icon **after** the label.

**Footer primary** uses fixed height `40px` and padding `0 24px` (`shell.css`).

---

### Outline — `.btn.btn-outline`

**Use for:** Secondary actions, Back navigation, bordered actions (Download sample in compact areas).

| State    | Appearance                                    |
|----------|-----------------------------------------------|
| Default  | White/raised background, `1px` border, dark text |
| Hover    | Hover background, darker border                 |
| Active   | `scale(0.98)`                                 |
| Disabled | 40% opacity                                   |

Shell also defines standalone `.btn-outline` with explicit `height: 40px` for footer consistency.

```html
<button type="button" class="btn btn-outline" aria-label="Back to template">
  <svg class="btn-icon" viewBox="0 0 16 16" … aria-hidden="true">…</svg>
  <span class="btn-text">Back</span>
</button>
```

> **Note:** `.btn { border: none }` is overridden by `.btn.btn-outline` so the border is always visible.

---

### Ghost — `.btn.btn-ghost`

**Use for:** Low-emphasis header actions (Sign in on desktop), tertiary actions (Load more).

| State   | Appearance                                      |
|---------|-------------------------------------------------|
| Default | Transparent background, muted text, bordered      |
| Hover   | Hover background, darker border, full text color |

```html
<button type="button" class="btn btn-ghost btn-sm" id="btn-login">
  <svg … aria-hidden="true">…</svg>
  <span class="btn-text">Sign in</span>
</button>
```

On mobile (`≤768px`), Sign in shows **icon only**; text is hidden via `#btn-login .btn-text { display: none }`.

---

## Modifiers

| Class        | Effect                                      | Example usage              |
|--------------|---------------------------------------------|----------------------------|
| `.btn-sm`    | Padding `6px 12px`, font `0.78rem`          | Compact inline actions     |
| `.btn-block` | `width: 100%`, centered content             | Modal submit buttons       |
| `.btn-export`| Semibold (`font-weight: 600`); footer forward CTAs (Next, Export Selected). Legacy non-footer sizing: `14px 28px` padding, `0.95rem` font |

```html
<button type="submit" class="btn btn-primary btn-block" id="auth-submit-btn">Sign in</button>
```

---

## Text links (not `.btn`)

### `.text-link`

**Use for:** Inline text actions beside page subtitles (e.g. “Download sample” on the Data page).

- No background or border
- Primary color, underlined
- Font `0.8rem`, weight `500`
- Hidden with `.hidden` when not applicable (e.g. Single Data tab)

```html
<button type="button" class="text-link" id="btn-download-sample-excel">Download sample</button>
```

### `.link-btn`

**Use for:** Inline links inside modal footer copy (e.g. “Create an account”).

- Inherits parent font size
- Primary color, underlined
- No padding or background

```html
<button type="button" class="link-btn" id="auth-toggle-mode">Create an account</button>
```

---

## Icons inside buttons — `.btn-icon` (on `<svg>`)

Apply `class="btn-icon"` to **SVG elements** inside `.btn` buttons. Styled by `.btn svg.btn-icon` in `shell.css`.

| Property     | Value |
|--------------|-------|
| Size         | `1em` × `1em` — matches the button’s font size (label height) |
| Background   | `transparent` — inherits the button surface; no inner box |
| Border       | `none` — only the outer `.btn` has a border |
| Color        | `currentColor` — follows button text (white on primary, dark on outline) |
| `flex-shrink`| `0` |

Do **not** set fixed `width`/`height` attributes on the SVG; size is driven by the button’s `font-size`.

**Order:** depends on direction — Back: icon then label. Forward CTA: label then icon.

```html
<!-- Forward CTA — label left, icon right -->
<button type="button" class="btn btn-primary btn-export" aria-label="Export selected">
  <span class="btn-text">Export Selected <span class="btn-export-count">(0)</span></span>
  <svg class="btn-icon" viewBox="0 0 16 16" …></svg>
</button>

<!-- Back — icon left, label right -->
<button type="button" class="btn btn-outline" aria-label="Back to data">
  <svg class="btn-icon" viewBox="0 0 16 16" …></svg>
  <span class="btn-text">Back</span>
</button>
```

> **Why `1em`?** Footer primary uses `0.875rem`, outline uses `0.85rem`, export uses `0.95rem` — the icon scales with each variant automatically. On mobile icon-only mode, keep the button’s `font-size` (hide label via `.btn-text { display: none }`, not `font-size: 0`) so `1em` still resolves correctly.

---

## Icon-only control — `button.btn-icon`

A **separate** pattern scoped to `<button>` elements — a small square icon button (30×30), used for remove/close actions in tables and cards. Has its own border and background.

```html
<button type="button" class="btn-icon" id="remove-file" aria-label="Remove file">✕</button>
```

CSS uses `button.btn-icon` so it never applies to inline SVGs inside `.btn` buttons.

---

## Footer buttons (`#app-footer`)

Footer nav uses the same `.btn-outline` / `.btn-primary` variants with shell overrides.

### Desktop (`>768px`)

- Height: `40px`
- Back: icon left + label. Next / Export: **semibold label** + icon right
- Gap: `8px`
- Outline buttons have explicit border

### Mobile (`≤768px`)

- **Icon-only** — `40×40` (480px: `36×36`)
- `.btn-text` hidden (button `font-size` preserved for `1em` icon sizing)
- `aria-label` required on every footer button
- Export count hidden (`.btn-export-count { display: none }`)

| Footer panel   | Left              | Right                    |
|----------------|-------------------|--------------------------|
| Step 2         | Back (outline)    | Next (primary)           |
| Step 3         | Back (outline)    | Export (primary)         |
| Billing        | Back (outline)    | —                        |
| Step 1         | Aspect segment buttons (see below) | —          |

---

## Aspect segment buttons — `.aspect-segment__btn`

**Use for:** Step 1 footer format picker (Square, Portrait, Story, Landscape).

- Height `40px`, bordered, raised background
- **Active:** primary background, white text
- **Mobile:** label hidden; icon-only square buttons

```html
<button type="button" class="aspect-segment__btn active" data-gallery-bucket="square">
  <svg class="aspect-segment__icon" …></svg>
  <span>Square <small>1:1</small></span>
</button>
```

---

## Accessibility checklist

- [ ] `type="button"` or `type="submit"` set explicitly
- [ ] `aria-label` when label text is visually hidden
- [ ] `aria-hidden="true"` on decorative SVGs
- [ ] `disabled` attribute when action is unavailable
- [ ] Sufficient contrast (primary white-on-indigo, outline dark-on-white)
- [ ] Focus visible via browser default or custom focus ring (add `:focus-visible` if extending)

---

## Do / Don't

| Do | Don't |
|----|-------|
| Use `.btn.btn-primary` for one main CTA per toolbar/footer | Stack multiple primary buttons side by side |
| Put Back icons before labels | Put forward CTA icons before labels (Next, Export) |
| Use `.btn-export` on footer forward CTAs for semibold text | Leave Next at default weight `500` while Export is `600` |
| Use `1em` inline icons with transparent background | Add borders or backgrounds on SVG icons inside buttons |
| Wrap labels in `<span class="btn-text">` in the footer | Use `font-size: 0` on buttons (breaks `1em` icon sizing) |
| Use `.text-link` for inline supplementary actions | Use `.btn-outline` for every minor link |
| Use `disabled` on unavailable actions | Use `pointer-events: none` without `disabled` |
| Provide `aria-label` on footer buttons | Leave icon-only buttons unlabeled |

---

## File reference

| File | Contents |
|------|----------|
| `src/style.css` | `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.btn-block`, `.btn-export`, `button.btn-icon` (icon-only), `.link-btn` |
| `src/shell.css` | `.btn svg.btn-icon`, `.btn-outline`, footer button rules, `#app-footer .btn-primary.btn-export`, `.text-link`, `.aspect-segment__btn`, mobile icon-only overrides |
| `index.html` | Footer nav, auth modal, billing back button |
| `design.md` | Global Kinetic Logic design system overview |

---

## Quick reference

```
Primary CTA     →  .btn .btn-primary
Secondary       →  .btn .btn-outline
Tertiary        →  .btn .btn-ghost
Compact         →  + .btn-sm
Full width      →  + .btn-block
Inline link     →  .text-link  or  .link-btn
Back button      →  icon left, label right  (.btn-outline)
Forward CTA      →  label left, icon right  (.btn-primary .btn-export, weight 600)
Icon-only btn   →  <button class="btn-icon" aria-label="…">  (button.btn-icon)
Footer mobile   →  icon + aria-label; .btn-text hidden via CSS
```
