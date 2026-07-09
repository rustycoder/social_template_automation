const SPORTS_NEWS_HTML = `<div class="card sports-news-card">
  <img class="card-bg" src="{{IMAGE}}" alt="" />
  <div class="date-badge">{{DATE}}</div>
  <div class="bottom-overlay">
    <div class="meta-line">{{META_LINE}}</div>
    <div class="meta-divider"></div>
    <div class="headline">{{HEADLINE}}</div>
    {{#if SWIPE_LABEL}}
    <div class="swipe-indicator">
      <span class="swipe-arrow">&#8592;</span>
      <span class="swipe-line" aria-hidden="true"></span>
      <span class="swipe-label">{{SWIPE_LABEL}}</span>
    </div>
    {{/if}}
  </div>
</div>`;

const SHARED_BASE = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.sports-news-card {
  position: relative;
  overflow: hidden;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: #1a3a2a;
}

.card-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.date-badge {
  position: absolute;
  z-index: 3;
  background: #e8a33d;
  color: #1a1817;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: none;
  line-height: 1.1;
  border-radius: 6px;
}

.bottom-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.55) 28%,
    rgba(0, 0, 0, 0.92) 60%,
    rgba(0, 0, 0, 0.97) 100%
  );
}

.meta-line {
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.meta-divider {
  height: 2px;
  width: 100%;
  background: linear-gradient(
    to right,
    #cc2233 0%,
    #cc2233 33%,
    #ffffff 33%,
    #ffffff 100%
  );
}

.headline {
  color: #fff;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.swipe-indicator {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.swipe-line {
  height: 2px;
  background: #fff;
  opacity: 0.9;
}

.swipe-arrow,
.swipe-label {
  color: #fff;
  font-weight: 700;
}

.swipe-label {
  text-transform: capitalize;
}

.card-bg[src=""],
.card-bg:not([src]) {
  display: none;
}`;

const PORTRAIT_CSS = `${SHARED_BASE}

.sports-news-card {
  width: 1080px;
  height: 1350px;
}

.card-bg {
  object-position: center 30%;
}

.date-badge {
  top: 54px;
  left: 43px;
  font-size: 22px;
  padding: 10px 18px;
}

.bottom-overlay {
  padding: 0 54px 94px;
}

.meta-line {
  font-size: 12px;
  margin-bottom: 9px;
}

.meta-divider {
  margin-bottom: 14px;
}

.headline {
  font-size: 30px;
}

.swipe-indicator {
  margin-top: 22px;
}

.swipe-line {
  width: 72px;
}

.swipe-arrow {
  font-size: 16px;
}

.swipe-label {
  font-size: 13px;
}`;

const STORY_CSS = `${SHARED_BASE}

.sports-news-card {
  width: 1080px;
  height: 1920px;
}

.card-bg {
  object-position: center 28%;
}

.date-badge {
  top: 77px;
  left: 43px;
  font-size: 22px;
  padding: 10px 18px;
}

.bottom-overlay {
  padding: 0 54px 130px;
}

.meta-line {
  font-size: 12px;
  margin-bottom: 9px;
}

.meta-divider {
  margin-bottom: 14px;
}

.headline {
  font-size: 32px;
}

.swipe-indicator {
  margin-top: 28px;
}

.swipe-line {
  width: 80px;
}

.swipe-arrow {
  font-size: 16px;
}

.swipe-label {
  font-size: 13px;
}`;

const SQUARE_CSS = `${SHARED_BASE}

.sports-news-card {
  width: 1080px;
  height: 1080px;
}

.card-bg {
  object-position: center 35%;
}

.date-badge {
  top: 43px;
  left: 43px;
  font-size: 20px;
  padding: 9px 16px;
}

.bottom-overlay {
  padding: 0 43px 54px;
  min-height: 42%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.meta-line {
  font-size: 11px;
  margin-bottom: 8px;
}

.meta-divider {
  margin-bottom: 12px;
}

.headline {
  font-size: 26px;
  line-height: 1.2;
}

.swipe-indicator {
  margin-top: 16px;
}

.swipe-line {
  width: 56px;
}

.swipe-arrow {
  font-size: 14px;
}

.swipe-label {
  font-size: 12px;
}`;

const LANDSCAPE_CSS = `${SHARED_BASE}

.sports-news-card {
  width: 1200px;
  height: 628px;
}

.card-bg {
  object-position: center 40%;
}

.date-badge {
  top: 25px;
  left: 30px;
  font-size: 16px;
  padding: 7px 14px;
}

.bottom-overlay {
  padding: 0 48px 36px;
  min-height: 55%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.meta-line {
  font-size: 10px;
  margin-bottom: 6px;
}

.meta-divider {
  margin-bottom: 10px;
}

.headline {
  font-size: 22px;
  line-height: 1.2;
}

.swipe-indicator {
  margin-top: 12px;
}

.swipe-line {
  width: 48px;
}

.swipe-arrow {
  font-size: 13px;
}

.swipe-label {
  font-size: 11px;
}`;

export const sportsNewsCardTemplate = {
  id: 'sports-news-card',
  name: 'Sports News Card',
  previewBucket: 'portrait',
  fields: [
    { key: 'IMAGE', label: 'Photo', type: 'image', required: true },
    { key: 'DATE', label: 'Date badge', type: 'text', required: true },
    { key: 'META_LINE', label: 'Source / meta line', type: 'text', required: true },
    { key: 'HEADLINE', label: 'Headline', type: 'textarea', required: true },
    { key: 'SWIPE_LABEL', label: 'Swipe label', type: 'text', required: false },
  ],
  content: { html: SPORTS_NEWS_HTML },
  layouts: {
    square: { css: SQUARE_CSS, width: 1080, height: 1080 },
    portrait: { css: PORTRAIT_CSS, width: 1080, height: 1350 },
    story: { css: STORY_CSS, width: 1080, height: 1920 },
    landscape: { css: LANDSCAPE_CSS, width: 1200, height: 628 },
  },
  isAnimated: false,
};
