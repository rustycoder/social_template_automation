# Style Guide — Forms (`sg_forms.md`)

**Project:** Content Studio  
**Sources:** `src/style.css`, modal/page HTML (`index.html`, `post.html`, `template.html`)  
**Token set:** Kinetic Logic

Documented patterns: auth / subscribe modals, post edit, schedule-all, admin template/category editors, posts toolbar filters, data-entry fields.

Use bullets for attributes and dimensions.

---

## 1. Principles

- Every control sits in a **labeled** group (`.form-group` or `.posts-toolbar-field`).
- Labels are uppercase micro-labels unless using `.form-label` (sentence case, larger).
- One vertical stack per form (`.auth-form` / `.admin-form`); use `.form-row` only for paired fields.
- Errors use `.form-error` (never silent failures).
- Primary submit sits last in `.admin-form-actions` (right-aligned with Cancel outline to the left).

---

## 2. Shared tokens

- Input background: `--color-bg-input` (`#ffffff`)
- Border: `--color-border` (`#e4e4e7`)
- Focus border: `--color-border-focus` / `--color-primary` (`#4f46e5`)
- Focus ring: `0 0 0 2px --color-primary-glow`
- Text: `--color-text`
- Muted: `--color-text-muted`
- Error: `--color-error` (`#dc2626`)
- Input radius: `6px` (`--radius-sm`)
- Font: `--font-sans`, input size `0.8rem`

---

## 3. Form shell

### 3.1 `.auth-form` / modal forms

- Display: `flex`, column
- Gap: `14px`
- Placement: inside `.modal-card` (default max-width `420px`; posts edit `560px`; schedule-all `520px`)

### 3.2 `.admin-form`

- Same stack pattern as auth
- Large editors may split into `.admin-template-editor__columns`

### 3.3 Actions row — `.admin-form-actions`

- Display: flex
- Justify: `flex-end`
- Gap: `10px`
- Margin top: `8px`
- Sticky optional (post edit: sticky bottom with card background)

Order: **Cancel (outline)** → **Submit (primary)**

---

## 4. Field group — `.form-group`

### 4.1 Layout

- Display: `flex`, column
- Gap: `6px` (label → control)

### 4.2 Default label (`label` inside `.form-group`)

- Font size: `0.72rem`
- Font weight: `600`
- Color: `--color-text-muted`
- Transform: `uppercase`
- Letter-spacing: `0.05em`

### 4.3 Alternate label — `.form-label`

- Display: `block`
- Font size: `0.875rem`
- Font weight: `600`
- Margin bottom: `4px`
- **Use:** Platforms / grouped chip sets (not uppercase micro-label)

### 4.4 Hint — `.form-hint`

- Margin: `0 0 10px`
- Font size: `0.8rem`
- Color: `--color-text-muted`
- Placement: directly under label / above control

### 4.5 Error — `.form-error`

- Font size: `0.82rem`
- Color: `--color-error`
- Padding: `8px 12px`
- Background: `rgba(239, 68, 68, 0.1)`
- Border: `1px solid rgba(239, 68, 68, 0.25)`
- Radius: `--radius-sm`
- Hidden via `.hidden` → `display: none`

---

## 5. Text / select / textarea — `.text-input`

### 5.1 Base attributes

- Padding: `8px 12px` (inside `.form-group` often `10px 12px` via group rule)
- Width: `100%` when in a form group
- Background: `--color-bg-input`
- Border: `1px solid --color-border`
- Radius: `6px`
- Font size: `0.8rem`
- Outline: `none`
- Transition: border-color `150ms`

### 5.2 Focus

- Border color: `--color-border-focus`
- Box shadow: `0 0 0 2px --color-primary-glow`

### 5.3 Select — `.select-input` / `select.text-input`

- Cursor: `pointer`
- Appearance: none
- Custom chevron SVG (muted) at `right 10px`
- Extra padding-right: `28px`

### 5.4 Textarea

- Same `.text-input` class
- Rows set in HTML (e.g. caption `rows="4"`, HTML editor larger)
- Prefer `spellcheck="false"` for code/HTML fields

### 5.5 Number / date / time / search

- Prefer native `type` with `.text-input`
- Search toolbars: `type="search"` + `.posts-search`
- Date clear sits beside the control in a flex row (see §8)

---

## 6. Paired fields — `.form-row`

- Display: `grid`
- Columns: `1fr 1fr`
- Gap: `12px`
- Mobile `≤` breakpoint in CSS: collapse to `1fr`
- **Use:** Schedule date + time in post edit

---

## 7. Chip multi-select — `.platform-chip`

### 7.1 Container — `.platform-checkboxes`

- Display: flex, wrap
- Gap: `8px`
- Role: `group` + `aria-label`

### 7.2 Chip element

```html
<label class="platform-chip">
  <input type="checkbox" name="…" value="facebook" />
  <span>Facebook</span>
</label>
```

### 7.3 Dimensions / states

- Input: absolute, full hit area, `opacity: 0`, `z-index: 1`
- Visible pill (span):
  - Padding: `8px 12px`
  - Border: `1px solid --color-border`
  - Radius: `999px`
  - Background: raised
  - Font: `0.85rem`, weight `500`
- Checked / `.is-selected`:
  - Border + text: `--color-primary`
  - Background: `rgba(79, 70, 229, 0.1)`
- Focus-visible: `2px` primary outline on span, offset `2px`

**Use:** Platforms, weekdays (schedule-all), similar multi-picks.

---

## 8. Toolbar filter fields (My Posts)

Pattern: `.posts-page__toolbar` → `.posts-toolbar-field`

### 8.1 Toolbar layout

- Display: flex, wrap
- Align: `end` (labels above, controls baseline-aligned)
- Gap: `12px 14px`
- Margin bottom: `18px`

### 8.2 Field

- Column flex, gap `6px`
- Flex grow defaults: `1 1 150px`
- Search grows more: `1 1 200px`
- Dates grow: `1 1 240px`
- Selection (select-all) fixed: `flex: 0 0 auto`

### 8.3 Label — `.posts-toolbar-label`

- Font: `0.72rem`, weight `600`, uppercase, letter-spacing `0.04em`
- Color: muted

### 8.4 Control height

- Inputs / selects / select-all chip: min-height `40px`
- Date row: flex, gap `6px`, clear as ghost `btn-sm` with icon

### 8.5 Select-all control — `.posts-select-all`

- Inline flex, gap `8px`
- Padding: `0 12px`
- Border + raised background + radius `--radius-sm`
- Checkbox: `16 × 16`, accent `--color-primary`

---

## 9. Checkbox / switch patterns

### 9.1 Plain checkbox in admin

- `.admin-form-check` / `.admin-check` for “Active” on category form
- Keep label readable (sentence case), not uppercase micro-label

### 9.2 Active switch

- Use `.ui-switch` — specs in `sg_buttons.md` §7
- Wire on `change` (not only click)

---

## 10. Modal form placement

| Modal | Card class | Max width | Notes |
|-------|------------|-----------|-------|
| Auth | `.modal-card.auth-modal` | `420px` | name group toggled hidden |
| Post edit | `.post-edit-modal` | `560px` | sticky actions, optional image |
| Schedule all | `.schedule-all-modal` | `520px` | scrollable, dynamic time slots |
| Admin template | `.admin-template-editor-modal` | large | multi-column editor |
| Admin category | `.admin-form-modal` | standard | short fields |

### 10.1 Modal chrome

- Overlay: fixed inset `0`, blur, `z-index: 1000`, padding `24px`
- Close: `32 × 32` top-right, radius `--radius-sm`
- Title: `1.25rem`
- Description: `.modal-desc` muted `0.88rem`, margin bottom `20px`

---

## 11. Dynamic fields (schedule-all time slots)

- Container: `.schedule-slots-grid`
- Columns: `repeat(auto-fill, minmax(140px, 1fr))`, gap `12px`
- Each slot is a `.form-group.schedule-slot-field` with `type="time"`
- Slot count must equal **Posts per day** frequency

---

## 12. Data-entry fields (Step 2)

- List root: `#fields-list` / `.fields-list`
- Grid rows often use `.field-grid` (label | control | optional action)
- Keep required indicators via `.required-badge` (error-red accent)
- Image fields may include sample upload styled as `.btn.btn-outline.btn-sm`

---

## 13. Validation UX rules

- Block submit when required platforms / date / time missing (post edit, schedule-all).
- Surface messages in `.form-error` above the action row.
- Clear error on successful correction / next open.
- For bulk schedule, also show live `.schedule-all-preview` text under fields.

---

## 14. Accessibility checklist

- [ ] Every input has a `<label for>` or wrapping label
- [ ] Groups that are chip sets use `role="group"` + `aria-label`
- [ ] Errors are text nodes (not color-only)
- [ ] Focus ring visible on inputs and chips
- [ ] Required fields announced via `required` attribute and/or visible label cue

---

## 15. Do / Don’t

| Do | Don’t |
|----|-------|
| Align toolbar fields with shared label + 40px control height | Mix unlabeled selects beside labeled dates |
| Put Cancel left, Primary right in form actions | Put destructive submit as the only outline button without danger styling |
| Reuse `.text-input` for selects | Invent a third input border style |
| Keep chip selected state with primary tint | Use checkboxes alone for platform multi-select in modals |
| Update only `.btn-text` when changing submit labels | Replace whole button `textContent` (strips icons) |

---

## 16. File map

| File | Role |
|------|------|
| `src/style.css` | `.form-group`, `.text-input`, chips, toolbar fields, modal, errors |
| `post.html` | Posts filters, edit modal, schedule-all |
| `index.html` | Auth, subscribe, export schedule-all |
| `template.html` | Admin template/category forms |
| `src/features/modules/ScheduleAllModal.js` | Dynamic slots + validation |
| `src/features/auth/postsUI.js` | Post edit submit rules |
| `sg_buttons.md` | Submit / cancel / danger / switch specs |
