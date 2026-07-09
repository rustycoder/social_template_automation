const DATA_HTML = `<div class="card data-analysis-card">
  <div class="t-tag">{{TAG}}</div>
  <div class="stat">{{STAT}}</div>
  <div class="t-subtext">{{SUBTEXT}}</div>
  <div class="axis">
    <span>{{AXIS_1}}</span>
    <span>{{AXIS_2}}</span>
    <span>{{AXIS_3}}</span>
    <span>{{AXIS_4}}</span>
  </div>
  <div class="source">Source: {{SOURCE}}</div>
</div>`;

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap');`;

const SHARED_BASE = `${FONT_IMPORT}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.data-analysis-card {
  position: relative;
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
  background: #1c2333;
  display: flex;
  flex-direction: column;
}

.t-tag {
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: #e8a33d;
}

.stat {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  line-height: 1;
  color: #f1f0ec;
  letter-spacing: -0.02em;
}

.t-subtext {
  color: #c7cad6;
  line-height: 1.5;
}

.axis {
  margin-top: auto;
  position: relative;
  border-top: 1.5px solid #3a4258;
  display: flex;
  justify-content: space-between;
}

.axis span {
  font-family: 'JetBrains Mono', monospace;
  color: #5c6377;
}

.source {
  position: absolute;
  font-size: 18px;
  color: #5c6377;
  font-family: 'Inter', sans-serif;
}`;

const SQUARE_CSS = `${SHARED_BASE}

.data-analysis-card {
  width: 1080px;
  height: 1080px;
  padding: 98px 86px;
}

.t-tag {
  font-size: 20px;
  margin-bottom: 60px;
}

.stat {
  font-size: 168px;
  margin-bottom: 56px;
}

.t-subtext {
  font-size: 28px;
  max-width: 92%;
}

.axis {
  height: 60px;
  padding-top: 14px;
}

.axis span {
  font-size: 17px;
}

.source {
  bottom: 64px;
  left: 86px;
}`;

const PORTRAIT_CSS = `${SHARED_BASE}

.data-analysis-card {
  width: 1080px;
  height: 1350px;
  padding: 110px 86px;
}

.t-tag {
  font-size: 21px;
  margin-bottom: 72px;
}

.stat {
  font-size: 188px;
  margin-bottom: 64px;
}

.t-subtext {
  font-size: 30px;
  max-width: 92%;
}

.axis {
  height: 64px;
  padding-top: 16px;
}

.axis span {
  font-size: 18px;
}

.source {
  bottom: 72px;
  left: 86px;
}`;

const STORY_CSS = `${SHARED_BASE}

.data-analysis-card {
  width: 1080px;
  height: 1920px;
  padding: 140px 86px;
}

.t-tag {
  font-size: 22px;
  margin-bottom: 100px;
}

.stat {
  font-size: 220px;
  margin-bottom: 80px;
}

.t-subtext {
  font-size: 32px;
  max-width: 92%;
}

.axis {
  height: 70px;
  padding-top: 18px;
}

.axis span {
  font-size: 19px;
}

.source {
  bottom: 96px;
  left: 86px;
}`;

const LANDSCAPE_CSS = `${SHARED_BASE}

.data-analysis-card {
  width: 1200px;
  height: 628px;
  padding: 48px 56px;
}

.t-tag {
  font-size: 16px;
  margin-bottom: 24px;
}

.stat {
  font-size: 72px;
  margin-bottom: 20px;
}

.t-subtext {
  font-size: 18px;
  max-width: 85%;
  line-height: 1.4;
}

.axis {
  height: 44px;
  padding-top: 10px;
}

.axis span {
  font-size: 14px;
}

.source {
  bottom: 32px;
  left: 56px;
  font-size: 15px;
}`;

export const dataAnalysisCardTemplate = {
  id: 'data-analysis-card',
  name: 'Data / Analysis',
  previewBucket: 'square',
  fields: [
    { key: 'TAG', label: 'Tag', type: 'text', required: true },
    { key: 'STAT', label: 'Stat', type: 'text', required: true },
    { key: 'SUBTEXT', label: 'Subtext', type: 'textarea', required: true },
    { key: 'AXIS_1', label: 'Axis label 1', type: 'text', required: true },
    { key: 'AXIS_2', label: 'Axis label 2', type: 'text', required: true },
    { key: 'AXIS_3', label: 'Axis label 3', type: 'text', required: true },
    { key: 'AXIS_4', label: 'Axis label 4', type: 'text', required: true },
    { key: 'SOURCE', label: 'Source', type: 'text', required: true },
  ],
  content: { html: DATA_HTML },
  layouts: {
    square: { css: SQUARE_CSS, width: 1080, height: 1080 },
    portrait: { css: PORTRAIT_CSS, width: 1080, height: 1350 },
    story: { css: STORY_CSS, width: 1080, height: 1920 },
    landscape: { css: LANDSCAPE_CSS, width: 1200, height: 628 },
  },
  isAnimated: false,
};
