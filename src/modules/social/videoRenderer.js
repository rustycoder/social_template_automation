/**
 * Client-side social post video export via per-frame html2canvas + MediaRecorder.
 *
 * PERFORMANCE NOTE: Each frame runs a full html2canvas capture. At 15 fps × 4 s that is ~60
 * captures per video — typically 30–90 s export time on a laptop. Acceptable for single-post
 * preview exports; bulk video (Step 9) should consider lower fps (12) or fewer simultaneous jobs.
 */
import {
  setupRenderHost,
  waitForImages,
  captureRenderRootToCanvas,
} from './socialRenderHost.js';
import { applyAnimationFrame } from './socialAnimations.js';

function getSupportedMimeType() {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || 'video/webm';
}

/**
 * @param {string} templateHtml
 * @param {string} layoutCss
 * @param {Record<string, string>} rowData
 * @param {number} width
 * @param {number} height
 * @param {{ duration: number, fps: number, steps: object[] }} animation
 * @param {(current: number, total: number) => void} [onProgress]
 */
export async function renderPostToVideo(
  templateHtml,
  layoutCss,
  rowData,
  width,
  height,
  animation,
  onProgress
) {
  const { renderRoot, captureEl, cleanup } = setupRenderHost(templateHtml, layoutCss, rowData, width, height);

  const duration = animation.duration ?? 4000;
  const fps = animation.fps ?? 15;
  const totalFrames = Math.max(1, Math.round((duration / 1000) * fps));
  const frameDelayMs = 1000 / fps;
  const mimeType = getSupportedMimeType();

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d');

  try {
    await waitForImages(renderRoot);
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const stream = outputCanvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];

    const recordingDone = new Promise((resolve) => {
      recorder.onstop = () => resolve();
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunks.push(event.data);
      };
    });

    recorder.start(100);

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const progress = totalFrames === 1 ? 1 : frameIndex / (totalFrames - 1);
      applyAnimationFrame(renderRoot, animation.steps, progress);

      const frameCanvas = await captureRenderRootToCanvas(captureEl, width, height);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(frameCanvas, 0, 0, width, height);

      onProgress?.(frameIndex + 1, totalFrames);
      await new Promise((resolve) => setTimeout(resolve, frameDelayMs));
    }

    recorder.stop();
    await recordingDone;

    if (chunks.length === 0) {
      throw new Error('Video recording failed (no frames captured)');
    }

    return new Blob(chunks, { type: mimeType });
  } finally {
    cleanup();
  }
}

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
 * @param {object} template
 * @param {Record<string, string>} rowData
 * @param {string} bucket
 * @param {(current: number, total: number, message?: string) => void} [onProgress]
 * @param {(bucket: string) => string} [getBucketCss]
 */
export async function exportSingleVideo(template, rowData, bucket, onProgress, getBucketCss) {
  const layout = template.layouts?.[bucket];
  if (!layout) {
    throw new Error(`Template has no layout defined for bucket "${bucket}"`);
  }
  if (!layout.animation) {
    throw new Error('Selected layout has no animation configured');
  }

  const width = layout.width ?? 1080;
  const height = layout.height ?? 1080;
  const templateHtml = template.content?.html ?? '';
  const layoutCss = getBucketCss?.(bucket) ?? layout.css ?? '';

  onProgress?.(0, 1, `Recording video (${layout.animation.fps} fps)...`);

  const blob = await renderPostToVideo(
    templateHtml,
    layoutCss,
    rowData,
    width,
    height,
    layout.animation,
    (current, total) => {
      onProgress?.(current, total, `Capturing frame ${current} of ${total}...`);
    }
  );

  const filename = `post_${bucket}.webm`;
  downloadBlob(blob, filename);
  onProgress?.(1, 1, 'Video export complete');
  return { filename, blob, bucket, width, height };
}
