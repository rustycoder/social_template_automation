/**
 * Template category taxonomy for gallery filtering.
 */

export const TEMPLATE_CATEGORIES = {
  productivity: 'Productivity',
  'work-culture': 'Work Culture',
  'real-estate': 'Real Estate',
  living: 'Living',
  'luxury-hobbies': 'Luxury Hobbies',
  collectibles: 'Collectibles',
  health: 'Health',
  longevity: 'Longevity',
  finance: 'Finance',
  investing: 'Investing',
  tech: 'Tech',
  'b2b-saas': 'B2B SaaS',
  science: 'Science',
  space: 'Space',
  'pop-culture': 'Pop Culture',
  media: 'Media',
  creative: 'Creative',
  artisans: 'Artisans',
  'adventure-travel': 'Adventure Travel',
  'extreme-lifestyles': 'Extreme Lifestyles',
  general: 'General',
};

/** @param {string} categoryId */
export function getCategoryLabel(categoryId) {
  return TEMPLATE_CATEGORIES[categoryId] ?? TEMPLATE_CATEGORIES.general;
}

export const CATEGORY_OPTIONS = Object.entries(TEMPLATE_CATEGORIES)
  .map(([id, label]) => ({ id, label }))
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
