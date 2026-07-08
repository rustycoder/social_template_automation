const NEWS_REEL_HTML = `<div class="social-post news-reel">
  <div class="bg-image" style="background-image: url('{{IMAGE}}')"></div>
  <div class="vignette-overlay"></div>
  <div class="text-layer">
    <div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="hook-box">{{HOOK}}</div>
    <div class="stack-block block-white block-line-1">{{LINE_1}}</div>
    <div class="stack-block block-red block-line-2">{{LINE_2}}</div>
    <div class="stack-block block-white block-line-3">{{LINE_3}}</div>
    <p class="body-text">{{BODY}}</p>
    <div class="handle">{{HANDLE}}</div>
  </div>
</div>`;

export const NEWS_REEL_ANIMATION = {
  duration: 4000,
  fps: 15,
  steps: [
    {
      selector: '.hook-box',
      start: 0,
      end: 0.22,
      from: { opacity: '0', transform: 'translateY(24px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    {
      selector: '.block-line-1',
      start: 0.12,
      end: 0.34,
      from: { opacity: '0', transform: 'translateY(20px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    {
      selector: '.block-line-2',
      start: 0.24,
      end: 0.46,
      from: { opacity: '0', transform: 'translateY(20px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    {
      selector: '.block-line-3',
      start: 0.36,
      end: 0.58,
      from: { opacity: '0', transform: 'translateY(20px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    {
      selector: '.body-text',
      start: 0.48,
      end: 0.7,
      from: { opacity: '0', transform: 'translateY(16px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    {
      selector: '.handle',
      start: 0.6,
      end: 0.82,
      from: { opacity: '0', transform: 'translateY(12px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
  ],
};

const STORY_CSS = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.social-post.news-reel {
  position: relative;
  width: 1080px;
  height: 1920px;
  overflow: hidden;
  background: #0a0a0a;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #ffffff;
  -webkit-font-smoothing: antialiased;
}

.news-reel .bg-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-color: #1a1a1a;
}

.news-reel .vignette-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.55) 0%,
    rgba(0, 0, 0, 0.2) 22%,
    transparent 45%
  );
  pointer-events: none;
}

/* Safe zones: top 12% and bottom 20% kept clear for platform UI */
.news-reel .text-layer {
  position: absolute;
  left: 0;
  right: 0;
  top: 12%;
  bottom: 20%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: stretch;
  padding: 0 48px 16px;
  z-index: 1;
}

.news-reel .dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.news-reel .dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffffff;
  opacity: 0.9;
}

.news-reel .hook-box {
  background: #ffff00;
  color: #000000;
  font-size: 52px;
  font-weight: 800;
  line-height: 1.05;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 14px 20px;
  margin-bottom: 4px;
}

.news-reel .stack-block {
  font-size: 44px;
  font-weight: 800;
  line-height: 1.08;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  padding: 12px 20px;
  margin-bottom: 4px;
}

.news-reel .block-white {
  background: #ffffff;
  color: #000000;
}

.news-reel .block-red {
  background: #7a1f2e;
  color: #ffffff;
}

.news-reel .body-text {
  margin-top: 18px;
  font-size: 28px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
  color: #ffffff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.65);
  padding: 0 8px;
}

.news-reel .handle {
  margin-top: 22px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}`;

const SQUARE_CSS = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.social-post.news-reel {
  position: relative;
  width: 1080px;
  height: 1080px;
  overflow: hidden;
  background: #0a0a0a;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #ffffff;
  -webkit-font-smoothing: antialiased;
}

.news-reel .bg-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-color: #1a1a1a;
}

.news-reel .vignette-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.58) 0%,
    rgba(0, 0, 0, 0.22) 28%,
    transparent 52%
  );
  pointer-events: none;
}

.news-reel .text-layer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: stretch;
  padding: 0 48px 80px;
  z-index: 1;
}

.news-reel .dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 14px;
}

.news-reel .dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  opacity: 0.9;
}

.news-reel .hook-box {
  background: #ffff00;
  color: #000000;
  font-size: 36px;
  font-weight: 800;
  line-height: 1.05;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 10px 16px;
  margin-bottom: 3px;
}

.news-reel .stack-block {
  font-size: 31px;
  font-weight: 800;
  line-height: 1.08;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  padding: 9px 16px;
  margin-bottom: 3px;
}

.news-reel .block-white {
  background: #ffffff;
  color: #000000;
}

.news-reel .block-red {
  background: #7a1f2e;
  color: #ffffff;
}

.news-reel .body-text {
  margin-top: 12px;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.65);
  padding: 0 6px;
}

.news-reel .handle {
  margin-top: 16px;
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}`;

export const newsReelTemplate = {
  id: 'news-reel',
  name: 'News Reel',
  fields: [
    { key: 'IMAGE', label: 'Background image', type: 'image', required: true },
    { key: 'HOOK', label: 'Hook', type: 'text', required: true },
    { key: 'LINE_1', label: 'Line 1', type: 'text', required: true },
    { key: 'LINE_2', label: 'Line 2', type: 'text', required: true },
    { key: 'LINE_3', label: 'Line 3', type: 'text', required: true },
    { key: 'BODY', label: 'Body text', type: 'textarea', required: true },
    { key: 'HANDLE', label: 'Handle / footer', type: 'text', required: false },
  ],
  content: { html: NEWS_REEL_HTML },
  layouts: {
    square: { css: SQUARE_CSS, width: 1080, height: 1080, animation: NEWS_REEL_ANIMATION },
    portrait: null,
    story: { css: STORY_CSS, width: 1080, height: 1920, animation: NEWS_REEL_ANIMATION },
    landscape: null,
  },
  isAnimated: true,
};
