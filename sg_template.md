# Style Guide — Template Card (`sg_template.md`)

**Project:** Content Studio  
**UI component:** Gallery / Export / Admin template cards  
**Factory:** `src/features/components/PostCard.js`  
**Styles:** `src/style.css`, `src/shell.css`  
**Note:** This guide covers the **UI card** in the app (select / manage templates), not HTML post-template authoring files under `src/templates/html/`.

Use bullets for dimensions and placement so values are easy to edit.

---

## 1. Card variants (class map)

| Variant | Root classes | Where |
|---------|--------------|--------|
| Gallery select | `.template-card` + `.post-card` | Step 1 template grid |
| Export tile | `.post-card` + `.post-card--has-checkbox` + `.export-post-tile` | Step 3 export grid |
| Admin manage | `.template-card` + `.admin-template-card` | `template.html` admin grid |

Factory helpers:

- `createPostCard()` / `createPostCardPreview()` / `createPlatformTags()` in `PostCard.js`
- Admin builds the same preview + body, then appends `.admin-template-card__actions`

---

## 2. Principles

- Card is a vertical stack: **preview → body → (optional actions)**.
- Preview fills full card width; aspect ratio comes from the active format bucket.
- Selection / hover chrome must not reflow the grid (overlays and outlines only).
- Unavailable templates are visually dimmed and non-interactive.
- Admin cards disable the gallery “Select” hover overlay.

---

## 3. Root card — `.template-card` / `.post-card`

### 3.1 Layout

- Display: `flex`
- Direction: `column`
- Width: `100%` of grid cell
- Overflow: `hidden`
- Cursor (gallery): `pointer`
- Cursor (admin): `default` (`.admin-template-card`)

### 3.2 Surface

- Background: `--color-bg-card` (`#ffffff`)
- Border: `1px solid --color-border` (`#e4e4e7`)
- Border radius: `0` (`--radius-card` in shell; cards are square-cornered)
- Box shadow: `--shadow-sm`
- Transition: `--transition-base` (`250ms`) on transform / border / shadow

### 3.3 Grid placement

**Gallery / export (`#template-grid`, `#export-ratio-grid`):**

- Display: CSS grid
- Gap: `12px` (bucket columns vary — see shell/style grid rules)
- Cell min widths by bucket (auto-fill), e.g. square ~`minmax(200px, 1fr)`

**Admin (`.admin-template-grid`):**

- Columns: `repeat(auto-fill, minmax(220px, 1fr))`
- Gap: `16px`
- Mobile `≤640px`: `minmax(160px, 1fr)`, gap `12px`

---

## 4. Entrance animation (gallery)

- Animation: `cardReveal` `0.5s ease both`
- Stagger: nth-child delays `0s … 0.54s` in `0.06s` steps (first 10 cards)

---

## 5. Preview block — `.template-preview-container` / `.post-card__preview`

### 5.1 Layout

- Width: `100%`
- Default aspect-ratio: `1` (square)
- Display: flex, center content
- Overflow: `hidden`
- Position: `relative`
- Border bottom: `1px solid --color-border`
- Background: `--color-surface-dim`

### 5.2 Bucket aspect ratios

| Bucket | Aspect ratio | Selector pattern |
|--------|--------------|------------------|
| Square | `1 / 1` | default |
| Portrait | `4 / 5` | `[data-gallery-bucket="portrait"]` |
| Story | `9 / 16` | `[data-gallery-bucket="story"]` |
| Landscape | `1200 / 628` | `[data-gallery-bucket="landscape"]` |

Admin cards also set `data-gallery-bucket` on the card root for the same ratios.

### 5.3 Mount point

- Class: `.template-preview-mount` / `.post-card__mount`
- Role: live HTML preview host (`renderGalleryPreview`)

### 5.4 Aspect badge — `.template-aspect-badge`

- Position: `absolute`, `top: 10px`, `right: 10px`, `z-index: 1`
- Padding: `4px 10px`
- Font: `0.68rem`, weight `600`, letter-spacing `0.04em`
- Background: `rgba(255,255,255,0.92)`
- Border: `1px solid --color-border`
- Radius: `999px` (pill)
- Shadow: `--shadow-sm`
- Content: ratio label from `BUCKET_RATIO_LABELS` (e.g. `1:1`)

---

## 6. Body — `.template-card-body` / `.post-card__body`

### 6.1 Spacing

- Padding: `10px 12px`
- Admin body (`.admin-template-card__body`): column flex, gap `6px`

### 6.2 Title — `.template-card-heading` / `.post-card__heading`

- Margin: `0`
- Font size: `0.9rem`
- Font weight: `600`
- Color: `--color-text`
- Letter-spacing: `-0.01em`

### 6.3 Category — `.template-card-category` / `.post-card__category`

- Muted metadata under/beside title
- Color: muted text token

### 6.4 Platform row — `.template-card-platforms` / `.post-card__platforms`

- Display: flex, wrap
- Gap: `6px`
- Margin top: `8px`
- `aria-label`: “Supported social platforms for this aspect ratio”

### 6.5 Platform icons — `.platform-tag--icon`

- Size: `26 × 26px`
- Radius: `50%` (circle)
- Border: `1px solid --color-border`
- Background: `--color-bg-hover`
- SVG inside: `14 × 14px`
- Hover tints per network (Instagram pink, Facebook blue, etc.)
- Empty state: `.platform-tag--muted` / `--fallback` (same 26px circle, letter or `—`)

### 6.6 Admin-only body extras

- Mono id: `.admin-mono` at `0.72rem`
- Status pill: `.admin-status-badge.active|inactive` (self-start)

---

## 7. Interactive states

### 7.1 Gallery hover overlay — `::after` on `.template-card`

- Content text: `Select`
- Position: absolute inset `0`
- Background: `rgba(79, 70, 229, 0.88)`
- Text: white, `0.9rem`, weight `600`
- Default opacity: `0`
- Hover opacity: `1`
- `pointer-events: none`, `z-index: 2`
- **Admin:** `.admin-template-card::after { display: none }`

### 7.2 Gallery hover lift

- Transform: `translateY(-2px)`
- Border color: `--color-primary`
- Shadow: `--shadow-md`
- **Admin / export checkbox hover:** lift disabled (`transform: none`)

### 7.3 Selected

Classes: `.template-card.selected`, `.post-card--selected`, `.export-post-tile.post-card--selected`

- Border color: `--color-primary`
- Box shadow: `0 0 0 2px --color-primary-glow`
- Shell also adds outline: `2px solid --color-primary`, `outline-offset: 2px`
- Opacity: `1`

### 7.4 Unavailable — `.template-card--unavailable` / `.post-card--unavailable`

- Opacity: `0.55`
- Cursor: `not-allowed`
- `pointer-events: none`
- Hover `::after` hidden

### 7.5 Export unchecked — `.post-card--unchecked`

- Opacity: `0.65`
- Preview filter: `grayscale(0.1)`

### 7.6 Admin inactive — `.admin-template-card--inactive`

- Opacity: `0.72`

---

## 8. Export checkbox tile extras

- Root includes `.post-card--has-checkbox`
- Checkbox: `.export-post-checkbox` / `.post-card__checkbox` (positioned on preview)
- Unchecked styling as §7.5
- No gallery “Select” overlay behavior for export tiles

---

## 9. Admin actions row — `.admin-template-card__actions`

### 9.1 Placement

- Below body
- Padding: `0 12px 12px`
- Display: flex, wrap, `align-items: center`
- Gap: `8px`

### 9.2 Controls (required pattern)

1. **Edit** — `.btn.btn-primary.btn-sm` + edit icon + “Edit”
2. **Active switch** — `.ui-switch` (`margin-left: auto`)
3. **Delete** — `.btn.btn-danger.btn-sm` + trash icon + “Delete”

See `sg_buttons.md` for button / switch specs.

---

## 10. Element tree (gallery card)

```
article.template-card.post-card
  ├── div.template-preview-container.post-card__preview
  │     ├── span.template-aspect-badge          (optional)
  │     └── div.template-preview-mount
  └── div.template-card-body.post-card__body
        ├── h4.template-card-heading
        ├── span.template-card-category          (optional)
        └── div.template-card-platforms
              └── span.platform-tag.platform-tag--icon × N
```

Admin adds:

```
└── div.admin-template-card__actions
      ├── button[data-action=edit]
      ├── label.ui-switch
      └── button[data-action=delete]
```

---

## 11. Accessibility checklist

- [ ] Preview mount has meaningful empty state (“No preview”) when render fails
- [ ] Platform row has `aria-label`
- [ ] Unavailable cards are not focusable / clickable (`pointer-events: none`)
- [ ] Export checkbox is keyboard operable
- [ ] Admin Edit / Delete / switch are separate focusable controls

---

## 12. Do / Don’t

| Do | Don’t |
|----|-------|
| Keep card radius at `0` (design system) | Round cards inconsistently with shell tokens |
| Drive preview ratio from bucket data attrs | Hard-code only 1:1 for every card |
| Use factory in `PostCard.js` for new cards | Duplicate preview/body markup ad hoc |
| Put admin actions in `__actions` row | Overlay Edit/Delete on the preview |
| Hide Select overlay on admin cards | Leave `::after` content “Select” on manage UI |

---

## 13. File map

| File | Role |
|------|------|
| `src/features/components/PostCard.js` | DOM factory |
| `src/style.css` | `.template-card`, preview, body, platforms, admin overrides |
| `src/shell.css` | Shared `.post-card` selection / hover tokens |
| `src/features/auth/adminUI.js` | Admin card assemble + actions |
| `src/features/rendering/templateGalleryPreview.js` | Live thumbnail render |
