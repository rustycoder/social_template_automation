const HTML = `<div class="social-post">
  <div class="bg-image" style="background-image: url('{{IMAGE}}')"></div>
  <div class="gradient-overlay"></div>
  <div class="text-layer">
    <h1 class="headline">{{HEADLINE}}</h1>
    <p class="caption">{{CAPTION}}</p>
  </div>
</div>`;

const STORY_CSS = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.social-post {
  position: relative;
  width: 1080px;
  height: 1920px;
  overflow: hidden;
  background: #1a1817;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #ffffff;
  -webkit-font-smoothing: antialiased;
}

.bg-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-color: #2b2928;
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(26, 24, 23, 0.94) 0%,
    rgba(26, 24, 23, 0.5) 28%,
    rgba(26, 24, 23, 0.12) 48%,
    transparent 62%
  );
}

/* Safe zones: top 12% and bottom 20% kept clear for platform UI */
.text-layer {
  position: absolute;
  left: 0;
  right: 0;
  top: 12%;
  bottom: 20%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 56px 24px;
}

.headline {
  font-size: 64px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 20px;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.4);
}

.caption {
  font-size: 28px;
  font-weight: 400;
  line-height: 1.45;
  opacity: 0.88;
  max-width: 92%;
}`;

export const storyBasicTemplate = {
  id: 'story-basic',
  name: 'Story Basic',
  content: { html: HTML },
  layouts: {
    square: null,
    portrait: null,
    story: { css: STORY_CSS, width: 1080, height: 1920 },
    landscape: null,
  },
  isAnimated: false,
};
