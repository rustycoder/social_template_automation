# Style Guide — Buttons (`sg_buttons.md`)

**Project:** Content Studio  
**Sources:** `src/style.css`, `src/shell.css`, `src/features/shared/uiIcons.js`  
**Token set:** Kinetic Logic (`:root` in `src/style.css`)

Use this file when editing or adding buttons. Prefer bullets over prose so values are easy to find and change.

---

## 1. Principles

- One **primary** CTA per toolbar / footer region.
- Destructive actions use **danger** (red), not outline/ghost.
- Every actionable control sets `type="button"` or `type="submit"` explicitly.
- Decorative SVGs use `aria-hidden="true"`.
- Icon-only controls require `aria-label`.
- Availability is controlled with the native `disabled` attribute (opacity handled by CSS).

---

## 2. Design tokens (shared)

- Primary fill: `#4f46e5` → `--color-primary`
- Primary hover: `#4338ca` → `--color-primary-hover`
- Danger fill: `#dc2626` (`--color-error`)
- Danger hover: `#b91c1c`
- Text: `#09090b` → `--color-text`
- Muted text: `#71717a` → `--color-text-muted`
- Border: `#e4e4e7` → `--color-border`
- Raised surface: `#ffffff` → `--color-bg-raised`
- Radius (default btn): `8px` → `--radius-md`
- Radius (icon-only btn): `6px` → `--radius-sm`
- Font family: `--font-sans` (Google Sans Flex)
- Transition: `150ms` → `--transition-fast`

---

## 3. Base element — `.btn`

### 3.1 Required markup

```html
<button type="button" class="btn btn-primary">
  <svg class="btn-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">…</svg>
  <span class="btn-text">Label</span>
</button>
```

### 3.2 Layout attributes

- Display: `inline-flex`
- Align: `align-items: center`
- Gap (icon ↔ label): `8px`
- White-space: `nowrap`
- Cursor: `pointer`

### 3.3 Dimension / type

- Padding: `10px 20px`
- Font size: `0.85rem`
- Font weight: `500`
- Border (base): `none` (variants may add a border)
- Border radius: `8px` (`--radius-md`)

### 3.4 Disabled

- Opacity: `0.4`
- Cursor: `not-allowed`

---

## 4. Variants

### 4.1 Primary — `.btn.btn-primary`

- **Use:** Main CTAs (Next, Save, Upload, Schedule confirm, Edit on cards).
- Background: `--color-primary` (`#4f46e5`)
- Text: `#fff`
- Shadow: `--shadow-sm`
- Hover: background `--color-primary-hover`, shadow `--shadow-md`, `translateY(-1px)`
- Active: `translateY(0)`

### 4.2 Outline — `.btn.btn-outline`

- **Use:** Secondary / Back / Cancel.
- Background: `--color-bg-raised`
- Border: `1px solid --color-border`
- Text: `--color-text`
- Shell footer override height: `40px` (see §8)

### 4.3 Ghost — `.btn.btn-ghost`

- **Use:** Low emphasis (header Sign in, Clear filters).
- Background: `transparent`
- Border: `1px solid --color-border`
- Text: `--color-text-muted`
- Hover: bg `--color-bg-hover`, text `--color-text`

### 4.4 Danger — `.btn.btn-danger`

- **Use:** Delete / destructive bulk actions.
- Background: `#dc2626`
- Border color: `#dc2626`
- Text: `#fff`
- Shadow: `--shadow-sm`
- Hover: `#b91c1c`, `translateY(-1px)`
- Active: `translateY(0)`

---

## 5. Size / width modifiers

### 5.1 Compact — `.btn-sm`

- Padding: `6px 12px`
- Font size: `0.78rem`
- **Use:** Card actions, toolbar chips, pagination.

### 5.2 Full width — `.btn-block`

- Width: `100%`
- Justify content: `center`
- **Use:** Modal auth submit.

### 5.3 Footer / export weight — `.btn-export`

- Padding (legacy non-footer): `14px 28px`
- Font size: `0.95rem`
- Font weight: `600`
- **Use:** Footer forward CTAs (Next, Download) when paired with `.btn-primary`.

---

## 6. Icons

### 6.1 Inline SVG inside `.btn` — `svg.btn-icon`

- ViewBox: `0 0 16 16`
- Size: `1em × 1em` (scales with button font-size)
- Color: `currentColor`
- Background / border: none
- Flex-shrink: `0`
- Source helpers: `src/features/shared/uiIcons.js` (`buttonLabel()`, `UI_ICONS`)

### 6.2 Icon placement rules

- **Default (most app actions):** icon **before** text (Edit, Delete, Schedule, Upload, Cancel, List/Grid/Week).
- **Footer Back:** icon left, label right.
- **Footer forward CTA (Next / Download):** label left, icon right (exception).

### 6.3 Icon-only square — `button.btn-icon` (not an SVG class)

- Element: `<button class="btn-icon">`
- Size: `30 × 30px`
- Display: flex centered
- Background: `--color-bg-hover`
- Border: `1px solid --color-border`
- Radius: `6px`
- Font size: `1rem`
- Hover: primary border + primary text
- Disabled opacity: `0.3`
- Requires `aria-label`

---

## 7. Toggle switch — `.ui-switch` (activate / deactivate)

Not a `.btn`. Used for Active/Inactive on template & category rows.

### 7.1 Markup

```html
<label class="ui-switch" title="Deactivate">
  <input type="checkbox" role="switch" data-action="toggle" checked />
  <span class="ui-switch__track" aria-hidden="true"></span>
  <span class="ui-switch__text">Active</span>
</label>
```

### 7.2 Dimensions / placement

- Layout: `inline-flex`, gap `8px`, min-height `30px`
- Track: `36 × 20px`, pill radius `999px`
- Knob: `16 × 16px`, white, offset `2px` from edges
- Off track: `#d4d4d8`
- On track: `--color-primary`
- On knob translate: `translateX(16px)`
- Label (`.ui-switch__text`): `0.75rem`, weight `600`, muted; primary when checked
- Helper: `activeSwitchHtml()` in `uiIcons.js`

---

## 8. Footer buttons (`#app-footer`)

### 8.1 Desktop (`>768px`)

- Height: `40px`
- Gap between icon and label: `8px`
- Outline: explicit border retained
- Primary export: semibold via `.btn-export`

### 8.2 Mobile (`≤768px`)

- Icon-only squares: `40 × 40` (at `≤480px`: `36 × 36`)
- `.btn-text` hidden via CSS
- Keep button `font-size` (do not set `font-size: 0`) so `1em` icons still size
- Every footer control needs `aria-label`

### 8.3 Placement map

| Panel | Left | Right |
|-------|------|-------|
| Step 2 | Back (outline) | Next (primary + export) |
| Step 3 | Back | Schedule / Delete (posts) or Download (app) |
| Billing / Admin | Back | — |

---

## 9. Text-style actions (not `.btn`)

### 9.1 `.link-btn`

- No padding / background / border
- Color: `--color-primary-hover`
- Underlined
- **Use:** “Create an account” in auth modal

### 9.2 `.text-link`

- Primary color, underlined
- Font: `0.8rem`, weight `500`
- **Use:** Inline “Download sample” near page subtitles

---

## 10. Accessibility checklist

- [ ] Explicit `type`
- [ ] `aria-label` when label is hidden
- [ ] `aria-hidden="true"` on decorative SVGs
- [ ] `disabled` when unavailable
- [ ] `:focus-visible` ring uses global `2px` primary outline (`outline-offset: 2px`)

---

## 11. Do / Don’t

| Do | Don’t |
|----|-------|
| One `.btn-primary` per action group | Multiple competing primary buttons |
| `.btn-danger` for delete | Red outline only for permanent delete |
| Icon before text for card/toolbar actions | Omit icons on edit/delete after the latest UI pass |
| Update `.btn-text` when changing dynamic labels | Wipe `innerHTML`/`textContent` on the whole button (removes icons) |
| Use `.ui-switch` for active/inactive | Keep text “Deactivate” buttons |

---

## 12. File map

| File | What it owns |
|------|----------------|
| `src/style.css` | `.btn`, variants, `.btn-sm`, `.btn-block`, `.btn-export`, `button.btn-icon`, `.ui-switch`, `.btn-danger` |
| `src/shell.css` | `.btn svg.btn-icon`, footer height/outline, mobile icon-only |
| `src/features/shared/uiIcons.js` | Shared SVG paths + `buttonLabel()` / `activeSwitchHtml()` |
