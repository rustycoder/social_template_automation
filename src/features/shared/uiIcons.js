/**
 * @file features/shared/uiIcons.js
 * @description Small inline SVG icons for buttons (16×16 viewBox).
 */

/** @param {string} pathMarkup Inner SVG paths */
function icon(pathMarkup) {
  return `<svg class="btn-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">${pathMarkup}</svg>`;
}

export const UI_ICONS = {
  back: icon(
    `<path d="M13 8H3M7 4L3 8L7 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  edit: icon(
    `<path d="M11.333 2.667a1.414 1.414 0 0 1 2 2L5.333 12.667 2.667 13.333l.666-2.666L11.333 2.667Z" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  trash: icon(
    `<path d="M2.667 4h10.666M6 4V2.667h4V4M5.333 4v8.667a1 1 0 0 0 1 1h3.334a1 1 0 0 0 1-1V4" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  calendar: icon(
    `<path d="M5.333 2.667V4M10.667 2.667V4M2.667 6.667h10.666M3.333 4h9.334A1.333 1.333 0 0 1 14 5.333v7.334A1.333 1.333 0 0 1 12.667 14H3.333A1.333 1.333 0 0 1 2 12.667V5.333A1.333 1.333 0 0 1 3.333 4Z" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  upload: icon(
    `<path d="M8 10.667V2.667M5.333 5.333 8 2.667l2.667 2.666M3.333 10.667v2A1.333 1.333 0 0 0 4.667 14h6.666A1.333 1.333 0 0 0 12.667 12.667v-2" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  save: icon(
    `<path d="M12.667 14H3.333A1.333 1.333 0 0 1 2 12.667V3.333A1.333 1.333 0 0 1 3.333 2h7.334L14 5.333v7.334A1.333 1.333 0 0 1 12.667 14Z" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.667 2v3.333H5.333V2M10 14V8.667H6V14" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  check: icon(
    `<path d="M13.333 4.667 6 12 2.667 8.667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  user: icon(
    `<circle cx="8" cy="5.333" r="2.667" stroke="currentColor" stroke-width="1.35"/><path d="M2.667 13.333c0-2.4 2.4-4 5.333-4s5.333 1.6 5.333 4" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/>`
  ),
  plus: icon(
    `<path d="M8 3.333v9.334M3.333 8h9.334" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
  ),
  more: icon(
    `<path d="M8 5.333V12M5.333 8.667 8 12l2.667-3.333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  close: icon(
    `<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
  ),
  chevronLeft: icon(
    `<path d="M10 12 6 8l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  chevronRight: icon(
    `<path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
};

/**
 * @param {keyof typeof UI_ICONS} name
 * @param {string} label
 * @returns {string}
 */
export function buttonLabel(name, label) {
  return `${UI_ICONS[name] ?? ''}<span class="btn-text">${label}</span>`;
}

/**
 * Update only the visible label of a `.btn` without removing icons.
 * @param {HTMLElement | null | undefined} btn
 * @param {string} label
 */
export function setButtonText(btn, label) {
  if (!btn) return;
  const textEl = btn.querySelector('.btn-text');
  if (textEl) textEl.textContent = label;
  else btn.textContent = label;
}

/**
 * Read current visible label from a `.btn`.
 * @param {HTMLElement | null | undefined} btn
 * @returns {string}
 */
export function getButtonText(btn) {
  if (!btn) return '';
  const textEl = btn.querySelector('.btn-text');
  return (textEl?.textContent ?? btn.textContent ?? '').trim();
}

/**
 * Active/inactive toggle switch markup.
 * @param {boolean} isActive
 * @param {string} [inputAttrs]
 * @returns {string}
 */
export function activeSwitchHtml(isActive, inputAttrs = '') {
  return `
    <label class="ui-switch" title="${isActive ? 'Deactivate' : 'Activate'}">
      <input type="checkbox" role="switch" data-action="toggle" ${isActive ? 'checked' : ''} ${inputAttrs} />
      <span class="ui-switch__track" aria-hidden="true"></span>
      <span class="ui-switch__text">${isActive ? 'Active' : 'Inactive'}</span>
    </label>
  `;
}
