/**
 * Pre-built animation definitions for social templates.
 */

import { NEWS_REEL_ANIMATION } from '../../templates/social/newsReel.js';

/** @typedef {{ selector: string, from: Record<string, string>, to: Record<string, string>, start?: number, end?: number }} AnimationStep */
/** @typedef {{ duration: number, fps: number, steps: AnimationStep[] }} SocialAnimation */

export const ANIMATION_PRESETS = {
  'fade-slide-headline': {
    duration: 4000,
    fps: 15,
    steps: [
      {
        selector: '.headline',
        from: { opacity: '0', transform: 'translateY(20px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      {
        selector: '.caption',
        from: { opacity: '0', transform: 'translateY(16px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
    ],
  },
  'news-reel-stagger': NEWS_REEL_ANIMATION,
};

/**
 * @param {number} progress 0..1
 */
function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3;
}

/**
 * @param {string} value
 */
function parseOpacity(value) {
  if (value === undefined || value === null || value === '') return 1;
  return parseFloat(value);
}

/**
 * @param {string} transform
 */
function parseTranslateY(transform) {
  if (!transform || transform === 'none') return 0;
  const match = transform.match(/translateY\(([-\d.]+)px\)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * @param {string} property
 * @param {string} fromValue
 * @param {string} toValue
 * @param {number} progress
 */
export function interpolateCssValue(property, fromValue, toValue, progress) {
  const t = easeOutCubic(progress);

  if (property === 'opacity') {
    const from = parseOpacity(fromValue);
    const to = parseOpacity(toValue);
    return String(from + (to - from) * t);
  }

  if (property === 'transform') {
    const fromY = parseTranslateY(fromValue);
    const toY = parseTranslateY(toValue);
    const y = fromY + (toY - fromY) * t;
    return `translateY(${y}px)`;
  }

  return t < 1 ? fromValue : toValue;
}

/**
 * @param {ParentNode} renderRoot
 * @param {AnimationStep[]} steps
 * @param {number} progress
 */
export function applyAnimationFrame(renderRoot, steps, progress) {
  for (const step of steps) {
    const element = renderRoot.querySelector(step.selector);
    if (!element) continue;

    const start = step.start ?? 0;
    const end = step.end ?? 1;
    let stepProgress = 0;
    if (progress >= end) {
      stepProgress = 1;
    } else if (progress > start) {
      stepProgress = (progress - start) / (end - start);
    }

    const properties = new Set([...Object.keys(step.from), ...Object.keys(step.to)]);
    for (const property of properties) {
      const fromValue = step.from[property] ?? step.to[property] ?? '';
      const toValue = step.to[property] ?? step.from[property] ?? '';
      element.style[property] = interpolateCssValue(property, fromValue, toValue, stepProgress);
    }
  }
}

/**
 * @param {object} template
 */
export function syncTemplateAnimatedFlag(template) {
  const hasAnimation = Object.values(template.layouts || {}).some((layout) => layout?.animation);
  template.isAnimated = hasAnimation;
  return template;
}
