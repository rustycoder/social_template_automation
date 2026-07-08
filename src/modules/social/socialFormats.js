/**
 * Social media format definitions — aspect-ratio buckets and platform presets.
 * Pure data module; no side effects or external dependencies.
 */

export const FORMAT_BUCKETS = {
  square: { ratio: 1, label: 'Square' },
  portrait: { ratio: 4 / 5, label: 'Portrait' },
  story: { ratio: 9 / 16, label: 'Story/Reel' },
  landscape: { ratio: 1.91, label: 'Landscape' },
};

export const PLATFORM_PRESETS = [
  {
    id: 'ig-square',
    platform: 'Instagram',
    bucket: 'square',
    width: 1080,
    height: 1080,
    media: ['image', 'video'],
  },
  {
    id: 'ig-portrait',
    platform: 'Instagram',
    bucket: 'portrait',
    width: 1080,
    height: 1350,
    media: ['image'],
  },
  {
    id: 'ig-story',
    platform: 'Instagram',
    bucket: 'story',
    width: 1080,
    height: 1920,
    media: ['image', 'video'],
  },
  {
    id: 'tiktok',
    platform: 'TikTok',
    bucket: 'story',
    width: 1080,
    height: 1920,
    media: ['image', 'video'],
  },
  {
    id: 'fb-feed',
    platform: 'Facebook',
    bucket: 'landscape',
    width: 1200,
    height: 628,
    media: ['image'],
  },
  {
    id: 'fb-story',
    platform: 'Facebook',
    bucket: 'story',
    width: 1080,
    height: 1920,
    media: ['image', 'video'],
  },
  {
    id: 'linkedin-post',
    platform: 'LinkedIn',
    bucket: 'square',
    width: 1200,
    height: 1200,
    media: ['image'],
  },
  {
    id: 'linkedin-land',
    platform: 'LinkedIn',
    bucket: 'landscape',
    width: 1200,
    height: 627,
    media: ['image'],
  },
  {
    id: 'x-post',
    platform: 'X',
    bucket: 'landscape',
    width: 1200,
    height: 675,
    media: ['image'],
  },
];

/**
 * @param {string} bucket
 * @returns {typeof PLATFORM_PRESETS[number][]}
 */
export function getPresetsByBucket(bucket) {
  return PLATFORM_PRESETS.filter((preset) => preset.bucket === bucket);
}

/**
 * @param {string} id
 * @returns {typeof PLATFORM_PRESETS[number] | null}
 */
export function getPreset(id) {
  return PLATFORM_PRESETS.find((preset) => preset.id === id) ?? null;
}

/**
 * @param {'image' | 'video'} mediaType
 * @returns {typeof PLATFORM_PRESETS[number][]}
 */
export function getPresetsSupportingMedia(mediaType) {
  return PLATFORM_PRESETS.filter((preset) => preset.media.includes(mediaType));
}
