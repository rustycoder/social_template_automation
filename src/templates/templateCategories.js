/**
 * Template category taxonomy for gallery filtering.
 */

export const TEMPLATE_CATEGORIES = {
  'productivity-work': 'Productivity & Work Culture',
  'real-estate-living': 'Niche Real Estate & Living',
  'luxury-hobbies': 'Luxury Hobbies & Collectibles',
  'health-longevity': 'Specialized Health & Longevity',
  'finance-investing': 'Alternate Finance & Investing',
  'tech-saas': 'Niche Tech & B2B SaaS',
  'science-space': 'Science, Space & Discovery',
  'pop-culture-media': 'Niche Pop-Culture & Media Review',
  'creative-artisans': 'Creative Mastery & Artisans',
  'adventure-travel': 'Adventure Travel & Extreme Lifestyles',
  general: 'General',
};

/** @param {string} categoryId */
export function getCategoryLabel(categoryId) {
  return TEMPLATE_CATEGORIES[categoryId] ?? TEMPLATE_CATEGORIES.general;
}

export const CATEGORY_OPTIONS = Object.entries(TEMPLATE_CATEGORIES).map(([id, label]) => ({
  id,
  label,
}));
