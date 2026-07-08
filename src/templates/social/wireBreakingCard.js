const WIRE_HTML = `<div class="card wire-breaking-card">
  <img class="t-photo" src="{{PHOTO}}" alt="" />
  <div class="scrim"></div>
  <div class="top-row">
    <div class="t-tag"><span>{{TAG}}</span></div>
    <div class="dateline">{{DATELINE}}</div>
  </div>
  <div class="t-headline">{{HEADLINE}}</div>
  <div class="t-subtext">{{SUBTEXT}}</div>
  <div class="wire-bar">{{SOURCE}} &middot; {{DATE}} &middot; {{TIME}}</div>
</div>`;

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');`;

const SHARED_BASE = `${FONT_IMPORT}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.wire-breaking-card {
  position: relative;
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
  background: #0b0b0c;
}

.t-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(15%) contrast(1.08);
}

.scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(4, 4, 5, 0.95) 0%,
    rgba(4, 4, 5, 0.55) 42%,
    rgba(4, 4, 5, 0.05) 68%
  );
  z-index: 2;
}

.top-row {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 14px;
}

.t-tag {
  background: #d6293e;
  color: #fff;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800;
  letter-spacing: 0.06em;
  transform: skewX(-8deg);
  display: inline-block;
}

.t-tag span {
  display: inline-block;
  transform: skewX(8deg);
}

.dateline {
  font-family: 'JetBrains Mono', monospace;
  color: #d8d9dc;
  letter-spacing: 0.03em;
}

.t-headline {
  position: absolute;
  z-index: 3;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800;
  line-height: 0.98;
  color: #fff;
  letter-spacing: -0.01em;
}

.t-subtext {
  position: absolute;
  z-index: 3;
  color: #d3d4d8;
  line-height: 1.4;
}

.wire-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  background: #d6293e;
  display: flex;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.05em;
  color: #fff;
  font-weight: 600;
}

.t-photo[src=""],
.t-photo:not([src]) {
  display: none;
}`;

const SQUARE_CSS = `${SHARED_BASE}

.wire-breaking-card {
  width: 1080px;
  height: 1080px;
}

.top-row {
  top: 56px;
  left: 65px;
  right: 65px;
}

.t-tag {
  font-size: 26px;
  padding: 6px 16px 4px;
}

.dateline {
  font-size: 18px;
}

.t-headline {
  left: 65px;
  right: 65px;
  bottom: 162px;
  font-size: 72px;
}

.t-subtext {
  left: 65px;
  right: 65px;
  bottom: 97px;
  font-size: 23px;
}

.wire-bar {
  height: 76px;
  padding: 0 65px;
  font-size: 18px;
}`;

const PORTRAIT_CSS = `${SHARED_BASE}

.wire-breaking-card {
  width: 1080px;
  height: 1350px;
}

.top-row {
  top: 70px;
  left: 65px;
  right: 65px;
}

.t-tag {
  font-size: 28px;
  padding: 7px 18px 5px;
}

.dateline {
  font-size: 19px;
}

.t-headline {
  left: 65px;
  right: 65px;
  bottom: 200px;
  font-size: 78px;
}

.t-subtext {
  left: 65px;
  right: 65px;
  bottom: 120px;
  font-size: 24px;
}

.wire-bar {
  height: 80px;
  padding: 0 65px;
  font-size: 18px;
}`;

const STORY_CSS = `${SHARED_BASE}

.wire-breaking-card {
  width: 1080px;
  height: 1920px;
}

.top-row {
  top: 80px;
  left: 65px;
  right: 65px;
}

.t-tag {
  font-size: 30px;
  padding: 8px 20px 6px;
}

.dateline {
  font-size: 20px;
}

.t-headline {
  left: 65px;
  right: 65px;
  bottom: 280px;
  font-size: 84px;
}

.t-subtext {
  left: 65px;
  right: 65px;
  bottom: 170px;
  font-size: 26px;
}

.wire-bar {
  height: 88px;
  padding: 0 65px;
  font-size: 19px;
}`;

const LANDSCAPE_CSS = `${SHARED_BASE}

.wire-breaking-card {
  width: 1200px;
  height: 628px;
}

.top-row {
  top: 32px;
  left: 48px;
  right: 48px;
  gap: 10px;
}

.t-tag {
  font-size: 20px;
  padding: 4px 12px 3px;
}

.dateline {
  font-size: 14px;
}

.t-headline {
  left: 48px;
  right: 48px;
  bottom: 100px;
  font-size: 44px;
}

.t-subtext {
  left: 48px;
  right: 48px;
  bottom: 58px;
  font-size: 16px;
  line-height: 1.35;
}

.wire-bar {
  height: 52px;
  padding: 0 48px;
  font-size: 14px;
}`;

export const wireBreakingCardTemplate = {
  id: 'wire-breaking-card',
  name: 'Wire / Breaking',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO', label: 'Photo', type: 'image', required: true },
    { key: 'TAG', label: 'Tag', type: 'text', required: true },
    { key: 'DATELINE', label: 'Dateline', type: 'text', required: true },
    { key: 'HEADLINE', label: 'Headline', type: 'textarea', required: true },
    { key: 'SUBTEXT', label: 'Subtext', type: 'textarea', required: true },
    { key: 'SOURCE', label: 'Wire source', type: 'text', required: true },
    { key: 'DATE', label: 'Wire date', type: 'text', required: true },
    { key: 'TIME', label: 'Wire time', type: 'text', required: true },
  ],
  content: { html: WIRE_HTML },
  layouts: {
    square: { css: SQUARE_CSS, width: 1080, height: 1080 },
    portrait: { css: PORTRAIT_CSS, width: 1080, height: 1350 },
    story: { css: STORY_CSS, width: 1080, height: 1920 },
    landscape: { css: LANDSCAPE_CSS, width: 1200, height: 628 },
  },
  isAnimated: false,
};
