/**
 * @file features/shared/platformIcons.js
 * @description Inline SVG icons for supported social platforms shown on template/export cards.
 * @dependencies None
 * @state None — static icon map.
 */

/** @type {Record<string, { slug: string, label: string, svg: string }>} */
export const PLATFORM_ICONS = {
  Instagram: {
    slug: 'instagram',
    label: 'Instagram',
    svg: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.75"/><circle cx="12" cy="12" r="4.25" stroke="currentColor" stroke-width="1.75"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor"/></svg>`,
  },
  TikTok: {
    slug: 'tiktok',
    label: 'TikTok',
    svg: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15.5 4.5c.4 1.6 1.4 2.9 3 3.6v3.2c-1.1 0-2.1-.3-3-.8v6.4a5.3 5.3 0 1 1-5.3-5.3c.3 0 .6 0 .9.1v3.4a2 2 0 1 0 1.4 1.9V4.5h2z" fill="currentColor"/></svg>`,
  },
  Facebook: {
    slug: 'facebook',
    label: 'Facebook',
    svg: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 8.5h2.5l-.5 3H14v8.5h-3.5V11.5H9V8.5h1.5V6.8c0-2 1.2-3.3 3.2-3.3.9 0 1.8.1 2.3.2v2.8H14c-.8 0-1 .4-1 1v1.5z" fill="currentColor"/></svg>`,
  },
  LinkedIn: {
    slug: 'linkedin',
    label: 'LinkedIn',
    svg: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.5 9.5H9v9.5H6.5V9.5zM7.75 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM10.5 9.5h2.4v1.3h.1c.3-.6 1.1-1.3 2.3-1.3 2.5 0 3 1.6 3 3.7v5.8H15.5v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7v5.2h-2.3V9.5z" fill="currentColor"/></svg>`,
  },
  X: {
    slug: 'x',
    label: 'X',
    svg: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
};

/**
 * @description Creates an icon badge element for a platform name.
 * @param {string} platformName Display name from socialFormats (e.g. "Instagram").
 * @returns {HTMLElement}
 */
export function createPlatformIcon(platformName) {
  const meta = PLATFORM_ICONS[platformName];
  const tag = document.createElement('span');
  tag.className = `platform-tag platform-tag--icon${meta ? ` platform-tag--${meta.slug}` : ''}`;
  tag.title = platformName;
  tag.setAttribute('aria-label', platformName);

  if (meta) {
    tag.innerHTML = meta.svg;
  } else {
    tag.textContent = platformName.charAt(0);
    tag.classList.add('platform-tag--fallback');
  }

  return tag;
}
