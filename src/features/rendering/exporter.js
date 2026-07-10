/**
 * @file features/rendering/exporter.js
 * @description Public alias for bulk and single-post PNG/ZIP export functions.
 * @dependencies features/rendering/socialExporter.js
 * @state None — re-exports only.
 */

export {
  exportBulkPosts,
  exportSinglePostPresets,
} from './socialExporter.js';
