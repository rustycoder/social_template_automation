const VIRAL_HIGHLIGHT_HTML = `<div class="card viral-highlight-card">
  <div class="header-bar">{{HEADER_TEXT}}</div>
  <div class="visual-stage">
    <img class="bg-image" src="{{BG_IMAGE}}" alt="" />
    <img class="inset inset-left" src="{{INSET_LEFT}}" alt="" />
    <img class="subject-image" src="{{SUBJECT_IMAGE}}" alt="" />
    <img class="inset inset-right" src="{{INSET_RIGHT}}" alt="" />
  </div>
  <div class="footer-bar">
    <p class="footer-text">{{FOOTER_TEXT}}</p>
  </div>
</div>`;

const SHARED_BASE = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.viral-highlight-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: #000;
}

.header-bar {
  background: #ffff00;
  color: #ff0000;
  font-weight: 800;
  text-transform: uppercase;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.02em;
  line-height: 1.1;
}

.visual-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.bg-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.inset {
  position: absolute;
  border-radius: 50%;
  object-fit: cover;
  z-index: 2;
}

.inset-left {
  border-style: solid;
  border-color: #ffff00;
}

.inset-right {
  border-style: solid;
  border-color: #ffffff;
}

.subject-image {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  object-fit: contain;
  object-position: bottom center;
  z-index: 3;
  max-width: 62%;
}

.footer-bar {
  background: #000000;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-text {
  color: #ffffff;
  font-weight: 700;
  text-align: center;
  line-height: 1.35;
}

.footer-text .hl-yellow {
  color: #ffff00;
}

.bg-image[src=""],
.bg-image:not([src]),
.inset[src=""],
.inset:not([src]),
.subject-image[src=""],
.subject-image:not([src]) {
  display: none;
}`;

const PORTRAIT_CSS = `${SHARED_BASE}

.viral-highlight-card {
  width: 1080px;
  height: 1350px;
}

.header-bar {
  height: 148px;
  font-size: 42px;
  padding: 0 24px;
}

.footer-bar {
  height: 324px;
  padding: 24px 48px;
}

.footer-text {
  font-size: 28px;
}

.inset {
  width: 200px;
  height: 200px;
}

.inset-left {
  left: 6%;
  bottom: 32%;
  border-width: 5px;
}

.inset-right {
  right: 6%;
  bottom: 42%;
  border-width: 5px;
}

.subject-image {
  max-height: 88%;
}`;

const STORY_CSS = `${SHARED_BASE}

.viral-highlight-card {
  width: 1080px;
  height: 1920px;
}

.header-bar {
  height: 211px;
  font-size: 48px;
  padding: 0 32px;
}

.footer-bar {
  height: 461px;
  padding: 32px 56px;
}

.footer-text {
  font-size: 32px;
}

.inset {
  width: 240px;
  height: 240px;
}

.inset-left {
  left: 5%;
  bottom: 34%;
  border-width: 6px;
}

.inset-right {
  right: 5%;
  bottom: 44%;
  border-width: 6px;
}

.subject-image {
  max-height: 90%;
}`;

const SQUARE_CSS = `${SHARED_BASE}

.viral-highlight-card {
  width: 1080px;
  height: 1080px;
}

.header-bar {
  height: 119px;
  font-size: 34px;
  padding: 0 20px;
}

.footer-bar {
  height: 259px;
  padding: 20px 36px;
}

.footer-text {
  font-size: 22px;
}

.inset {
  width: 160px;
  height: 160px;
}

.inset-left {
  left: 5%;
  bottom: 28%;
  border-width: 4px;
}

.inset-right {
  right: 5%;
  bottom: 38%;
  border-width: 4px;
}

.subject-image {
  max-height: 82%;
  max-width: 58%;
}`;

const LANDSCAPE_CSS = `${SHARED_BASE}

.viral-highlight-card {
  width: 1200px;
  height: 628px;
}

.header-bar {
  height: 69px;
  font-size: 28px;
  padding: 0 16px;
}

.footer-bar {
  height: 150px;
  padding: 12px 40px;
}

.footer-text {
  font-size: 18px;
  line-height: 1.25;
}

.inset {
  width: 110px;
  height: 110px;
}

.inset-left {
  left: 4%;
  bottom: 22%;
  border-width: 3px;
}

.inset-right {
  right: 4%;
  bottom: 30%;
  border-width: 3px;
}

.subject-image {
  max-height: 78%;
  max-width: 45%;
}`;

export const viralHighlightCardTemplate = {
  id: 'viral-highlight-card',
  name: 'Viral Highlight Card',
  previewBucket: 'portrait',
  fields: [
    { key: 'HEADER_TEXT', label: 'Header text', type: 'text', required: true },
    { key: 'BG_IMAGE', label: 'Background image', type: 'image', required: true },
    { key: 'SUBJECT_IMAGE', label: 'Main subject', type: 'image', required: true },
    { key: 'INSET_LEFT', label: 'Left circle image', type: 'image', required: true },
    { key: 'INSET_RIGHT', label: 'Right circle image', type: 'image', required: true },
    {
      key: 'FOOTER_TEXT',
      label: 'Footer copy (HTML: use <span class="hl-yellow"> for highlights)',
      type: 'textarea',
      required: true,
    },
  ],
  content: { html: VIRAL_HIGHLIGHT_HTML },
  layouts: {
    square: { css: SQUARE_CSS, width: 1080, height: 1080 },
    portrait: { css: PORTRAIT_CSS, width: 1080, height: 1350 },
    story: { css: STORY_CSS, width: 1080, height: 1920 },
    landscape: { css: LANDSCAPE_CSS, width: 1200, height: 628 },
  },
  isAnimated: false,
};
