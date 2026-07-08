const EDITORIAL_HTML = `<div class="card editorial-feature-card">
  <img class="t-photo" src="{{PHOTO}}" alt="" />
  <div class="fold"></div>
  <div class="content">
    <span class="t-tag">{{TAG}}</span>
    <div class="t-headline">{{HEADLINE}}</div>
    <div class="t-subtext">{{SUBTEXT}}</div>
  </div>
  <div class="byline"><div class="rule"></div>By {{AUTHOR}} &middot; {{READ_TIME}}</div>
</div>`;

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap');`;

const SHARED_BASE = `${FONT_IMPORT}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.editorial-feature-card {
  position: relative;
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
  background: #ede7da;
}

.t-photo {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  object-fit: cover;
}

.fold {
  position: absolute;
  left: 0;
  right: 0;
  height: 16px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.14), rgba(0, 0, 0, 0));
  z-index: 2;
}

.content {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
}

.t-tag {
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.1em;
  font-weight: 600;
  color: #6e1e2a;
  display: block;
}

.t-headline {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  line-height: 1.08;
  color: #211d18;
  letter-spacing: -0.01em;
}

.t-subtext {
  color: #4c463d;
  line-height: 1.5;
}

.byline {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Inter', sans-serif;
  color: #6b6558;
  font-weight: 500;
}

.byline .rule {
  width: 32px;
  height: 2px;
  background: #6e1e2a;
  flex-shrink: 0;
}

.t-photo[src=""],
.t-photo:not([src]) {
  display: none;
}`;

const SQUARE_CSS = `${SHARED_BASE}

.editorial-feature-card {
  width: 1080px;
  height: 1080px;
}

.t-photo {
  height: 52%;
}

.fold {
  top: 52%;
}

.content {
  top: 52%;
  padding: 76px 86px 0;
}

.t-tag {
  font-size: 19px;
  margin-bottom: 18px;
}

.t-headline {
  font-size: 56px;
  margin-bottom: 22px;
}

.t-subtext {
  font-size: 23px;
}

.byline {
  left: 86px;
  right: 86px;
  bottom: 64px;
  font-size: 19px;
}`;

const PORTRAIT_CSS = `${SHARED_BASE}

.editorial-feature-card {
  width: 1080px;
  height: 1350px;
}

.t-photo {
  height: 48%;
}

.fold {
  top: 48%;
}

.content {
  top: 48%;
  padding: 80px 86px 0;
}

.t-tag {
  font-size: 19px;
  margin-bottom: 20px;
}

.t-headline {
  font-size: 58px;
  margin-bottom: 24px;
}

.t-subtext {
  font-size: 24px;
}

.byline {
  left: 86px;
  right: 86px;
  bottom: 72px;
  font-size: 19px;
}`;

const STORY_CSS = `${SHARED_BASE}

.editorial-feature-card {
  width: 1080px;
  height: 1920px;
}

.t-photo {
  height: 45%;
}

.fold {
  top: 45%;
}

.content {
  top: 45%;
  padding: 88px 86px 0;
}

.t-tag {
  font-size: 20px;
  margin-bottom: 24px;
}

.t-headline {
  font-size: 62px;
  margin-bottom: 28px;
}

.t-subtext {
  font-size: 26px;
}

.byline {
  left: 86px;
  right: 86px;
  bottom: 88px;
  font-size: 20px;
}`;

const LANDSCAPE_CSS = `${SHARED_BASE}

.editorial-feature-card {
  width: 1200px;
  height: 628px;
}

.t-photo {
  height: 100%;
  width: 48%;
}

.fold {
  top: 0;
  left: 48%;
  width: 16px;
  height: 100%;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.14), rgba(0, 0, 0, 0));
}

.content {
  top: 0;
  left: 48%;
  right: 0;
  padding: 48px 56px 0;
}

.t-tag {
  font-size: 15px;
  margin-bottom: 12px;
}

.t-headline {
  font-size: 36px;
  margin-bottom: 14px;
}

.t-subtext {
  font-size: 17px;
  line-height: 1.4;
}

.byline {
  left: calc(48% + 56px);
  right: 56px;
  bottom: 36px;
  font-size: 15px;
}`;

export const editorialFeatureCardTemplate = {
  id: 'editorial-feature-card',
  name: 'Editorial Feature',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO', label: 'Photo', type: 'image', required: true },
    { key: 'TAG', label: 'Tag', type: 'text', required: true },
    { key: 'HEADLINE', label: 'Headline', type: 'textarea', required: true },
    { key: 'SUBTEXT', label: 'Subtext', type: 'textarea', required: true },
    { key: 'AUTHOR', label: 'Author', type: 'text', required: true },
    { key: 'READ_TIME', label: 'Read time', type: 'text', required: true },
  ],
  content: { html: EDITORIAL_HTML },
  layouts: {
    square: { css: SQUARE_CSS, width: 1080, height: 1080 },
    portrait: { css: PORTRAIT_CSS, width: 1080, height: 1350 },
    story: { css: STORY_CSS, width: 1080, height: 1920 },
    landscape: { css: LANDSCAPE_CSS, width: 1200, height: 628 },
  },
  isAnimated: false,
};
