const PLAY_ICON_SVG = `<svg class="play-icon" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="14" cy="14" r="13" fill="#cc2233"/>
  <polygon points="11,9 20,14 11,19" fill="#ffffff"/>
</svg>`;

const BREAKING_NEWS_HTML = `<div class="card breaking-news-card">
  <img class="bg-image" src="{{BG_IMAGE}}" alt="" />
  <div class="top-row">
    <div class="brand-left">
      ${PLAY_ICON_SVG}
      <span class="brand-text">{{BRAND_TEXT}}</span>
    </div>
    <div class="date-block">
      <div class="date-day">{{DATE_DAY}}</div>
      <div class="date-year">{{DATE_YEAR}}</div>
    </div>
  </div>
  <div class="stamp-frame">
    <img class="stamp-image" src="{{STAMP_IMAGE}}" alt="" />
  </div>
  <div class="bottom-panel">
    <div class="news-tag">{{NEWS_TAG}}</div>
    <div class="headline-row">
      <span class="headline-word">{{HEADLINE_WORD}}</span>
      <span class="headline-badge">{{HEADLINE_BADGE}}</span>
    </div>
    <div class="body-text">{{BODY_TEXT}}</div>
    <div class="footer-cta">{{FOOTER_CTA}}</div>
  </div>
</div>`;

export const DEFAULT_STAMP_IMAGE = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="92" fill="#ffffff" stroke="#cc2233" stroke-width="6"/>
  <circle cx="100" cy="100" r="72" fill="none" stroke="#cc2233" stroke-width="3" stroke-dasharray="4 6"/>
  <text x="100" y="108" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="28" font-weight="900" fill="#cc2233" transform="rotate(-12 100 100)">SEALED</text>
  <text x="100" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#cc2233" letter-spacing="2">
    <textPath href="#stamp-ring" startOffset="25%">SEALED • SEALED • SEALED •</textPath>
  </text>
  <defs>
    <path id="stamp-ring" d="M 100 28 A 72 72 0 1 1 99.9 28" fill="none"/>
  </defs>
</svg>`)}`;

const SHARED_BASE = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.breaking-news-card {
  position: relative;
  overflow: hidden;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: #000;
}

.bg-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.top-row {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 4;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.brand-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.play-icon {
  flex-shrink: 0;
  display: block;
}

.brand-text {
  color: #ffffff;
  font-style: italic;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}

.date-block {
  text-align: right;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}

.date-day {
  font-weight: 400;
  line-height: 1.2;
}

.date-year {
  font-weight: 800;
  line-height: 1.1;
}

.stamp-frame {
  position: absolute;
  z-index: 3;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.stamp-image {
  width: 88%;
  height: 88%;
  object-fit: contain;
}

.bottom-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.5) 18%,
    rgba(0, 0, 0, 0.88) 45%,
    rgba(0, 0, 0, 0.96) 100%
  );
}

.news-tag {
  display: inline-block;
  background: #cc2233;
  color: #ffffff;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 4px;
}

.headline-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.headline-word {
  color: #ffffff;
  font-weight: 800;
  text-transform: lowercase;
  line-height: 1;
  letter-spacing: -0.02em;
}

.headline-badge {
  background: #cc2233;
  color: #ffffff;
  font-weight: 800;
  font-style: italic;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1;
}

.body-text {
  color: #ffffff;
  font-style: italic;
  font-weight: 400;
  line-height: 1.45;
}

.body-text .hl-red {
  background: #cc2233;
  color: #ffffff;
  font-style: italic;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  padding: 0 2px;
}

.footer-cta {
  display: inline-block;
  border: 2px solid #991a1a;
  color: #ffffff;
  font-weight: 600;
  text-align: center;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.25);
}

.bg-image[src=""],
.bg-image:not([src]),
.stamp-image[src=""],
.stamp-image:not([src]) {
  display: none;
}`;

const STORY_CSS = `${SHARED_BASE}

.breaking-news-card {
  width: 1080px;
  height: 1920px;
}

.top-row {
  padding: 48px 44px 0;
}

.play-icon {
  width: 28px;
  height: 28px;
}

.brand-text {
  font-size: 22px;
}

.date-day {
  font-size: 18px;
}

.date-year {
  font-size: 32px;
}

.stamp-frame {
  left: 44px;
  top: 38%;
  width: 200px;
  height: 200px;
  padding: 12px;
}

.bottom-panel {
  padding: 0 44px 72px;
  min-height: 42%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.news-tag {
  font-size: 13px;
  padding: 5px 12px;
  margin-bottom: 14px;
}

.headline-word {
  font-size: 72px;
}

.headline-badge {
  font-size: 36px;
  padding: 10px 18px;
}

.headline-row {
  margin-bottom: 18px;
}

.body-text {
  font-size: 20px;
  margin-bottom: 24px;
}

.footer-cta {
  font-size: 14px;
  padding: 8px 28px;
  align-self: center;
}`;

const PORTRAIT_CSS = `${SHARED_BASE}

.breaking-news-card {
  width: 1080px;
  height: 1350px;
}

.top-row {
  padding: 36px 40px 0;
}

.play-icon {
  width: 26px;
  height: 26px;
}

.brand-text {
  font-size: 20px;
}

.date-day {
  font-size: 16px;
}

.date-year {
  font-size: 28px;
}

.stamp-frame {
  left: 40px;
  top: 36%;
  width: 170px;
  height: 170px;
  padding: 10px;
}

.bottom-panel {
  padding: 0 40px 56px;
  min-height: 44%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.news-tag {
  font-size: 12px;
  padding: 4px 10px;
  margin-bottom: 12px;
}

.headline-word {
  font-size: 58px;
}

.headline-badge {
  font-size: 30px;
  padding: 8px 16px;
}

.headline-row {
  margin-bottom: 14px;
}

.body-text {
  font-size: 17px;
  margin-bottom: 20px;
}

.footer-cta {
  font-size: 13px;
  padding: 7px 24px;
  align-self: center;
}`;

const SQUARE_CSS = `${SHARED_BASE}

.breaking-news-card {
  width: 1080px;
  height: 1080px;
}

.top-row {
  padding: 32px 36px 0;
}

.play-icon {
  width: 24px;
  height: 24px;
}

.brand-text {
  font-size: 18px;
}

.date-day {
  font-size: 14px;
}

.date-year {
  font-size: 24px;
}

.stamp-frame {
  left: 36px;
  top: 32%;
  width: 140px;
  height: 140px;
  padding: 8px;
}

.bottom-panel {
  padding: 0 36px 44px;
  min-height: 48%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.news-tag {
  font-size: 11px;
  padding: 4px 9px;
  margin-bottom: 10px;
}

.headline-word {
  font-size: 48px;
}

.headline-badge {
  font-size: 24px;
  padding: 7px 14px;
}

.headline-row {
  margin-bottom: 12px;
}

.body-text {
  font-size: 15px;
  margin-bottom: 16px;
}

.footer-cta {
  font-size: 12px;
  padding: 6px 20px;
  align-self: center;
}`;

const LANDSCAPE_CSS = `${SHARED_BASE}

.breaking-news-card {
  width: 1200px;
  height: 628px;
}

.top-row {
  padding: 20px 32px 0;
}

.play-icon {
  width: 22px;
  height: 22px;
}

.brand-text {
  font-size: 16px;
}

.date-day {
  font-size: 13px;
}

.date-year {
  font-size: 22px;
}

.stamp-frame {
  left: 32px;
  top: 28%;
  width: 110px;
  height: 110px;
  padding: 6px;
}

.bottom-panel {
  padding: 0 32px 28px;
  min-height: 58%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.news-tag {
  font-size: 10px;
  padding: 3px 8px;
  margin-bottom: 8px;
}

.headline-word {
  font-size: 38px;
}

.headline-badge {
  font-size: 20px;
  padding: 5px 12px;
}

.headline-row {
  margin-bottom: 8px;
}

.body-text {
  font-size: 13px;
  line-height: 1.35;
  margin-bottom: 12px;
}

.footer-cta {
  font-size: 11px;
  padding: 5px 18px;
  align-self: center;
}`;

export const breakingNewsCardTemplate = {
  id: 'breaking-news-card',
  name: 'Breaking News Card',
  previewBucket: 'story',
  fields: [
    { key: 'BG_IMAGE', label: 'Background photo', type: 'image', required: true },
    { key: 'BRAND_TEXT', label: 'Top-left brand', type: 'text', required: true },
    { key: 'DATE_DAY', label: 'Date (day/month)', type: 'text', required: true },
    { key: 'DATE_YEAR', label: 'Date (year)', type: 'text', required: true },
    { key: 'STAMP_IMAGE', label: 'Seal / stamp graphic', type: 'image', required: true },
    { key: 'NEWS_TAG', label: 'News tag', type: 'text', required: true },
    { key: 'HEADLINE_WORD', label: 'Headline word', type: 'text', required: true },
    { key: 'HEADLINE_BADGE', label: 'Headline badge text', type: 'text', required: true },
    {
      key: 'BODY_TEXT',
      label: 'Body paragraph (HTML: use <span class="hl-red"> for highlights)',
      type: 'textarea',
      required: true,
    },
    { key: 'FOOTER_CTA', label: 'Footer button text', type: 'text', required: true },
  ],
  content: { html: BREAKING_NEWS_HTML },
  layouts: {
    square: { css: SQUARE_CSS, width: 1080, height: 1080 },
    portrait: { css: PORTRAIT_CSS, width: 1080, height: 1350 },
    story: { css: STORY_CSS, width: 1080, height: 1920 },
    landscape: { css: LANDSCAPE_CSS, width: 1200, height: 628 },
  },
  isAnimated: false,
};
