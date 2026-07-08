const HEIST_HTML = `<div class="social-post heist-post">
  <div class="background-image" style="background-image: url('{{IMAGE}}')"></div>
  <div class="background-overlay"></div>
  <div class="content-area">
    <div class="divider-container">
      <div class="line"></div>
      <div class="ai-badge">A<span>i</span></div>
      <div class="line"></div>
    </div>
    <h1 class="headline">{{HEADLINE}}</h1>
    <div class="swipe-button">
      {{SWIPE_TEXT}}<span class="arrow">&gt;</span>
    </div>
  </div>
</div>`;

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Inter:wght@400;600&display=swap');`;

const SHARED_BASE = `${FONT_IMPORT}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.heist-post {
  position: relative;
  overflow: hidden;
  background-color: #000000;
  color: #ffffff;
  font-family: 'Inter', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  -webkit-font-smoothing: antialiased;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 65%;
  background-size: cover;
  background-position: center;
  background-color: #1a1a1a;
  z-index: 1;
}

.background-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 1) 65%);
  z-index: 2;
}

.content-area {
  position: relative;
  z-index: 3;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.divider-container {
  width: 100%;
  display: flex;
  align-items: center;
}

.line {
  flex-grow: 1;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.3);
}

.ai-badge {
  margin: 0 10px;
  font-weight: 600;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.ai-badge span {
  font-style: italic;
  font-weight: 400;
}

.headline {
  font-family: 'Oswald', sans-serif;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  word-spacing: 2px;
  width: 100%;
}

.swipe-button {
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  font-weight: 600;
  letter-spacing: 1px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  text-transform: uppercase;
}

.swipe-button .arrow {
  display: inline-block;
  background: #ffffff;
  color: #000000;
  border-radius: 50%;
  line-height: 1;
  text-align: center;
  font-weight: 700;
}`;

const SQUARE_CSS = `${SHARED_BASE}

.heist-post {
  width: 1080px;
  height: 1080px;
}

.content-area {
  padding: 0 48px 72px;
}

.divider-container {
  margin-bottom: 20px;
}

.ai-badge {
  font-size: 18px;
}

.headline {
  font-size: 52px;
  margin-bottom: 28px;
}

.swipe-button {
  padding: 8px 20px;
  font-size: 13px;
}

.swipe-button .arrow {
  font-size: 12px;
  width: 16px;
  height: 16px;
  line-height: 16px;
}`;

const STORY_CSS = `${SHARED_BASE}

.heist-post {
  width: 1080px;
  height: 1920px;
}

.content-area {
  padding: 0 56px 384px;
}

.divider-container {
  margin-bottom: 24px;
}

.ai-badge {
  font-size: 22px;
}

.headline {
  font-size: 68px;
  margin-bottom: 32px;
}

.swipe-button {
  padding: 10px 24px;
  font-size: 15px;
}

.swipe-button .arrow {
  font-size: 14px;
  width: 18px;
  height: 18px;
  line-height: 18px;
}`;

export const heistPostTemplate = {
  id: 'ai-heist',
  name: 'AI Heist',
  fields: [
    { key: 'IMAGE', label: 'Background image', type: 'image', required: true },
    { key: 'HEADLINE', label: 'Headline', type: 'text', required: true },
    { key: 'SWIPE_TEXT', label: 'Swipe text', type: 'text', required: false },
  ],
  content: { html: HEIST_HTML },
  layouts: {
    square: { css: SQUARE_CSS, width: 1080, height: 1080 },
    portrait: null,
    story: { css: STORY_CSS, width: 1080, height: 1920 },
    landscape: null,
  },
  isAnimated: false,
};
