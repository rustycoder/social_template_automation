/**
 * Azoogi product datasheet template (from datasheet-template/azoogi-datasheet-template.html)
 * Placeholders: CODE, NAME, IMAGE, DESCRIPTION, DIAGRAM, SPECS (+ any key inside SPECS JSON)
 */

export const AZOOGI_DATASHEET_CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  font-family: "Open Sans", "Helvetica Neue", Arial, sans-serif;
  color: #1a1a1a;
  background: #ffffff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page {
  position: relative;
  width: 210mm;
  height: 297mm;
  margin: 0;
  background: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pdf-export-container .page,
.pdf-page-wrapper .page {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  box-shadow: none !important;
}

.az-header {
  background: #0e0e0e;
  color: #ffffff;
  padding: 7mm 10mm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #000;
}
.az-header .logo-left { height: 14mm; display: block; max-width: 45%; object-fit: contain; }
.az-header .logo-right { height: 14mm; display: block; max-width: 45%; object-fit: contain; }

.title-block { padding: 6mm 10mm 0; }
.title-block h1 {
  margin: 0;
  font-size: 24pt;
  font-weight: 700;
  color: #111;
  letter-spacing: .3px;
}
.title-block h2 {
  margin: 0 0 3mm;
  font-size: 14pt;
  font-weight: 700;
  color: #73bf44;
}
.title-block h2:empty { display: none; }

.gradient-line {
  height: 2px;
  background: linear-gradient(90deg, #73bf44 0%, #73bf44 35%, rgba(103,208,78,0) 100%);
  border: 0;
  margin: 0 10mm;
}

.body-wrap {
  flex: 1;
  position: relative;
  padding: 6mm 10mm 4mm;
  background: #ffffff;
  min-height: 0;
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6mm;
  position: relative;
  z-index: 1;
}

.desc {
  font-size: 10px;
  line-height: 1.55;
  color: #2a2a2a;
  text-align: justify;
  margin: 0 0 6mm;
}

.params-title {
  font-size: 9pt;
  font-weight: 700;
  color: #111;
  margin: 0 0 2mm;
}

table.params {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  border: 1px solid #73bf44;
}
table.params td {
  padding: 2mm 3mm;
  border: 1px solid #73bf44;
  vertical-align: middle;
}
table.params tr td:first-child {
  font-weight: 700;
  width: 38%;
  background: #1a1a1a;
  color: #ffffff;
}
table.params tr:nth-child(odd) td:last-child { background: #d9f0d0; color: #111; }
table.params tr:nth-child(even) td:last-child { background: #ffffff; color: #111; }

.product-img-container, .dim-img-container {
  height: 78mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.dim-img-container {
  height: 55mm;
  margin-top: 34px;

}

.product-img {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  width: auto;
  display: block;
}

.dim-title {
  text-align: center;
  margin: 6mm 0 3mm;
  font-size: 9pt;
  font-weight: 700;
  color: #111;
}

.dim-img {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  width: auto;
  display: block;
}

.note-img-container {
  height: 55mm;
  margin-top: 34px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.note-img {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  width: auto;
  display: block;
}

.az-footer {
  background: #0e0e0e;
  color: #ffffff;
  padding: 5mm 10mm;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 4mm;
  font-size: 8.5pt;
}
.az-footer .f-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #e6e6e6;
}
.az-footer .f-item svg {
  width: 11px;
  height: 11px;
  fill: #67d04e;
  flex-shrink: 0;
}
`;

export const AZOOGI_DATASHEET_HTML = `<section class="page">

  <header class="az-header">
    <img class="logo-left" src="/datasheet-template/assets/logo.png" alt="Azoogi Lighting Solutions">
    <img class="logo-right" src="/datasheet-template/assets/lc.png" alt="Lighting Council Australia">
  </header>

  <div class="title-block">
    {{#if CODE}}<h1>{{CODE}}</h1>{{/if}}
    {{#if NAME}}<h2>{{NAME}}</h2>{{/if}}
  </div>
  <hr class="gradient-line">

  <div class="body-wrap">
    <div class="content">

      <div>
        {{#if DESCRIPTION}}<p class="desc">{{DESCRIPTION}}</p>{{/if}}
        {{#if SPECS}}
          <p class="params-title">SPECIFICATIONS</p>
          {{SPECS}}
        {{/if}}
      </div>

      <div style="display: flex; flex-direction: column;">
        {{#if IMAGE}}
        <div class="product-img-container">
          <img class="product-img" src="{{IMAGE}}" alt="{{NAME}}">
        </div>
        {{/if}}
        {{#if DIAGRAM}}
        <div class="dim-img-container">
          <div class="dim-title">DIMENSIONS</div>
          <img class="dim-img" src="{{DIAGRAM}}" alt="Dimensions">
        </div>
        {{/if}}
        <div class="note-img-container">
          <img class="note-img" src="/datasheet-template/assets/note.jpeg" alt="Note">
        </div>
      </div>
    </div>
  </div>

  <footer class="az-footer">
    <span class="f-item">
      <svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z"/></svg>
      sales@azoogi.com.au
    </span>
    <span class="f-item">
      <svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.9 15.9 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.25 1z"/></svg>
      1300 641 261
    </span>
    <span class="f-item">
      <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm7.9 9h-3.95a15.7 15.7 0 0 0-1.3-5.7A8 8 0 0 1 19.9 11zM12 4c.97 1.4 1.8 3.7 1.95 7H10.05C10.2 7.7 11.03 5.4 12 4zM4.1 13h3.95a15.7 15.7 0 0 0 1.3 5.7A8 8 0 0 1 4.1 13zm0-2A8 8 0 0 1 9.35 5.3 15.7 15.7 0 0 0 8.05 11zm7.9 9c-.97-1.4-1.8-3.7-1.95-7h3.9c-.15 3.3-.98 5.6-1.95 7zm2.65-.3a15.7 15.7 0 0 0 1.3-5.7h3.95a8 8 0 0 1-5.25 5.7z"/></svg>
      www.azoogi.com.au
    </span>
    <span class="f-item">
      <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"/></svg>
      Unit 47, 10-12 Girawah Place, Matraville, NSW, 2036
    </span>
  </footer>

</section>`;

export const azoogiDatasheetTemplate = {
  name: 'Azoogi Datasheet',
  html: AZOOGI_DATASHEET_HTML,
  css: AZOOGI_DATASHEET_CSS,
};
