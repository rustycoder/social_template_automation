/**
 * @file features/rendering/preview.js
 * @description Public alias for the live post preview renderer used on Data and Export pages.
 * @dependencies features/rendering/socialPreview.js
 * @state None — re-exports only.
 */

export { SocialPreview as PostPreview, getDefaultDimensionsForBucket } from './socialPreview.js';
