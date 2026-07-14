/**
 * Post caption is user-provided social copy, separate from template image fields.
 */
export const POST_CAPTION_KEY = 'CAPTION';

export const SAVE_PLATFORMS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
];

/** Workflow statuses for saved posts (id → label). */
export const POST_STATUSES = [
  { id: 'preparing', label: 'Preparing for Scheduling' },
  { id: 'ready', label: 'Ready for Scheduling' },
  { id: 'completed', label: 'Completed' },
];

export const DEFAULT_POST_STATUS = 'preparing';

/**
 * @param {string} id
 * @returns {string}
 */
export function postStatusLabel(id) {
  return POST_STATUSES.find((s) => s.id === id)?.label ?? id ?? '';
}

/**
 * @param {string[]} platforms
 * @returns {string}
 */
export function platformsLabel(platforms) {
  if (!Array.isArray(platforms) || platforms.length === 0) return 'No platforms';
  return platforms
    .map((id) => SAVE_PLATFORMS.find((p) => p.id === id)?.label ?? id)
    .join(', ');
}
