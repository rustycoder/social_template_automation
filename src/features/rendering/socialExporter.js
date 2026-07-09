/**
 * Social post static image export via Puppeteer.
 */
import JSZip from 'jszip';
import { renderPostToPng } from './puppeteerExporter.js';

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

  const blob = await renderPostToPng(templateHtml, layoutCss, rowData, width, height);
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
      onProgress?.(current, total, `Rendering ${rowBase} · ${bucket}...`);

      const layout = getLayoutForBucket(template, bucket);
      const width = layout.width ?? 1080;
      const height = layout.height ?? 1080;
      const templateHtml = template.content?.html ?? '';
      const layoutCss = getBucketCss?.(bucket) ?? layout.css ?? '';

      const blob = await renderPostToPng(templateHtml, layoutCss, rowData, width, height);
      const filename = `${rowBase}_${bucket}.png`;

      zip.file(filename, blob);
      current += 1;
      onProgress?.(current, total, `Rendered ${rowBase} · ${bucket}`);
    }
  }

  onProgress?.(total, total, 'Packaging zip...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, 'social-posts-export.zip');
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
    onProgress?.(current, total, `Rendering ${bucket}...`);

    const layout = getLayoutForBucket(template, bucket);
    const width = layout.width ?? 1080;
    const height = layout.height ?? 1080;
    const templateHtml = template.content?.html ?? '';
    const layoutCss = getBucketCss?.(bucket) ?? layout.css ?? '';

    const blob = await renderPostToPng(templateHtml, layoutCss, rowData, width, height);
    zip.file(`post_${bucket}.png`, blob);
    current += 1;
    onProgress?.(current, total, `Rendered ${bucket}`);
  }

  onProgress?.(total, total, 'Packaging zip...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, 'social-posts-export.zip');
  return zipBlob;
}
