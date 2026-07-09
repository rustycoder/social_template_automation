/**
 * Social post static image and bulk video export.
 */
import JSZip from 'jszip';
import { renderPostToCanvas, canvasToBlob } from './imageRenderer.js';
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
 * @param {string} bucket
 * @param {(bucket: string) => string} [getBucketCss]
 */
export async function exportBucketImage(template, rowData, bucket, getBucketCss) {
  const layout = getLayoutForBucket(template, bucket);
  const width = layout.width ?? 1080;
  const height = layout.height ?? 1080;
  const templateHtml = template.content?.html ?? '';
  const layoutCss = getBucketCss?.(bucket) ?? layout.css ?? '';

  const canvas = await renderPostToCanvas(templateHtml, layoutCss, rowData, width, height);
  const blob = await canvasToBlob(canvas);
  const filename = `post_${bucket}.png`;
  return { filename, blob, bucket, width, height };
}

/**
 * @param {object} template
 * @param {Record<string, string>} rowData
 * @param {string} bucket
 * @param {(bucket: string) => string} [getBucketCss]
 */
export async function exportSinglePost(template, rowData, bucket, getBucketCss) {
  const result = await exportBucketImage(template, rowData, bucket, getBucketCss);
  downloadBlob(result.blob, result.filename);
  return result;
}

/**
 * @param {object} template
 * @param {{ rowData: Record<string, string>, rowIndex: number }[]} rowEntries
 * @param {string[]} selectedBuckets
 * @param {(current: number, total: number, message?: string) => void} [onProgress]
 * @param {(bucket: string) => string} [getBucketCss]
 */
export async function exportBulkPosts(template, rowEntries, selectedBuckets, onProgress, getBucketCss) {
  const total = rowEntries.length * selectedBuckets.length;
  let current = 0;
  const zip = new JSZip();

  for (const { rowData, rowIndex } of rowEntries) {
    const rowBase = getRowBaseName(rowData, rowIndex);

    for (const bucket of selectedBuckets) {
      current += 1;
      onProgress?.(current, total, `Rendering ${rowBase} · ${bucket}...`);

      const { blob } = await exportBucketImage(template, rowData, bucket, getBucketCss);
      const filename = `${rowBase}_${bucket}.png`;
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
 * @param {{ rowData: Record<string, string>, rowIndex: number }[]} rowEntries
 * @param {string[]} selectedBuckets
 */
export function estimateBulkVideoJob(template, rowEntries, selectedBuckets) {
  const videoCount = rowEntries.length * selectedBuckets.length;
  if (videoCount === 0) {
    return { videoCount: 0, estimatedMinutes: 0 };
  }

  let durationSumMs = 0;
  for (const bucket of selectedBuckets) {
    const layout = template.layouts?.[bucket];
    durationSumMs += layout?.animation?.duration ?? 4000;
  }

  const avgDurationMs = durationSumMs / selectedBuckets.length;
  const productMs = rowEntries.length * selectedBuckets.length * avgDurationMs;
  const estimatedMinutes = Math.max(1, Math.ceil((productMs * BULK_VIDEO_RENDER_MULTIPLIER) / 60000));

  return { videoCount, estimatedMinutes };
}

/**
 * @param {object} template
 * @param {{ rowData: Record<string, string>, rowIndex: number }[]} rowEntries
 * @param {string[]} selectedBuckets
 * @param {(current: number, total: number, message?: string) => void} [onProgress]
 * @param {(bucket: string) => string} [getBucketCss]
 */
export async function exportBulkVideos(template, rowEntries, selectedBuckets, onProgress, getBucketCss) {
  const total = rowEntries.length * selectedBuckets.length;
  let current = 0;
  const zip = new JSZip();

  for (const { rowData, rowIndex } of rowEntries) {
    const rowBase = getRowBaseName(rowData, rowIndex);

    for (const bucket of selectedBuckets) {
      current += 1;
      const layout = getLayoutForBucket(template, bucket);
      if (!layout.animation) {
        throw new Error(`Layout "${bucket}" has no animation configured for video export`);
      }

      const width = layout.width ?? 1080;
      const height = layout.height ?? 1080;
      const templateHtml = template.content?.html ?? '';
      const layoutCss = getBucketCss?.(bucket) ?? layout.css ?? '';

      onProgress?.(current, total, `Recording video ${current} of ${total} — ${rowBase} · ${bucket}...`);

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
            `Recording ${rowBase} · ${bucket} — frame ${frame} of ${frames}`
          );
        }
      );

      zip.file(`${rowBase}_${bucket}.webm`, blob);
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
 * @param {string[]} selectedBuckets
 * @param {(current: number, total: number, message?: string) => void} [onProgress]
 * @param {(bucket: string) => string} [getBucketCss]
 */
export async function exportSinglePostPresets(template, rowData, selectedBuckets, onProgress, getBucketCss) {
  if (selectedBuckets.length === 1) {
    onProgress?.(0, 1, `Rendering ${selectedBuckets[0]}...`);
    const result = await exportSinglePost(template, rowData, selectedBuckets[0], getBucketCss);
    onProgress?.(1, 1, 'Export complete');
    return result;
  }

  const zip = new JSZip();
  const total = selectedBuckets.length;
  let current = 0;

  for (const bucket of selectedBuckets) {
    current += 1;
    onProgress?.(current, total, `Rendering ${bucket}...`);

    const { blob } = await exportBucketImage(template, rowData, bucket, getBucketCss);
    zip.file(`post_${bucket}.png`, blob);
  }

  onProgress?.(total, total, 'Packaging zip...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, 'social-posts-export.zip');
  return zipBlob;
}
