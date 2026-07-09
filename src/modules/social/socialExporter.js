/**
 * Social post static image and bulk video export.
 */
import JSZip from 'jszip';
import { renderPostToPng } from './imageRenderer.js';
import { renderPostToVideo } from './videoRenderer.js';

/** Rough client-side render multiplier vs animation duration (html2canvas per-frame). */
const BULK_VIDEO_RENDER_MULTIPLIER = 12;

/**
 * @param {Blob} blob
 * @param {string} filename
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * @param {string} value
 */
function sanitizeFilename(value) {
  return String(value)
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
}

/**
 * @param {Record<string, string>} rowData
 * @param {number} index
 */
function getRowBaseName(rowData, index) {
  const preferred = rowData.CODE || rowData.HEADLINE || rowData.headline || rowData.NAME || rowData.name;
  if (preferred) {
    const cleaned = sanitizeFilename(preferred);
    if (cleaned) return cleaned;
  }
  return `row${index + 1}`;
}

/**
 * @param {object} template
 * @param {string} bucket
 */
function getLayoutForBucket(template, bucket) {
  const layout = template.layouts?.[bucket];
  if (!layout) {
    throw new Error(`Template has no layout defined for bucket "${bucket}"`);
  }
  return layout;
}

/**
 * @param {object} template
 * @param {Record<string, string>} rowData
 * @param {typeof import('./socialFormats.js').PLATFORM_PRESETS[number]} preset
 */
export async function exportSinglePost(template, rowData, preset) {
  const layout = getLayoutForBucket(template, preset.bucket);
  const width = layout.width ?? preset.width;
  const height = layout.height ?? preset.height;
  const templateHtml = template.content?.html ?? '';
  const layoutCss = layout.css ?? '';

  const blob = await renderPostToPng(templateHtml, layoutCss, rowData, width, height);
  const filename = `post_${preset.id}.png`;
  downloadBlob(blob, filename);
  return { filename, blob, preset, width, height };
}

/**
 * @param {object} template
 * @param {Record<string, string>[]} rows
 * @param {typeof import('./socialFormats.js').PLATFORM_PRESETS[number][]} selectedPresets
 * @param {(current: number, total: number, message?: string) => void} [onProgress]
 */
export async function exportBulkPosts(template, rows, selectedPresets, onProgress) {
  const total = rows.length * selectedPresets.length;
  let current = 0;
  const zip = new JSZip();

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const rowData = rows[rowIndex];
    const rowBase = getRowBaseName(rowData, rowIndex);

    for (const preset of selectedPresets) {
      current += 1;
      onProgress?.(current, total, `Rendering ${rowBase} · ${preset.platform} ${preset.id}...`);

      const layout = getLayoutForBucket(template, preset.bucket);
      const width = layout.width ?? preset.width;
      const height = layout.height ?? preset.height;
      const templateHtml = template.content?.html ?? '';
      const layoutCss = layout.css ?? '';

      const blob = await renderPostToPng(templateHtml, layoutCss, rowData, width, height);
      const filename = `${rowBase}_${preset.id}.png`;
      zip.file(filename, blob);
    }
  }

  onProgress?.(total, total, 'Packaging zip...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, 'social-posts-export.zip');
  return zipBlob;
}

/**
 * Estimate bulk video job size for user confirmation before rendering.
 * @param {object} template
 * @param {Record<string, string>[]} rows
 * @param {typeof import('./socialFormats.js').PLATFORM_PRESETS[number][]} selectedPresets
 */
export function estimateBulkVideoJob(template, rows, selectedPresets) {
  const videoCount = rows.length * selectedPresets.length;
  if (videoCount === 0) {
    return { videoCount: 0, estimatedMinutes: 0 };
  }

  let durationSumMs = 0;
  for (const preset of selectedPresets) {
    const layout = template.layouts?.[preset.bucket];
    durationSumMs += layout?.animation?.duration ?? 4000;
  }

  const avgDurationMs = durationSumMs / selectedPresets.length;
  const productMs = rows.length * selectedPresets.length * avgDurationMs;
  const estimatedMinutes = Math.max(1, Math.ceil((productMs * BULK_VIDEO_RENDER_MULTIPLIER) / 60000));

  return { videoCount, estimatedMinutes };
}

/**
 * @param {object} template
 * @param {Record<string, string>[]} rows
 * @param {typeof import('./socialFormats.js').PLATFORM_PRESETS[number][]} selectedPresets
 * @param {(current: number, total: number, message?: string) => void} [onProgress]
 */
export async function exportBulkVideos(template, rows, selectedPresets, onProgress) {
  const total = rows.length * selectedPresets.length;
  let current = 0;
  const zip = new JSZip();

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const rowData = rows[rowIndex];
    const rowBase = getRowBaseName(rowData, rowIndex);

    for (const preset of selectedPresets) {
      current += 1;
      const layout = getLayoutForBucket(template, preset.bucket);
      if (!layout.animation) {
        throw new Error(`Layout "${preset.bucket}" has no animation configured for video export`);
      }

      const width = layout.width ?? preset.width;
      const height = layout.height ?? preset.height;
      const templateHtml = template.content?.html ?? '';
      const layoutCss = layout.css ?? '';

      onProgress?.(current, total, `Recording video ${current} of ${total} — ${rowBase} · ${preset.id}...`);

      const blob = await renderPostToVideo(
        templateHtml,
        layoutCss,
        rowData,
        width,
        height,
        layout.animation,
        (frame, frames) => {
          onProgress?.(
            current,
            total,
            `Recording ${rowBase} · ${preset.id} — frame ${frame} of ${frames}`
          );
        }
      );

      zip.file(`${rowBase}_${preset.id}.webm`, blob);
    }
  }

  onProgress?.(total, total, 'Packaging zip...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, 'social-posts-videos.zip');
  return zipBlob;
}

/**
 * @param {object} template
 * @param {Record<string, string>} rowData
 * @param {typeof import('./socialFormats.js').PLATFORM_PRESETS[number][]} selectedPresets
 * @param {(current: number, total: number, message?: string) => void} [onProgress]
 */
export async function exportSinglePostPresets(template, rowData, selectedPresets, onProgress) {
  if (selectedPresets.length === 1) {
    onProgress?.(0, 1, `Rendering ${selectedPresets[0].id}...`);
    const result = await exportSinglePost(template, rowData, selectedPresets[0]);
    onProgress?.(1, 1, 'Export complete');
    return result;
  }

  const zip = new JSZip();
  const total = selectedPresets.length;
  let current = 0;

  for (const preset of selectedPresets) {
    current += 1;
    onProgress?.(current, total, `Rendering ${preset.id}...`);

    const layout = getLayoutForBucket(template, preset.bucket);
    const width = layout.width ?? preset.width;
    const height = layout.height ?? preset.height;
    const templateHtml = template.content?.html ?? '';
    const layoutCss = layout.css ?? '';

    const blob = await renderPostToPng(templateHtml, layoutCss, rowData, width, height);
    zip.file(`post_${preset.id}.png`, blob);
  }

  onProgress?.(total, total, 'Packaging zip...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, 'social-posts-export.zip');
  return zipBlob;
}
