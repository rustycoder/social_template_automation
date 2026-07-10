/**
 * @file features/domain/templateSampleData.js
 * @description Sample row values for gallery thumbnails and empty-state previews.
 * @dependencies features/domain/templateFields.js, features/domain/builtinTemplateSamples.js
 */

import { getTemplateFields } from './templateFields.js';
import { BUILTIN_SAMPLES } from './builtinTemplateSamples.js';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1080&q=80';

/**
 * @param {object} template
 * @returns {Record<string, string>}
 */
export function getSampleRowForTemplate(template) {
  const id = template.id;
  const fields = getTemplateFields(template);
  const base = id && BUILTIN_SAMPLES[id] ? { ...BUILTIN_SAMPLES[id] } : {};

  for (const field of fields) {
    if (base[field.key] !== undefined) continue;

    if (field.type === 'image') {
      if (field.key === 'LOGO') {
        base[field.key] = '';
      } else if (field.key.startsWith('PHOTO')) {
        base[field.key] = DEFAULT_IMAGE;
      } else {
        base[field.key] = DEFAULT_IMAGE;
      }
      continue;
    }

    if (field.key.includes('ICON')) {
      base[field.key] = '✦';
      continue;
    }

    if (field.key.includes('RATING') || field.key.includes('SCORE')) {
      base[field.key] = '4.8';
      continue;
    }

    base[field.key] = `Add your ${field.label.toLowerCase()} here.`;
  }

  return base;
}
