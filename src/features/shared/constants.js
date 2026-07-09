/**
 * @file features/shared/constants.js
 * @description Shared workflow constants used across Template, Data, and Export pages.
 * @dependencies None — pure data exports.
 * @state None — immutable configuration values.
 */

/** @type {Record<string, string>} Aspect ratio display labels keyed by bucket id. */
export const BUCKET_RATIO_LABELS = {
  square: '1:1',
  portrait: '4:5',
  story: '9:16',
  landscape: '1.91:1',
};

/** @type {string[]} Ordered bucket ids for gallery and export format tabs. */
export const GALLERY_BUCKETS = ['square', 'portrait', 'story', 'landscape'];

/** @type {number} Default number of template cards shown before "Load more". */
export const DEFAULT_GALLERY_LIMIT = 12;

/** @type {number} Increment applied when loading more template cards. */
export const GALLERY_LIMIT_STEP = 12;
