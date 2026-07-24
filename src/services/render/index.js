/**
 * Server-side template → PNG rendering.
 */

import { getTemplateById } from '../templateService.js';
import { materializeFieldDataImages } from '../postService.js';
import { composeRenderDocument } from './compose.js';
import { screenshotHtml, closeBrowser } from './screenshot.js';
import { LAYOUTS } from './layouts.js';

export { closeBrowser, LAYOUTS };

/**
 * Load template, fill placeholders, screenshot to PNG.
 *
 * @param {object} options
 * @param {string} options.templateId
 * @param {Record<string, unknown>} [options.fieldData]
 * @param {string} [options.formatBucket]
 * @param {number|string} [options.userId] When set, data-URL images in fieldData are written under uploads.
 * @param {boolean} [options.materializeImages=true]
 * @returns {Promise<{ buffer: Buffer, formatBucket: string, width: number, height: number, fieldData: object }>}
 */
export async function renderTemplateToPng({
  templateId,
  fieldData = {},
  formatBucket = 'square',
  userId = null,
  materializeImages = true,
}) {
  if (!templateId) {
    const error = new Error('template_id is required');
    error.status = 400;
    throw error;
  }

  const template = await getTemplateById(templateId, { includeHtml: true });
  if (!template || !template.htmlSource) {
    const error = new Error('Template not found');
    error.status = 404;
    throw error;
  }

  let storedFieldData =
    fieldData && typeof fieldData === 'object' && !Array.isArray(fieldData) ? { ...fieldData } : {};

  if (materializeImages && userId != null) {
    storedFieldData = materializeFieldDataImages(userId, storedFieldData);
  }

  const { html, width, height, formatBucket: bucket } = composeRenderDocument(
    template.htmlSource,
    storedFieldData,
    formatBucket
  );

  const buffer = await screenshotHtml(html, width, height);

  return {
    buffer,
    formatBucket: bucket,
    width,
    height,
    fieldData: storedFieldData,
  };
}
