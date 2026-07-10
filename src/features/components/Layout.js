/**
 * @file features/components/Layout.js
 * @description Application shell — fixed header with step indicator, sticky action footer with slots,
 *              and main content viewport wrapper used by all three workflow pages.
 * @dependencies features/shared/constants.js
 * @state Stateless DOM helpers; LayoutModule owns active step and footer panel visibility.
 */

import { GALLERY_BUCKETS, BUCKET_RATIO_LABELS } from '../shared/constants.js';

/** @type {ReadonlyArray<{ id: number, label: string }>} Workflow steps rendered in the header track. */
export const WORKFLOW_STEPS = [
  { id: 1, label: 'Template' },
  { id: 2, label: 'Data' },
  { id: 3, label: 'Export' },
];

/**
 * @description SVG icon markup for each aspect-ratio footer segment button.
 * @type {Record<string, string>}
 */
const ASPECT_SEGMENT_ICONS = {
  square:
    '<svg class="aspect-segment__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg>',
  portrait:
    '<svg class="aspect-segment__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="5" y="2" width="10" height="16" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg>',
  story:
    '<svg class="aspect-segment__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="6" y="1" width="8" height="18" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg>',
  landscape:
    '<svg class="aspect-segment__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="1" y="6" width="18" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg>',
};

/**
 * @description Human-readable aspect segment labels shown in the Step 1 footer.
 * @type {Record<string, string>}
 */
const ASPECT_SEGMENT_LABELS = {
  square: 'Square',
  portrait: 'Portrait',
  story: 'Story/Reel',
  landscape: 'Landscape',
};

/**
 * @description Updates the header step track to reflect the active workflow step.
 * @param {number} currentStep Active step (1, 2, or 3).
 * @param {number} [maxAccessibleStep=3] Highest step the user may navigate to.
 * @returns {void}
 */
export function syncStepIndicator(currentStep, maxAccessibleStep = 3) {
  document.querySelectorAll('.step-node').forEach((btn) => {
    const btnStep = parseInt(btn.dataset.step, 10);
    btn.classList.remove('active', 'completed');
    btn.disabled = btnStep > maxAccessibleStep;

    if (btnStep === currentStep) btn.classList.add('active');
    else if (btnStep < currentStep) btn.classList.add('completed');
  });
}

/**
 * @description Binds click handlers on header step nodes.
 * @param {(step: number) => void} onStepClick Called with the target step when navigation is allowed.
 * @param {() => number} getMaxAccessibleStep Returns the highest navigable step.
 * @returns {void}
 */
export function bindStepNavigation(onStepClick, getMaxAccessibleStep) {
  document.querySelectorAll('.step-node').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.dataset.step, 10);
      if (step <= getMaxAccessibleStep()) {
        onStepClick(step);
      }
    });
  });
}

/**
 * @description Renders a three-slot action footer panel (left / center / right).
 *              Used for Step 2 and Step 3 nav footers to avoid duplicating layout markup.
 * @param {object} slots
 * @param {HTMLElement | DocumentFragment | null} [slots.leftActions=null] Left-aligned actions (e.g. Back).
 * @param {HTMLElement | DocumentFragment | null} [slots.centerActions=null] Centered actions (rare).
 * @param {HTMLElement | DocumentFragment | null} [slots.rightActions=null] Right-aligned primary actions.
 * @param {string} [slots.panelClass='footer-panel--nav'] Additional panel modifier class.
 * @param {string} slots.footerStep data-footer-step value (2 or 3).
 * @param {string} [slots.panelId] Optional element id for the panel.
 * @returns {HTMLElement} Assembled footer panel element.
 */
export function createActionFooterPanel({
  leftActions = null,
  centerActions = null,
  rightActions = null,
  panelClass = 'footer-panel--nav',
  footerStep,
  panelId = '',
}) {
  const panel = document.createElement('div');
  panel.className = `footer-panel ${panelClass}`;
  panel.dataset.footerStep = String(footerStep);
  if (panelId) panel.id = panelId;

  const left = document.createElement('div');
  left.className = 'footer-slot footer-slot--left';
  if (leftActions) left.appendChild(leftActions);

  const center = document.createElement('div');
  center.className = 'footer-slot footer-slot--center';
  if (centerActions) center.appendChild(centerActions);

  const right = document.createElement('div');
  right.className = 'footer-slot footer-slot--right';
  if (rightActions) right.appendChild(rightActions);

  panel.append(left, center, right);
  return panel;
}

/**
 * @description Creates the Step 1 aspect-ratio segment control for the sticky footer.
 * @param {string} [activeBucket='square'] Currently selected gallery bucket.
 * @returns {HTMLElement} Footer panel containing aspect segment buttons.
 */
export function createAspectFooterPanel(activeBucket = 'square') {
  const panel = document.createElement('div');
  panel.className = 'footer-panel footer-panel--aspect';
  panel.id = 'footer-step-1';
  panel.dataset.footerStep = '1';

  const segment = document.createElement('div');
  segment.className = 'aspect-segment';
  segment.id = 'template-format-tabs';
  segment.setAttribute('role', 'group');
  segment.setAttribute('aria-label', 'Aspect ratio');

  for (const bucket of GALLERY_BUCKETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `aspect-segment__btn${bucket === activeBucket ? ' active' : ''}`;
    btn.dataset.galleryBucket = bucket;
    const ratio = BUCKET_RATIO_LABELS[bucket] ?? '';
    const label = ASPECT_SEGMENT_LABELS[bucket] ?? bucket;
    btn.innerHTML = `${ASPECT_SEGMENT_ICONS[bucket] ?? ''}<span>${label} <small>${ratio}</small></span>`;
    segment.appendChild(btn);
  }

  panel.appendChild(segment);
  return panel;
}

/**
 * @description Activates the footer panel matching the current workflow step on #app and #app-footer.
 * @param {number} step Active step (1, 2, or 3).
 * @returns {void}
 */
export function syncFooterPanel(step) {
  const app = document.getElementById('app');
  const footer = document.getElementById('app-footer');
  if (app) app.dataset.activeStep = String(step);

  footer?.querySelectorAll('.footer-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.footerStep === String(step));
  });
}

/**
 * @description Applies shell layout constraints when entering the Data page split view.
 *              height: calc(100dvh - header - footer) keeps the preview column from overflowing
 *              the viewport while the form column scrolls independently (see shell.css).
 * @param {number} step Active workflow step.
 * @returns {void}
 */
export function syncMainContentLayout(step) {
  const main = document.getElementById('main-content');
  if (!main) return;

  // Step 2 uses a full-bleed split layout; other steps use padded scrollable content.
  main.dataset.layoutMode = step === 2 ? 'split' : 'default';
}

/**
 * @description Shows exactly one step panel inside #main-content.
 * @param {number} step Active step (1, 2, or 3).
 * @returns {void}
 */
export function activateStepPanel(step) {
  document.querySelectorAll('.step-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `step-${step}`);
  });
  syncMainContentLayout(step);
}

/**
 * @description Ensures footer slot containers exist for nav panels (idempotent).
 *              Call once during app bootstrap if using static index.html footers.
 * @returns {void}
 */
export function enhanceFooterSlots() {
  document.querySelectorAll('.footer-panel--nav').forEach((panel) => {
    if (panel.querySelector('.footer-slot')) return;

    const children = [...panel.children];
    const left = document.createElement('div');
    left.className = 'footer-slot footer-slot--left';
    const right = document.createElement('div');
    right.className = 'footer-slot footer-slot--right';

    if (children.length >= 2) {
      left.appendChild(children[0]);
      right.appendChild(children[1]);
    } else if (children.length === 1) {
      right.appendChild(children[0]);
    }

    panel.innerHTML = '';
    panel.append(left, right);
  });
}
