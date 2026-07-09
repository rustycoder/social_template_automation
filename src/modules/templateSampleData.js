/**
 * Sample row data for template gallery thumbnails and demos.
 */
import { getTemplateFields } from './templateFields.js';

const SAMPLE_IMAGE =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';

const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%231e293b"/><text x="200" y="205" font-family="system-ui,sans-serif" font-size="18" fill="%2394a3b8" text-anchor="middle">Sample Image</text></svg>`;

const BUILTIN_SAMPLES = {
  'viral-shock-card': {
    PHOTO: SAMPLE_IMAGE,
    BADGE: 'SHOCKING',
    HEADLINE: 'Scientists discover [[new method]] to reverse ocean acidification',
    DESCRIPTION: 'Researchers say the breakthrough could restore coral reefs within a decade.',
    SOURCE: '@WorldNewsWire',
  },
  'highlight-wire-card': {
    PHOTO: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1080&q=80',
    TAG: 'BREAKING',
    HEADLINE: 'Senate passes infrastructure bill in [late-night vote]',
    SUBTEXT: 'The 68–32 vote clears the way for $1.2 trillion in nationwide spending.',
    SOURCE: 'Reuters Wire',
  },
  'banner-bold-card': {
    PHOTO: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1080&q=80',
    BANNER_TEXT: 'EXCLUSIVE',
    HEADLINE: 'The quiet return of [small-town newsrooms]',
    SOURCE: '@LocalPressDaily',
  },
  'stamp-breaking-card': {
    PHOTO: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1080&auto=format&fit=crop',
    DATELINE: '01 July 2026',
    STAMP_TEXT: 'SEALED',
    HEADLINE_BIG: 'FUEL',
    HEADLINE_ACCENT: 'PUMPS',
    DESCRIPTION: 'Government seals several fuel pumps accused of overcharging customers.',
    SOURCE: 'FollowNepalTimes',
  },
};

/**
 * @param {object} template
 * @returns {Record<string, string>}
 */
export function getSampleRowForTemplate(template) {
  const id = template.id;
  if (id && BUILTIN_SAMPLES[id]) {
    return { ...BUILTIN_SAMPLES[id] };
  }

  const row = {};
  for (const field of getTemplateFields(template)) {
    if (field.type === 'image') {
      row[field.key] = PLACEHOLDER_IMAGE;
    } else if (field.type === 'textarea') {
      row[field.key] = `Sample ${field.label}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;
    } else {
      row[field.key] = `Sample ${field.label}`;
    }
  }
  return row;
}
