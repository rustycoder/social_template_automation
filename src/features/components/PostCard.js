/**
 * @file features/components/PostCard.js
 * @description Unified post card primitive shared by Template Page (selection) and Export Page (checkbox tiles).
 * @dependencies features/shared/constants.js
 * @state Stateless DOM factory — callers own event bindings and selection state.
 */

import { BUCKET_RATIO_LABELS } from '../shared/constants.js';
import { createPlatformIcon } from '../shared/platformIcons.js';
import { getPlatformLabelsForBucket } from '../rendering/socialFormats.js';

/**
 * @description Creates a row of platform icon badges for the active aspect-ratio bucket.
 * @param {string} bucket Format bucket id (square, portrait, story, landscape).
 * @param {'image' | 'video'} [mediaType='image'] Media type filter for platform presets.
 * @returns {HTMLElement} Platform icons container.
 */
export function createPlatformTags(bucket, mediaType = 'image') {
  const platforms = getPlatformLabelsForBucket(bucket, mediaType);
  const row = document.createElement('div');
  row.className = 'template-card-platforms post-card__platforms';
  row.setAttribute('aria-label', 'Supported social platforms for this aspect ratio');

  if (platforms.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'platform-tag platform-tag--muted';
    empty.textContent = '—';
    empty.title = 'No platforms';
    row.appendChild(empty);
    return row;
  }

  for (const name of platforms) {
    row.appendChild(createPlatformIcon(name));
  }

  return row;
}

/**
 * @description Builds the card body with title and optional platform tags.
 * @param {string} title Card heading text.
 * @param {string} [bucket] When set, renders platform tags for this aspect bucket.
 * @returns {HTMLElement}
 */
function createCardBody(title, bucket = '') {
  const body = document.createElement('div');
  body.className = 'template-card-body post-card__body';

  const heading = document.createElement('h4');
  heading.textContent = title;
  body.appendChild(heading);

  if (bucket) {
    body.appendChild(createPlatformTags(bucket));
  }

  return body;
}

/**
 * @description Builds the modifier class list for a post card from boolean flags.
 * @param {object} modifiers
 * @param {boolean} [modifiers.hasCheckbox=false] Adds export selection checkbox styling hooks.
 * @param {boolean} [modifiers.hasHoverOverlay=false] Enables hover overlay affordances.
 * @param {boolean} [modifiers.selected=false] Marks card as actively selected (template page).
 * @param {boolean} [modifiers.unavailable=false] Dims card when layout is missing for bucket.
 * @param {boolean} [modifiers.checked=false] Reflects export checkbox checked state on the card.
 * @returns {string[]} CSS class names to apply on the root element.
 */
export function getPostCardClasses(modifiers = {}) {
  const {
    hasCheckbox = false,
    hasHoverOverlay = false,
    selected = false,
    unavailable = false,
    checked = true,
  } = modifiers;

  const classes = ['post-card'];

  if (hasCheckbox) classes.push('post-card--has-checkbox', 'export-post-tile');
  else classes.push('template-card');

  if (hasHoverOverlay) classes.push('post-card--has-hover-overlay');
  if (selected || (hasCheckbox && checked)) classes.push('selected', 'post-card--selected');
  if (unavailable) classes.push('template-card--unavailable', 'post-card--unavailable');
  if (hasCheckbox && !checked) classes.push('post-card--unchecked');

  return classes;
}

/**
 * @description Creates the preview mount region used by both template and export cards.
 * @param {object} options
 * @param {string} [options.bucket='square'] Gallery bucket driving aspect-ratio CSS on the container.
 * @param {string} [options.templateId] Template key stored on the preview mount for gallery renders.
 * @param {string} [options.aspectLabel] Optional badge text (e.g. "1:1"); derived from bucket when omitted.
 * @param {boolean} [options.showAspectBadge=true] Whether to render the corner aspect-ratio badge.
 * @returns {HTMLElement} Preview container with inner mount node.
 */
export function createPostCardPreview({
  bucket = 'square',
  templateId = '',
  aspectLabel = BUCKET_RATIO_LABELS[bucket] ?? '',
  showAspectBadge = true,
} = {}) {
  const container = document.createElement('div');
  container.className = 'template-preview-container post-card__preview';

  if (showAspectBadge && aspectLabel) {
    const badge = document.createElement('span');
    badge.className = 'template-aspect-badge post-card__aspect-badge';
    badge.textContent = aspectLabel;
    container.appendChild(badge);
  }

  const mount = document.createElement('div');
  mount.className = 'template-preview-mount post-card__mount';
  if (templateId) mount.dataset.templateId = templateId;
  container.appendChild(mount);

  return container;
}

/**
 * @description Creates a template-page card with title body and optional click handler.
 * @param {object} options
 * @param {string} options.templateKey Unique template identifier.
 * @param {string} options.title Display name shown under the preview.
 * @param {string} options.bucket Active gallery bucket for aspect ratio.
 * @param {boolean} [options.selected=false] Whether this card is the current selection.
 * @param {boolean} [options.unavailable=false] Whether the template lacks a layout for the bucket.
 * @param {(key: string) => void} [options.onSelect] Invoked when an available card is clicked.
 * @returns {HTMLElement} Fully assembled template card element.
 */
export function createTemplateCard({
  templateKey,
  title,
  bucket,
  selected = false,
  unavailable = false,
  onSelect = null,
}) {
  const card = document.createElement('div');
  card.className = getPostCardClasses({ selected, unavailable }).join(' ');
  card.dataset.template = templateKey;

  const preview = createPostCardPreview({ bucket, templateId: templateKey });
  card.appendChild(preview);

  card.appendChild(createCardBody(title, bucket));

  if (!unavailable && typeof onSelect === 'function') {
    card.addEventListener('click', () => onSelect(templateKey));
  }

  return card;
}

/**
 * @description Creates an export-page card matching Template Page card structure (preview + label).
 * @param {object} options
 * @param {number} options.rowIndex Zero-based data row index.
 * @param {string} options.rowLabel Human-readable label for the post.
 * @param {string} options.bucket Export format bucket id.
 * @param {boolean} options.checked Whether the row is selected for export.
 * @param {HTMLElement} [options.previewContainer] Pre-built preview container from createPostCardPreview.
 * @param {(rowIndex: number, checked: boolean) => void} [options.onCheckChange] Checkbox change handler.
 * @returns {HTMLElement} Export tile root element.
 */
export function createExportCard({
  rowIndex,
  rowLabel,
  bucket,
  checked,
  previewContainer = null,
  onCheckChange = null,
}) {
  const tile = document.createElement('div');
  tile.className = getPostCardClasses({ hasCheckbox: true, checked }).join(' ');
  tile.dataset.bucket = bucket;
  tile.dataset.rowIndex = String(rowIndex);

  const preview =
    previewContainer ?? createPostCardPreview({ bucket, showAspectBadge: false });
  tile.appendChild(preview);

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'export-post-checkbox post-card__checkbox';
  checkbox.checked = checked;
  checkbox.setAttribute('aria-label', `Select ${rowLabel}`);
  checkbox.addEventListener('click', (e) => e.stopPropagation());
  checkbox.addEventListener('change', () => {
    const isChecked = checkbox.checked;
    tile.classList.toggle('post-card--unchecked', !isChecked);
    tile.classList.toggle('post-card--selected', isChecked);
    tile.classList.toggle('selected', isChecked);
    if (typeof onCheckChange === 'function') {
      onCheckChange(rowIndex, isChecked);
    }
  });
  tile.appendChild(checkbox);

  tile.appendChild(createCardBody(rowLabel, bucket));

  return tile;
}
