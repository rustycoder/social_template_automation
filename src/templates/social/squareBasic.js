const HTML = `<div class="social-post">
  <div class="bg-image" style="background-image: url('{{IMAGE}}')"></div>
  <div class="gradient-overlay"></div>
  <div class="text-layer">
    <h1 class="headline">{{HEADLINE}}</h1>
    <p class="caption">{{CAPTION}}</p>
  </div>
</div>`;

const SQUARE_CSS = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.social-post {
  position: relative;
  width: 1080px;
  height: 1080px;
  overflow: hidden;
  background: #0f172a;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #ffffff;
  -webkit-font-smoothing: antialiased;
}

.bg-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-color: #1e293b;
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(15, 23, 42, 0.92) 0%,
    rgba(15, 23, 42, 0.55) 32%,
    rgba(15, 23, 42, 0.15) 55%,
    transparent 72%
  );
}

.text-layer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 56px 64px;
}

.headline {
  font-size: 56px;
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.caption {
  font-size: 24px;
  font-weight: 400;
  line-height: 1.45;
  opacity: 0.88;
  max-width: 90%;
}`;

export const squareBasicTemplate = {
  id: 'square-basic',
  name: 'Square Basic',
  content: { html: HTML },
  layouts: {
    square: { css: SQUARE_CSS, width: 1080, height: 1080 },
    portrait: null,
    story: null,
    landscape: null,
  },
  isAnimated: false,
};
