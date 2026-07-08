export const HEIST_HTML = `<section class="page heist-page">
  <div class="post-container">
    <div class="background-image" style="background-image: url('{{IMAGE}}')"></div>
    <div class="background-overlay"></div>

    <div class="content-area">
      <div class="divider-container">
        <div class="line"></div>
        <div class="ai-badge">A<span>i</span></div>
        <div class="line"></div>
      </div>

      <h1 class="headline">
        {{HEADLINE}}
      </h1>

      <div class="swipe-button">
        {{SWIPE_TEXT}}<span class="arrow">&gt;</span>
      </div>
    </div>
  </div>
</section>`;

export const HEIST_CSS = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Inter:wght@400;600&display=swap');

@page {
  size: A4;
  margin: 0;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.heist-page {
  position: relative;
  width: 210mm;
  height: 297mm;
  margin: 0;
  background-color: #0f1115;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.pdf-export-container .page,
.pdf-page-wrapper .page {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  box-shadow: none !important;
}

.post-container {
  width: 100%;
  max-width: 500px;
  aspect-ratio: 4 / 5;
  background-color: #000000;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border-radius: 12px;
}

/* Simulated Background Image Area */
.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 65%;
  background-image: url('https://via.placeholder.com/500x650/1a1a1a/888888?text=Image+Placeholder');
  background-size: cover;
  background-position: center;
  z-index: 1;
}

/* Smooth gradient transition from image to black text area */
.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,1) 65%);
  z-index: 2;
}

.content-area {
  position: relative;
  z-index: 3;
  padding: 0 24px 20px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* Divider with Central AI Badge */
.divider-container {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.line {
  flex-grow: 1;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.3);
}

.ai-badge {
  margin: 0 10px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.ai-badge span {
  font-style: italic;
  font-weight: 400;
}

/* Typography Styling */
.headline {
  font-family: 'Oswald', sans-serif;
  font-size: 38px;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  word-spacing: 2px;
  margin-bottom: 24px;
}

.highlight {
  color: #2ce2cc; /* Teal/Cyan tone matching the image */
}

/* Swipe pill button */
.swipe-button {
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  text-transform: uppercase;
}

.swipe-button .arrow {
  font-size: 12px;
  display: inline-block;
  background: #ffffff;
  color: #000000;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  line-height: 13px;
  text-align: center;
  font-weight: 700;
}
`;

export const heistSocialPostTemplate = {
  name: 'AI Heist Social Post',
  html: HEIST_HTML,
  css: HEIST_CSS,
};
