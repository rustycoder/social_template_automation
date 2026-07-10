/**
 * Unified HTML Template Loader
 *
 * Loads standalone HTML template files, extracts their CSS/body/fonts,
 * and produces template objects that conform to the existing pipeline interface.
 *
 * Dimension adaptation swaps width/height on html,body and .card selectors per layout bucket.
 */

import viralHtml from './template-c-viral.html?raw';
import highlightHtml from './template-d-highlight.html?raw';
import bannerHtml from './template-e-banner.html?raw';
import stampHtml from './template-f-stamp.html?raw';
import newsUpdateHtml from './template-g-news-update.html?raw';
import entertainmentScoopHtml from './template-h-entertainment-scoop.html?raw';
import infographicBreakdownHtml from './template-i-infographic-breakdown.html?raw';
import quoteOfTheDayHtml from './template-j-quote-of-the-day.html?raw';
import dailyTipsHtml from './template-k-daily-tips.html?raw';
import factOfTheDayHtml from './template-l-fact-of-the-day.html?raw';
import comparisonChallengeHtml from './template-m-comparison-challenge.html?raw';
import celebrityProfileHtml from './template-n-celebrity-profile.html?raw';
import movieRatingHtml from './template-o-movie-rating.html?raw';
import natureWalkHtml from './template-p-nature-walk.html?raw';
import spaceFactHtml from './template-q-space-fact.html?raw';
import generalInfoHtml from './template-r-general-info.html?raw';

const LAYOUTS = {
  square:    { width: 1080, height: 1080 },
  portrait:  { width: 1080, height: 1350 },
  story:     { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 628 },
};

/**
 * Extract Google Fonts <link> URLs and convert them to @import statements.
 */
function extractFontImports(rawHtml) {
  const imports = [];
  const linkRe = /<link[^>]+href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"[^>]*>/g;
  let m;
  while ((m = linkRe.exec(rawHtml)) !== null) {
    imports.push(`@import url('${m[1]}');`);
  }
  return imports;
}

/**
 * Extract all CSS from <style> tags.
 */
function extractCss(rawHtml) {
  const parts = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRe.exec(rawHtml)) !== null) {
    parts.push(m[1].trim());
  }
  return parts.join('\n');
}

/**
 * Extract body innerHTML (everything between <body> and </body>).
 */
function extractBody(rawHtml) {
  const bodyRe = /<body[^>]*>([\s\S]*?)<\/body>/i;
  const m = bodyRe.exec(rawHtml);
  return m ? m[1].trim() : '';
}

/**
 * Adapt base CSS to a target layout by swapping container dimensions.
 */
function adaptCssToLayout(baseCss, fontImports, width, height) {
  let css = baseCss
    .replace(/(html,\s*body\s*\{[^}]*width:)\s*\d+px/g, `$1${width}px`)
    .replace(/(html,\s*body\s*\{[^}]*height:)\s*\d+px/g, `$1${height}px`)
    .replace(/(\.card\s*\{[^}]*width:)\s*\d+px/g, `$1${width}px`)
    .replace(/(\.card\s*\{[^}]*height:)\s*\d+px/g, `$1${height}px`);

  if (fontImports.length) {
    css = fontImports.join('\n') + '\n' + css;
  }
  return css;
}

/**
 * Parse a raw HTML template and produce a template object matching the
 * existing pipeline interface: { id, name, fields, content, layouts, ... }
 */
function parseHtmlTemplate(rawHtml, { id, name, previewBucket, fields }) {
  const fontImports = extractFontImports(rawHtml);
  const baseCss = extractCss(rawHtml);
  const bodyHtml = extractBody(rawHtml);

  const layouts = {};
  for (const [bucket, { width, height }] of Object.entries(LAYOUTS)) {
    layouts[bucket] = {
      css: adaptCssToLayout(baseCss, fontImports, width, height),
      width,
      height,
    };
  }

  return {
    id,
    name,
    previewBucket: previewBucket || 'square',
    fields,
    content: { html: bodyHtml },
    layouts,
    isAnimated: false,
    _htmlSource: true,
  };
}

// ── Template definitions ────────────────────────────────────────────────────

export const viralShockCardTemplate = parseHtmlTemplate(viralHtml, {
  id: 'viral-shock-card',
  name: 'Viral / Shock',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',       label: 'Photo',       type: 'image',    required: true },
    { key: 'BADGE',       label: 'Badge',        type: 'text',     required: true },
    { key: 'HEADLINE',    label: 'Headline',     type: 'textarea', required: true },
    { key: 'DESCRIPTION', label: 'Description',  type: 'textarea', required: false },
    { key: 'SOURCE',      label: 'Source',        type: 'text',     required: false },
  ],
});

export const highlightWireCardTemplate = parseHtmlTemplate(highlightHtml, {
  id: 'highlight-wire-card',
  name: 'Highlight / Wire',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',    label: 'Photo',    type: 'image',    required: true },
    { key: 'TAG',      label: 'Tag',      type: 'text',     required: true },
    { key: 'HEADLINE', label: 'Headline', type: 'textarea', required: true },
    { key: 'SUBTEXT',  label: 'Subtext',  type: 'textarea', required: false },
    { key: 'SOURCE',   label: 'Source',   type: 'text',     required: false },
  ],
});

export const bannerBoldCardTemplate = parseHtmlTemplate(bannerHtml, {
  id: 'banner-bold-card',
  name: 'Banner / Bold',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',       label: 'Photo',       type: 'image',    required: true },
    { key: 'BANNER_TEXT', label: 'Banner Text',  type: 'text',     required: true },
    { key: 'HEADLINE',    label: 'Headline',     type: 'textarea', required: true },
    { key: 'SOURCE',      label: 'Source',       type: 'text',     required: false },
  ],
});

export const stampBreakingCardTemplate = parseHtmlTemplate(stampHtml, {
  id: 'stamp-breaking-card',
  name: 'Stamp / Breaking',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',          label: 'Photo',           type: 'image',    required: true },
    { key: 'DATELINE',       label: 'Dateline',        type: 'text',     required: false },
    { key: 'STAMP_TEXT',     label: 'Stamp Text',      type: 'text',     required: true },
    { key: 'HEADLINE_BIG',   label: 'Headline Big',    type: 'text',     required: true },
    { key: 'HEADLINE_ACCENT', label: 'Headline Accent', type: 'text',    required: false },
    { key: 'DESCRIPTION',    label: 'Description',     type: 'textarea', required: false },
    { key: 'SOURCE',         label: 'Source',           type: 'text',     required: false },
  ],
});

export const newsUpdateCardTemplate = parseHtmlTemplate(newsUpdateHtml, {
  id: 'news-update-card',
  name: 'News Update',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',    label: 'Background Photo', type: 'image',    required: true },
    { key: 'HEADLINE', label: 'Headline',         type: 'textarea', required: true },
    { key: 'SUBTITLE', label: 'Subtitle',         type: 'textarea', required: false },
    { key: 'LOGO',     label: 'Logo',             type: 'image',    required: false },
  ],
});

export const entertainmentScoopCardTemplate = parseHtmlTemplate(entertainmentScoopHtml, {
  id: 'entertainment-scoop-card',
  name: 'Entertainment Scoop',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO_LEFT',  label: 'Left Photo',   type: 'image',    required: true },
    { key: 'PHOTO_RIGHT', label: 'Right Photo',  type: 'image',    required: true },
    { key: 'TOP_TEXT',    label: 'Top Text',     type: 'textarea', required: true },
    { key: 'BOTTOM_TEXT', label: 'Bottom Text',  type: 'textarea', required: false },
    { key: 'LOGO',        label: 'Logo',         type: 'image',    required: false },
  ],
});

export const infographicBreakdownCardTemplate = parseHtmlTemplate(infographicBreakdownHtml, {
  id: 'infographic-breakdown-card',
  name: 'Infographic Breakdown',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',            label: 'Background Photo', type: 'image',    required: true },
    { key: 'TITLE',            label: 'Title',            type: 'text',     required: true },
    { key: 'SECTION1_ICON',    label: 'Section 1 Icon',   type: 'text',     required: true },
    { key: 'SECTION1_HEADING', label: 'Section 1 Heading', type: 'text',    required: true },
    { key: 'SECTION1_DESC',    label: 'Section 1 Description', type: 'textarea', required: false },
    { key: 'SECTION2_ICON',    label: 'Section 2 Icon',   type: 'text',     required: true },
    { key: 'SECTION2_HEADING', label: 'Section 2 Heading', type: 'text',    required: true },
    { key: 'SECTION2_DESC',    label: 'Section 2 Description', type: 'textarea', required: false },
    { key: 'SECTION3_ICON',    label: 'Section 3 Icon',   type: 'text',     required: true },
    { key: 'SECTION3_HEADING', label: 'Section 3 Heading', type: 'text',    required: true },
    { key: 'SECTION3_DESC',    label: 'Section 3 Description', type: 'textarea', required: false },
    { key: 'LOGO',             label: 'Logo',             type: 'image',    required: false },
  ],
});

export const quoteOfTheDayCardTemplate = parseHtmlTemplate(quoteOfTheDayHtml, {
  id: 'quote-of-the-day-card',
  name: 'Quote of the Day',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',  label: 'Background Photo', type: 'image',    required: true },
    { key: 'QUOTE',  label: 'Quote',            type: 'textarea', required: true },
    { key: 'AUTHOR', label: 'Author',           type: 'text',     required: false },
    { key: 'LOGO',   label: 'Logo',             type: 'image',    required: false },
  ],
});

export const dailyTipsCardTemplate = parseHtmlTemplate(dailyTipsHtml, {
  id: 'daily-tips-card',
  name: 'Daily Tips',
  previewBucket: 'square',
  fields: [
    { key: 'HEADER',     label: 'Header',        type: 'text',     required: true },
    { key: 'PHOTO_1',    label: 'Tip 1 Photo',   type: 'image',    required: true },
    { key: 'TIP1_ICON',  label: 'Tip 1 Icon',    type: 'text',     required: false },
    { key: 'TIP1_TITLE', label: 'Tip 1 Title',   type: 'text',     required: true },
    { key: 'TIP1_DESC',  label: 'Tip 1 Description', type: 'textarea', required: false },
    { key: 'PHOTO_2',    label: 'Tip 2 Photo',   type: 'image',    required: true },
    { key: 'TIP2_ICON',  label: 'Tip 2 Icon',    type: 'text',     required: false },
    { key: 'TIP2_TITLE', label: 'Tip 2 Title',   type: 'text',     required: true },
    { key: 'TIP2_DESC',  label: 'Tip 2 Description', type: 'textarea', required: false },
    { key: 'PHOTO_3',    label: 'Tip 3 Photo',   type: 'image',    required: true },
    { key: 'TIP3_ICON',  label: 'Tip 3 Icon',    type: 'text',     required: false },
    { key: 'TIP3_TITLE', label: 'Tip 3 Title',   type: 'text',     required: true },
    { key: 'TIP3_DESC',  label: 'Tip 3 Description', type: 'textarea', required: false },
    { key: 'PHOTO_4',    label: 'Tip 4 Photo',   type: 'image',    required: true },
    { key: 'TIP4_ICON',  label: 'Tip 4 Icon',    type: 'text',     required: false },
    { key: 'TIP4_TITLE', label: 'Tip 4 Title',   type: 'text',     required: true },
    { key: 'TIP4_DESC',  label: 'Tip 4 Description', type: 'textarea', required: false },
    { key: 'LOGO',       label: 'Logo',          type: 'image',    required: false },
  ],
});

export const factOfTheDayCardTemplate = parseHtmlTemplate(factOfTheDayHtml, {
  id: 'fact-of-the-day-card',
  name: 'Fact of the Day',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',   label: 'Background Photo', type: 'image',    required: true },
    { key: 'FACT',    label: 'Fact',             type: 'textarea', required: true },
    { key: 'CAPTION', label: 'Caption',          type: 'textarea', required: false },
    { key: 'LOGO',    label: 'Logo',             type: 'image',    required: false },
  ],
});

export const comparisonChallengeCardTemplate = parseHtmlTemplate(comparisonChallengeHtml, {
  id: 'comparison-challenge-card',
  name: 'Comparison Challenge',
  previewBucket: 'square',
  fields: [
    { key: 'TITLE',          label: 'Title',           type: 'text',     required: true },
    { key: 'PHOTO_LEFT',     label: 'Left Photo',      type: 'image',    required: true },
    { key: 'LEFT_TITLE',     label: 'Left Title',      type: 'text',     required: true },
    { key: 'LEFT_FEATURES',  label: 'Left Features',   type: 'textarea', required: false },
    { key: 'LEFT_RATING',    label: 'Left Rating',     type: 'text',     required: false },
    { key: 'PHOTO_RIGHT',    label: 'Right Photo',     type: 'image',    required: true },
    { key: 'RIGHT_TITLE',    label: 'Right Title',     type: 'text',     required: true },
    { key: 'RIGHT_FEATURES', label: 'Right Features',  type: 'textarea', required: false },
    { key: 'RIGHT_RATING',   label: 'Right Rating',    type: 'text',     required: false },
    { key: 'LOGO',           label: 'Logo',            type: 'image',    required: false },
  ],
});

export const celebrityProfileCardTemplate = parseHtmlTemplate(celebrityProfileHtml, {
  id: 'celebrity-profile-card',
  name: 'Celebrity Profile',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',      label: 'Photo',      type: 'image',    required: true },
    { key: 'NAME',       label: 'Name',       type: 'text',     required: true },
    { key: 'PROFESSION', label: 'Profession', type: 'text',     required: true },
    { key: 'BIO',        label: 'Biography',  type: 'textarea', required: false },
    { key: 'FACTS',      label: 'Facts',      type: 'textarea', required: false },
    { key: 'QUOTE',      label: 'Quote',      type: 'textarea', required: false },
    { key: 'LOGO',       label: 'Logo',       type: 'image',    required: false },
  ],
});

export const movieRatingCardTemplate = parseHtmlTemplate(movieRatingHtml, {
  id: 'movie-rating-card',
  name: 'Movie Rating',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',   label: 'Scene Photo', type: 'image',    required: true },
    { key: 'TITLE',   label: 'Movie Title', type: 'text',     required: true },
    { key: 'GENRE',   label: 'Genre',       type: 'text',     required: true },
    { key: 'RATING',  label: 'Rating',      type: 'text',     required: true },
    { key: 'SUMMARY', label: 'Summary',     type: 'textarea', required: false },
    { key: 'LOGO',    label: 'Logo',        type: 'image',    required: false },
  ],
});

export const natureWalkCardTemplate = parseHtmlTemplate(natureWalkHtml, {
  id: 'nature-walk-card',
  name: 'Nature Walk Findings',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',         label: 'Scene Photo',    type: 'image',    required: true },
    { key: 'TITLE',         label: 'Title',          type: 'text',     required: true },
    { key: 'WALK_DESC',     label: 'Walk Description', type: 'textarea', required: false },
    { key: 'FINDING1_ICON', label: 'Finding 1 Icon', type: 'text',     required: false },
    { key: 'FINDING1',      label: 'Finding 1',      type: 'text',     required: true },
    { key: 'FINDING2_ICON', label: 'Finding 2 Icon', type: 'text',     required: false },
    { key: 'FINDING2',      label: 'Finding 2',      type: 'text',     required: true },
    { key: 'FINDING3_ICON', label: 'Finding 3 Icon', type: 'text',     required: false },
    { key: 'FINDING3',      label: 'Finding 3',      type: 'text',     required: true },
    { key: 'LOGO',          label: 'Logo',           type: 'image',    required: false },
  ],
});

export const spaceFactCardTemplate = parseHtmlTemplate(spaceFactHtml, {
  id: 'space-fact-card',
  name: 'Space Fact of the Week',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',       label: 'Space Photo',  type: 'image',    required: true },
    { key: 'FACT',        label: 'Fact',         type: 'textarea', required: true },
    { key: 'EXPLANATION', label: 'Explanation',  type: 'textarea', required: false },
    { key: 'MORE_INFO',   label: 'More Info',    type: 'text',     required: false },
    { key: 'LOGO',        label: 'Logo',         type: 'image',    required: false },
  ],
});

export const generalInfoCardTemplate = parseHtmlTemplate(generalInfoHtml, {
  id: 'general-info-card',
  name: 'General Information',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',       label: 'Background Photo', type: 'image',    required: true },
    { key: 'TITLE',       label: 'Title',            type: 'textarea', required: true },
    { key: 'SUBTITLE',    label: 'Subtitle',         type: 'text',     required: false },
    { key: 'DESCRIPTION', label: 'Description',      type: 'textarea', required: false },
    { key: 'LOGO',        label: 'Logo',             type: 'image',    required: false },
  ],
});

export const DEFAULT_TEMPLATE_ID = 'viral-shock-card';

export const HTML_TEMPLATES = {
  'viral-shock-card': viralShockCardTemplate,
  'highlight-wire-card': highlightWireCardTemplate,
  'banner-bold-card': bannerBoldCardTemplate,
  'stamp-breaking-card': stampBreakingCardTemplate,
  'news-update-card': newsUpdateCardTemplate,
  'entertainment-scoop-card': entertainmentScoopCardTemplate,
  'infographic-breakdown-card': infographicBreakdownCardTemplate,
  'quote-of-the-day-card': quoteOfTheDayCardTemplate,
  'daily-tips-card': dailyTipsCardTemplate,
  'fact-of-the-day-card': factOfTheDayCardTemplate,
  'comparison-challenge-card': comparisonChallengeCardTemplate,
  'celebrity-profile-card': celebrityProfileCardTemplate,
  'movie-rating-card': movieRatingCardTemplate,
  'nature-walk-card': natureWalkCardTemplate,
  'space-fact-card': spaceFactCardTemplate,
  'general-info-card': generalInfoCardTemplate,
};
