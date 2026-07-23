/**
 * Generates 44 audience & niche templates (ideas 1–44).
 * Run: node scripts/generate-audience-templates.mjs
 * Then: node scripts/generate-sample-data.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../seed-data/templates');
const HTML_DIR = path.join(TEMPLATES_DIR, 'html');
const REGISTRY_PATH = path.join(TEMPLATES_DIR, 'audienceTemplateRegistry.js');

const LOGO_POS = {
  tr: 'top:40px;right:44px;left:auto;bottom:auto;',
  tl: 'top:40px;left:44px;right:auto;bottom:auto;',
  br: 'bottom:44px;right:44px;left:auto;top:auto;',
  bl: 'bottom:44px;left:44px;right:auto;top:auto;',
};

function logoCss(pos) {
  return `.logo-slot{position:absolute;${LOGO_POS[pos]}width:68px;height:68px;border:2px dashed rgba(255,255,255,0.35);border-radius:12px;background:rgba(255,255,255,0.08);overflow:hidden;z-index:8;}.logo-slot img{width:100%;height:100%;object-fit:contain;padding:6px;}`;
}

function markCss(selectors, yellow = '#FFD600', red = '#D6293E', dark = '#0a0a0b') {
  const sel = selectors.join(',');
  return `${sel} mark{background:${yellow};color:${dark};padding:2px 6px;border-radius:2px;}${sel} .highlight-red{background:${red};color:#fff;padding:2px 6px;border-radius:2px;}`;
}

function baseReset() {
  return `*{box-sizing:border-box;margin:0;padding:0;}html,body{width:1080px;height:1080px;overflow:hidden;font-family:'Inter',sans-serif;}`;
}

function wrapHtml({ name, fontUrl, extraCss, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?${fontUrl}&display=swap" rel="stylesheet">
<style>
${baseReset()}
${extraCss}
</style>
</head>
<body>
  <div class="card">
${body}
  </div>
</body>
</html>
`;
}

function inferFieldType(key) {
  if (key.startsWith('PHOTO') || key === 'LOGO') return 'image';
  if (['QUOTE', 'TITLE', 'SUBTITLE', 'DESCRIPTION', 'STEP1', 'STEP2', 'STEP3', 'STEP4'].includes(key)) return 'textarea';
  return 'text';
}

function fieldDefs(keys) {
  return keys.map((key) => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    type: inferFieldType(key),
    required: key !== 'LOGO' && !key.includes('LABEL') && !key.includes('SCORE'),
  }));
}

function makeHero(opts) {
  const {
    cardBg = '#0a0a0b',
    scrim = 'linear-gradient(to top,rgba(0,0,0,0.9),transparent 55%)',
    titleFont = "'Inter',sans-serif",
    titleSize = '46px',
    titleColor = '#fff',
    subColor = '#cbd5e1',
    accent = '#FFD600',
    accentDark = '#0a0a0b',
    align = 'left',
    block = 'bottom',
    extraCss = '',
    photoFilter = '',
  } = opts;
  return (logo, m) => {
    const pos =
      block === 'center'
        ? 'left:72px;right:72px;top:50%;transform:translateY(-50%);text-align:center;'
        : block === 'top'
          ? 'left:72px;right:72px;top:120px;text-align:' + align + ';'
          : 'left:72px;right:72px;bottom:110px;text-align:' + align + ';';
    const mark = m.replace(/#FFD600/g, accent).replace(/#0a0a0b/g, accentDark);
    return {
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:${cardBg};}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;${photoFilter}}.scrim{position:absolute;inset:0;background:${scrim};}.copy{position:absolute;${pos}z-index:4;}.t-title{font-family:${titleFont};font-size:${titleSize};font-weight:800;color:${titleColor};line-height:1.15;}.t-subtitle{margin-top:16px;font-size:21px;color:${subColor};line-height:1.45;}${mark}${extraCss}`,
      body: `<img class="t-photo" src="{{PHOTO}}" alt=""><div class="scrim"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    };
  };
}

function buildLayout(t) {
  const logo = logoCss(t.logo);
  const m = t.plainTitle ? '' : markCss(t.markSelectors || ['.t-title', '.t-subtitle', '.t-quote']);
  const slugFn = SLUG_LAYOUTS[t.slug];
  if (slugFn) return slugFn(logo, m, t);

  const builders = {
    'split-dark-green': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#0d1117;}.split{display:flex;position:absolute;inset:0;}.half{flex:1;position:relative;overflow:hidden;}.half img{width:100%;height:100%;object-fit:cover;}.overlay{position:absolute;inset:0;background:rgba(0,0,0,0.55);}.copy{position:absolute;left:0;right:0;bottom:0;padding:56px 64px 72px;background:linear-gradient(to top,rgba(0,0,0,0.92),transparent);z-index:4;}.t-title{font-family:'Barlow Condensed',sans-serif;font-size:52px;font-weight:800;color:#fff;line-height:1.1;text-transform:uppercase;}.t-subtitle{font-size:22px;color:#a7f3d0;margin-top:16px;line-height:1.45;}${m.replace(/#FFD600/g, '#34d399').replace(/#0a0a0b/g, '#052e16')}`,
      body: `<div class="split"><div class="half"><img src="{{PHOTO_LEFT}}" alt=""></div><div class="half"><img src="{{PHOTO_RIGHT}}" alt=""></div></div><div class="overlay"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    }),
    'grid4-title': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#0f172a;}.t-title{position:absolute;top:48px;left:56px;right:140px;font-family:'Inter',sans-serif;font-size:44px;font-weight:800;color:#f8fafc;z-index:5;line-height:1.15;}${m}.grid{position:absolute;left:40px;right:40px;top:160px;bottom:120px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:16px;}.cell{border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.35);}.cell img{width:100%;height:100%;object-fit:cover;}`,
      body: `<div class="t-title">{{TITLE}}</div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="grid"><div class="cell"><img src="{{PHOTO_1}}" alt=""></div><div class="cell"><img src="{{PHOTO_2}}" alt=""></div><div class="cell"><img src="{{PHOTO_3}}" alt=""></div><div class="cell"><img src="{{PHOTO_4}}" alt=""></div></div>`,
    }),
    'quote-serif': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#1c1917;}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}.veil{position:absolute;inset:0;background:rgba(28,25,23,0.55);}.t-quote{position:absolute;left:80px;right:80px;top:50%;transform:translateY(-58%);font-family:'Playfair Display',serif;font-size:46px;line-height:1.35;color:#fafaf9;text-align:center;z-index:3;}${m}.t-subtitle{position:absolute;left:64px;right:64px;bottom:110px;text-align:center;font-size:22px;color:#e7e5e4;letter-spacing:.08em;text-transform:uppercase;z-index:3;}`,
      body: `<img class="t-photo" src="{{PHOTO}}" alt=""><div class="veil"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="t-quote">{{QUOTE}}</div><div class="t-subtitle">{{SUBTITLE}}</div>`,
    }),
    'cream-box': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#365314;}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}.shade{position:absolute;inset:0;background:rgba(54,83,20,0.25);}.box{position:absolute;left:80px;right:80px;top:50%;transform:translateY(-50%);background:#fefce8;border-radius:20px;padding:52px 48px;box-shadow:0 20px 50px rgba(0,0,0,0.25);z-index:3;}.t-title{font-family:'Playfair Display',serif;font-size:44px;color:#1c1917;line-height:1.2;}.t-subtitle{margin-top:16px;font-size:20px;color:#57534e;line-height:1.5;}${m.replace(/#FFD600/g, '#84cc16').replace(/#0a0a0b/g, '#1a2e05')}`,
      body: `<img class="t-photo" src="{{PHOTO}}" alt=""><div class="shade"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="box"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    }),
    'split-gradient-yellow': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#111;}.split{display:flex;position:absolute;inset:0;}.half{flex:1;overflow:hidden;}.half img{width:100%;height:100%;object-fit:cover;}.copy{position:absolute;left:0;right:0;bottom:0;padding:64px 72px 80px;background:linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.4) 70%,transparent 100%);z-index:4;}.t-title{font-family:'Barlow Condensed',sans-serif;font-size:50px;font-weight:800;color:#fff;line-height:1.1;}.t-subtitle{margin-top:14px;font-size:21px;color:#fef3c7;line-height:1.45;}${m}`,
      body: `<div class="split"><div class="half"><img src="{{PHOTO_LEFT}}" alt=""></div><div class="half"><img src="{{PHOTO_RIGHT}}" alt=""></div></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    }),
    'drone-vignette': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#0f172a;}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}.vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 35%,rgba(15,23,42,0.85) 100%),linear-gradient(to top,rgba(15,23,42,0.9),transparent 50%);}.copy{position:absolute;left:72px;right:72px;bottom:120px;z-index:4;}.t-title{font-family:'Inter',sans-serif;font-size:48px;font-weight:700;color:#fff;line-height:1.15;}.t-subtitle{margin-top:16px;font-size:22px;color:#cbd5e1;line-height:1.45;}`,
      body: `<img class="t-photo" src="{{PHOTO}}" alt=""><div class="vig"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    }),
    'split-teal': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#0f172a;}.split{display:flex;position:absolute;inset:0;}.half{flex:1;overflow:hidden;}.half img{width:100%;height:100%;object-fit:cover;}.copy{position:absolute;left:0;right:0;bottom:0;padding:56px 64px 72px;background:linear-gradient(to top,rgba(15,23,42,0.95),transparent);z-index:4;}.t-title{font-family:'Inter',sans-serif;font-size:48px;font-weight:800;color:#fff;line-height:1.12;}.t-subtitle{margin-top:14px;font-size:21px;color:#99f6e4;line-height:1.45;}${m.replace(/#FFD600/g, '#2dd4bf').replace(/#0a0a0b/g, '#134e4a')}`,
      body: `<div class="split"><div class="half"><img src="{{PHOTO_LEFT}}" alt=""></div><div class="half"><img src="{{PHOTO_RIGHT}}" alt=""></div></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    }),
    'split-gold': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#0c4a6e;}.split{display:flex;position:absolute;inset:0;}.half{flex:1;overflow:hidden;}.half img{width:100%;height:100%;object-fit:cover;}.copy{position:absolute;left:0;right:0;bottom:0;padding:56px 64px 72px;background:linear-gradient(to top,rgba(12,74,110,0.95),transparent);z-index:4;}.t-title{font-family:'Cormorant Garamond',serif;font-size:52px;font-weight:700;color:#fff;line-height:1.1;}.t-subtitle{margin-top:14px;font-size:21px;color:#fde68a;line-height:1.45;}${m.replace(/#FFD600/g, '#d4af37').replace(/#0a0a0b/g, '#422006')}`,
      body: `<div class="split"><div class="half"><img src="{{PHOTO_LEFT}}" alt=""></div><div class="half"><img src="{{PHOTO_RIGHT}}" alt=""></div></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    }),
    'split-cyber': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#09090b;}.split{display:flex;position:absolute;inset:0;}.half{flex:1;overflow:hidden;}.half img{width:100%;height:100%;object-fit:cover;}.copy{position:absolute;left:0;right:0;bottom:0;padding:56px 64px 72px;background:linear-gradient(to top,rgba(9,9,11,0.96),transparent);z-index:4;}.t-title{font-family:'JetBrains Mono',monospace;font-size:42px;font-weight:700;color:#fafafa;line-height:1.15;}.t-subtitle{margin-top:14px;font-size:20px;color:#fca5a5;line-height:1.45;}${m.replace(/#FFD600/g, '#ef4444').replace(/#0a0a0b/g, '#450a0a')}`,
      body: `<div class="split"><div class="half"><img src="{{PHOTO_LEFT}}" alt=""></div><div class="half"><img src="{{PHOTO_RIGHT}}" alt=""></div></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    }),
    'split-cyan': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#0f172a;}.split{display:flex;position:absolute;inset:0;}.half{flex:1;overflow:hidden;}.half img{width:100%;height:100%;object-fit:cover;}.copy{position:absolute;left:0;right:0;bottom:0;padding:56px 64px 72px;background:linear-gradient(to top,rgba(15,23,42,0.95),transparent);z-index:4;}.t-title{font-family:'Inter',sans-serif;font-size:44px;font-weight:800;color:#f8fafc;line-height:1.12;}.t-subtitle{margin-top:14px;font-size:21px;color:#67e8f9;line-height:1.45;}${m.replace(/#FFD600/g, '#22d3ee').replace(/#0a0a0b/g, '#083344')}`,
      body: `<div class="split"><div class="half"><img src="{{PHOTO_LEFT}}" alt=""></div><div class="half"><img src="{{PHOTO_RIGHT}}" alt=""></div></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    }),
    'grid4-sand': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#fef3c7;}.t-title{position:absolute;top:48px;left:56px;right:140px;font-family:'Inter',sans-serif;font-size:40px;font-weight:800;color:#78350f;z-index:5;line-height:1.15;}${m.replace(/#FFD600/g, '#d97706').replace(/#0a0a0b/g, '#fffbeb')}.grid{position:absolute;left:40px;right:40px;top:160px;bottom:120px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:14px;}.cell{border-radius:16px;overflow:hidden;border:3px solid #fde68a;box-shadow:0 8px 24px rgba(120,53,15,0.15);}.cell img{width:100%;height:100%;object-fit:cover;}`,
      body: `<div class="t-title">{{TITLE}}</div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="grid"><div class="cell"><img src="{{PHOTO_1}}" alt=""></div><div class="cell"><img src="{{PHOTO_2}}" alt=""></div><div class="cell"><img src="{{PHOTO_3}}" alt=""></div><div class="cell"><img src="{{PHOTO_4}}" alt=""></div></div>`,
    }),
    'grid4-steel': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#1e293b;}.t-title{position:absolute;top:48px;left:56px;right:140px;font-family:'Barlow Condensed',sans-serif;font-size:44px;font-weight:800;color:#f1f5f9;z-index:5;line-height:1.15;}${m.replace(/#FFD600/g, '#94a3b8')}.grid{position:absolute;left:40px;right:40px;top:160px;bottom:120px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;}.cell{border-radius:14px;overflow:hidden;border:2px solid #475569;}.cell img{width:100%;height:100%;object-fit:cover;}`,
      body: `<div class="t-title">{{TITLE}}</div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="grid"><div class="cell"><img src="{{PHOTO_1}}" alt=""></div><div class="cell"><img src="{{PHOTO_2}}" alt=""></div><div class="cell"><img src="{{PHOTO_3}}" alt=""></div><div class="cell"><img src="{{PHOTO_4}}" alt=""></div></div>`,
    }),
    'grid4-ice': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#0c4a6e;}.t-title{position:absolute;top:48px;left:56px;right:140px;font-family:'Inter',sans-serif;font-size:40px;font-weight:800;color:#e0f2fe;z-index:5;line-height:1.15;}${m.replace(/#FFD600/g, '#38bdf8')}.grid{position:absolute;left:40px;right:40px;top:160px;bottom:120px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;}.cell{border-radius:16px;overflow:hidden;border:2px solid rgba(56,189,248,0.35);}.cell img{width:100%;height:100%;object-fit:cover;}`,
      body: `<div class="t-title">{{TITLE}}</div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="grid"><div class="cell"><img src="{{PHOTO_1}}" alt=""></div><div class="cell"><img src="{{PHOTO_2}}" alt=""></div><div class="cell"><img src="{{PHOTO_3}}" alt=""></div><div class="cell"><img src="{{PHOTO_4}}" alt=""></div></div>`,
    }),
    'grid4-warm': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#431407;}.t-title{position:absolute;top:48px;left:56px;right:140px;font-family:'Inter',sans-serif;font-size:40px;font-weight:800;color:#ffedd5;z-index:5;line-height:1.15;}${m.replace(/#FFD600/g, '#fb923c')}.grid{position:absolute;left:40px;right:40px;top:160px;bottom:120px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;}.cell{border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.4);}.cell img{width:100%;height:100%;object-fit:cover;}`,
      body: `<div class="t-title">{{TITLE}}</div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="grid"><div class="cell"><img src="{{PHOTO_1}}" alt=""></div><div class="cell"><img src="{{PHOTO_2}}" alt=""></div><div class="cell"><img src="{{PHOTO_3}}" alt=""></div><div class="cell"><img src="{{PHOTO_4}}" alt=""></div></div>`,
    }),
    'grid4-muted': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#dbeafe;}.t-title{position:absolute;top:48px;left:56px;right:140px;font-family:'Inter',sans-serif;font-size:40px;font-weight:800;color:#1e3a8a;z-index:5;line-height:1.15;}${m.replace(/#FFD600/g, '#60a5fa')}.grid{position:absolute;left:40px;right:40px;top:160px;bottom:120px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;}.cell{border-radius:16px;overflow:hidden;border:3px solid #93c5fd;}.cell img{width:100%;height:100%;object-fit:cover;}`,
      body: `<div class="t-title">{{TITLE}}</div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="grid"><div class="cell"><img src="{{PHOTO_1}}" alt=""></div><div class="cell"><img src="{{PHOTO_2}}" alt=""></div><div class="cell"><img src="{{PHOTO_3}}" alt=""></div><div class="cell"><img src="{{PHOTO_4}}" alt=""></div></div>`,
    }),
    'grid4-charcoal': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#171717;}.t-title{position:absolute;top:48px;left:56px;right:140px;font-family:'JetBrains Mono',monospace;font-size:38px;font-weight:700;color:#fef08a;z-index:5;line-height:1.15;}${m.replace(/#FFD600/g, '#facc15')}.grid{position:absolute;left:40px;right:40px;top:160px;bottom:120px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;}.cell{border-radius:12px;overflow:hidden;border:2px solid #404040;}.cell img{width:100%;height:100%;object-fit:cover;}`,
      body: `<div class="t-title">{{TITLE}}</div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="grid"><div class="cell"><img src="{{PHOTO_1}}" alt=""></div><div class="cell"><img src="{{PHOTO_2}}" alt=""></div><div class="cell"><img src="{{PHOTO_3}}" alt=""></div><div class="cell"><img src="{{PHOTO_4}}" alt=""></div></div>`,
    }),
    'grid4-slate': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#334155;}.t-title{position:absolute;top:48px;left:56px;right:140px;font-family:'Inter',sans-serif;font-size:40px;font-weight:800;color:#f8fafc;z-index:5;line-height:1.15;}${m.replace(/#FFD600/g, '#a78bfa')}.grid{position:absolute;left:40px;right:40px;top:160px;bottom:120px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;}.cell{border-radius:16px;overflow:hidden;border:2px solid #64748b;}.cell img{width:100%;height:100%;object-fit:cover;}`,
      body: `<div class="t-title">{{TITLE}}</div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="grid"><div class="cell"><img src="{{PHOTO_1}}" alt=""></div><div class="cell"><img src="{{PHOTO_2}}" alt=""></div><div class="cell"><img src="{{PHOTO_3}}" alt=""></div><div class="cell"><img src="{{PHOTO_4}}" alt=""></div></div>`,
    }),
    'grid4-light': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#f1f5f9;}.t-title{position:absolute;top:48px;left:56px;right:140px;font-family:'Inter',sans-serif;font-size:40px;font-weight:800;color:#0f172a;z-index:5;line-height:1.15;}${m.replace(/#FFD600/g, '#64748b')}.grid{position:absolute;left:40px;right:40px;top:160px;bottom:120px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;}.cell{border-radius:16px;overflow:hidden;border:2px solid #cbd5e1;}.cell img{width:100%;height:100%;object-fit:cover;}`,
      body: `<div class="t-title">{{TITLE}}</div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="grid"><div class="cell"><img src="{{PHOTO_1}}" alt=""></div><div class="cell"><img src="{{PHOTO_2}}" alt=""></div><div class="cell"><img src="{{PHOTO_3}}" alt=""></div><div class="cell"><img src="{{PHOTO_4}}" alt=""></div></div>`,
    }),
    'grid4-tan': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#78716c;}.t-title{position:absolute;top:48px;left:56px;right:140px;font-family:'Inter',sans-serif;font-size:40px;font-weight:800;color:#fafaf9;z-index:5;line-height:1.15;}${m.replace(/#FFD600/g, '#d6d3d1')}.grid{position:absolute;left:40px;right:40px;top:160px;bottom:120px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;}.cell{border-radius:16px;overflow:hidden;border:2px solid #a8a29e;}.cell img{width:100%;height:100%;object-fit:cover;}`,
      body: `<div class="t-title">{{TITLE}}</div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="grid"><div class="cell"><img src="{{PHOTO_1}}" alt=""></div><div class="cell"><img src="{{PHOTO_2}}" alt=""></div><div class="cell"><img src="{{PHOTO_3}}" alt=""></div><div class="cell"><img src="{{PHOTO_4}}" alt=""></div></div>`,
    }),
  };

  const fn = builders[t.layout];
  if (!fn) throw new Error(`Unknown layout: ${t.layout} for ${t.file}`);
  return fn();
}

const SLUG_LAYOUTS = {
  'neuro-play-room': makeHero({ cardBg: '#fefce8', scrim: 'linear-gradient(to top,rgba(254,252,232,0.92),rgba(236,253,245,0.35))', titleColor: '#1c1917', subColor: '#57534e', accent: '#86efac', accentDark: '#14532d', titleFont: "'Playfair Display',serif", block: 'center', align: 'center' }),
  'pediatric-biome-strategy': makeHero({ cardBg: '#ecfdf5', scrim: 'linear-gradient(to top,rgba(255,255,255,0.88),rgba(236,253,245,0.4))', titleColor: '#1c1917', subColor: '#44403c', accent: '#a3e635', accentDark: '#365314', titleFont: "'Playfair Display',serif", block: 'center', align: 'center' }),
  'scholarship-prompt-hacking': makeHero({ cardBg: '#0a0a0b', scrim: 'linear-gradient(to top,rgba(10,10,11,0.95),rgba(88,28,135,0.35))', titleColor: '#fafafa', subColor: '#d8b4fe', accent: '#a855f7', accentDark: '#3b0764', titleFont: "'JetBrains Mono',monospace", block: 'bottom', photoFilter: 'brightness(0.45)' }),
  'digital-fashion-reselling': makeHero({ cardBg: '#0a0a0b', scrim: 'radial-gradient(circle at 50% 40%,rgba(236,72,153,0.45),rgba(10,10,11,0.92))', titleColor: '#fdf4ff', subColor: '#f0abfc', accent: '#ec4899', accentDark: '#500724', titleFont: "'Barlow Condensed',sans-serif", titleSize: '52px', block: 'center', align: 'center' }),
  'corporate-saas-exit': makeHero({ cardBg: '#0f172a', scrim: 'linear-gradient(to top,rgba(15,23,42,0.92),rgba(30,58,138,0.35))', titleColor: '#fff', subColor: '#cbd5e1', accent: '#84cc16', accentDark: '#14532d', block: 'bottom' }),
  'fertility-nutrition-longevity': makeHero({ cardBg: '#fefce8', scrim: 'linear-gradient(to top,rgba(254,252,232,0.9),rgba(254,243,199,0.35))', titleColor: '#1c1917', subColor: '#57534e', accent: '#84cc16', accentDark: '#365314', titleFont: "'Playfair Display',serif", block: 'center', align: 'center' }),
  'dynasty-trust-legacy': makeHero({ cardBg: '#292524', scrim: 'linear-gradient(to top,rgba(41,37,36,0.88),transparent)', titleColor: '#fafaf9', subColor: '#d6d3d1', accent: '#d6d3d1', accentDark: '#1c1917', titleFont: "'Playfair Display',serif", titleSize: '50px', block: 'center', align: 'center' }),
  'cold-chain-shipping': makeHero({ cardBg: '#020617', scrim: 'linear-gradient(to top,rgba(2,6,23,0.92),rgba(14,165,233,0.25))', titleColor: '#e0f2fe', subColor: '#7dd3fc', accent: '#0ea5e9', accentDark: '#082f49', block: 'bottom' }),
  'micro-hydro-turbine': makeHero({ cardBg: '#14532d', scrim: 'linear-gradient(to top,rgba(20,83,45,0.75),rgba(34,197,94,0.15))', titleColor: '#fff', subColor: '#dcfce7', accent: '#4ade80', accentDark: '#052e16', block: 'bottom', extraCss: '.copy{text-shadow:0 2px 12px rgba(0,0,0,0.5);}' }),
  'jewelry-gold-casting': makeHero({ cardBg: '#1c1917', scrim: 'linear-gradient(to top,rgba(28,25,23,0.88),rgba(234,88,12,0.25))', titleColor: '#fff7ed', subColor: '#fed7aa', accent: '#fbbf24', accentDark: '#78350f', titleFont: "'Cormorant Garamond',serif", titleSize: '52px', block: 'bottom' }),
  'tbi-recovery-protocols': makeHero({ cardBg: '#0a0a0b', scrim: 'linear-gradient(135deg,rgba(88,28,135,0.55),rgba(10,10,11,0.92))', titleColor: '#f5f3ff', subColor: '#ddd6fe', accent: '#a78bfa', accentDark: '#4c1d95', block: 'bottom' }),
  'hypoxic-adaptation-training': makeHero({ cardBg: '#450a0a', scrim: 'linear-gradient(to top,rgba(69,10,10,0.9),rgba(220,38,38,0.25))', titleColor: '#fff', subColor: '#fecaca', accent: '#ef4444', accentDark: '#450a0a', block: 'bottom' }),
  'mineral-rights-acquisition': makeHero({ cardBg: '#422006', scrim: 'linear-gradient(to top,rgba(66,32,6,0.92),rgba(251,191,36,0.2))', titleColor: '#fffbeb', subColor: '#fde68a', accent: '#fbbf24', accentDark: '#78350f', block: 'bottom' }),
  'car-wash-portfolio': makeHero({ cardBg: '#1e1b4b', scrim: 'linear-gradient(135deg,rgba(124,58,237,0.45),rgba(30,27,75,0.92))', titleColor: '#faf5ff', subColor: '#e9d5ff', accent: '#c084fc', accentDark: '#581c87', block: 'bottom' }),
  'serverless-cloud-architecture': makeHero({ cardBg: '#020617', scrim: 'linear-gradient(to top,rgba(2,6,23,0.95),rgba(6,182,212,0.2))', titleColor: '#ecfeff', subColor: '#67e8f9', accent: '#22d3ee', accentDark: '#083344', titleFont: "'JetBrains Mono',monospace", block: 'bottom' }),
  'self-hosted-data-warehouse': makeHero({ cardBg: '#020617', scrim: 'linear-gradient(to top,rgba(2,6,23,0.92),rgba(37,99,235,0.3))', titleColor: '#dbeafe', subColor: '#93c5fd', accent: '#3b82f6', accentDark: '#1e3a8a', block: 'bottom' }),
  'exoplanet-spectroscopy': makeHero({ cardBg: '#000', scrim: 'radial-gradient(circle at 60% 40%,rgba(59,130,246,0.35),rgba(0,0,0,0.92))', titleColor: '#e0f2fe', subColor: '#bae6fd', accent: '#38bdf8', accentDark: '#0c4a6e', block: 'bottom', photoFilter: 'contrast(1.1)' }),
  'white-dwarf-crystallization': makeHero({ cardBg: '#000', scrim: 'radial-gradient(circle at 50% 50%,rgba(59,130,246,0.25),rgba(0,0,0,0.95))', titleColor: '#f8fafc', subColor: '#cbd5e1', accent: '#94a3b8', accentDark: '#0f172a', titleFont: "'Playfair Display',serif", block: 'center', align: 'center' }),
  'icebreaker-polar-navigation': makeHero({ cardBg: '#0c4a6e', scrim: 'linear-gradient(to top,rgba(12,74,110,0.85),rgba(255,255,255,0.15))', titleColor: '#fff', subColor: '#fecaca', accent: '#ef4444', accentDark: '#450a0a', titleSize: '48px', block: 'bottom' }),
  'deep-cave-speleology': makeHero({ cardBg: '#0a0a0b', scrim: 'linear-gradient(to top,rgba(10,10,11,0.92),rgba(234,179,8,0.15))', titleColor: '#fff', subColor: '#fef08a', accent: '#eab308', accentDark: '#422006', block: 'bottom', photoFilter: 'brightness(0.55)' }),
  'non-executive-board-seating': makeHero({ cardBg: '#1c1917', scrim: 'linear-gradient(to top,rgba(28,25,23,0.9),rgba(127,29,29,0.25))', titleColor: '#fff', subColor: '#d6d3d1', accent: '#991b1b', accentDark: '#fff', block: 'bottom' }),
};

const SPLIT_FIELDS = ['PHOTO_LEFT', 'PHOTO_RIGHT', 'TITLE', 'SUBTITLE', 'LOGO'];
const GRID_FIELDS = ['PHOTO_1', 'PHOTO_2', 'PHOTO_3', 'PHOTO_4', 'TITLE', 'LOGO'];
const HERO_FIELDS = ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'];

const TEMPLATES = [
  // Kids & Parents (1–4)
  { slug: 'neuro-play-room', file: 'template-neuro-play-room.html', id: 'neuro-play-room-card', name: 'Neuro-Play Room Architecture', category: 'living', layout: null, logo: 'tr', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'newborn-micro-investment', file: 'template-newborn-micro-investment.html', id: 'newborn-micro-investment-card', name: 'Micro-Investment Funds for Newborns', category: 'finance', layout: 'split-gold', logo: 'br', plainTitle: false, fields: SPLIT_FIELDS },
  { slug: 'computational-literacy-kids', file: 'template-computational-literacy-kids.html', id: 'computational-literacy-kids-card', name: 'Early Childhood Computational Literacy', category: 'tech', layout: 'grid4-muted', logo: 'tl', plainTitle: false, fields: GRID_FIELDS },
  { slug: 'pediatric-biome-strategy', file: 'template-pediatric-biome-strategy.html', id: 'pediatric-biome-strategy-card', name: 'Non-Toxic Pediatric Biome Strategy', category: 'health', layout: null, logo: 'bl', plainTitle: false, fields: HERO_FIELDS },
  // Teens & Gen Z (5–8)
  { slug: 'scholarship-prompt-hacking', file: 'template-scholarship-prompt-hacking.html', id: 'scholarship-prompt-hacking-card', name: 'AI-Assisted Scholarship Hacking', category: 'tech', layout: null, logo: 'tr', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'micro-agency-solopreneur', file: 'template-micro-agency-solopreneur.html', id: 'micro-agency-solopreneur-card', name: 'Micro-Agency Solopreneurship', category: 'productivity', layout: 'split-teal', logo: 'tl', plainTitle: false, fields: SPLIT_FIELDS },
  { slug: 'digital-fashion-reselling', file: 'template-digital-fashion-reselling.html', id: 'digital-fashion-reselling-card', name: 'Reselling Rare Digital Fashion Assets', category: 'collectibles', layout: null, logo: 'br', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'indie-game-micro-funding', file: 'template-indie-game-micro-funding.html', id: 'indie-game-micro-funding-card', name: 'Indie Game Dev Micro-Funding', category: 'pop-culture', layout: 'grid4-charcoal', logo: 'tr', plainTitle: false, fields: GRID_FIELDS },
  // 30s (9–12)
  { slug: 'corporate-saas-exit', file: 'template-corporate-saas-exit.html', id: 'corporate-saas-exit-card', name: 'B2B SaaS Corporate Exit Blueprints', category: 'b2b-saas', layout: null, logo: 'tl', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'fertility-nutrition-longevity', file: 'template-fertility-nutrition-longevity.html', id: 'fertility-nutrition-longevity-card', name: 'Functional Fertility Nutrition', category: 'health', layout: null, logo: 'br', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'multifamily-syndication-30s', file: 'template-multifamily-syndication-30s.html', id: 'multifamily-syndication-30s-card', name: 'Custom Real Estate Syndication', category: 'real-estate', layout: 'split-gradient-yellow', logo: 'tr', plainTitle: false, fields: SPLIT_FIELDS },
  { slug: 'digital-nomad-family', file: 'template-digital-nomad-family.html', id: 'digital-nomad-family-card', name: 'Digital Nomad Family Logistics', category: 'adventure-travel', layout: 'grid4-sand', logo: 'tl', plainTitle: false, fields: GRID_FIELDS },
  // 60s+ (13–16)
  { slug: 'dynasty-trust-legacy', file: 'template-dynasty-trust-legacy.html', id: 'dynasty-trust-legacy-card', name: 'High-Asset Legacy & Trust Engineering', category: 'finance', layout: null, logo: 'bl', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'senior-joint-ergonomics', file: 'template-senior-joint-ergonomics.html', id: 'senior-joint-ergonomics-card', name: 'Senior Longevity Joint Ergonomics', category: 'longevity', layout: 'split-cyan', logo: 'tr', plainTitle: false, fields: SPLIT_FIELDS },
  { slug: 'luxury-rv-retirement', file: 'template-luxury-rv-retirement.html', id: 'luxury-rv-retirement-card', name: 'Premium Off-Grid RV Communities', category: 'adventure-travel', layout: 'grid4-warm', logo: 'tl', plainTitle: false, fields: GRID_FIELDS },
  { slug: 'non-executive-board-seating', file: 'template-non-executive-board-seating.html', id: 'non-executive-board-seating-card', name: 'Late-Career Board Seating', category: 'work-culture', layout: null, logo: 'tr', plainTitle: false, fields: HERO_FIELDS },
  // Industrial & Trade (17–20)
  { slug: 'cold-chain-shipping', file: 'template-cold-chain-shipping.html', id: 'cold-chain-shipping-card', name: 'Custom Cold-Chain Shipping Logistics', category: 'b2b-saas', layout: null, logo: 'bl', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'yacht-charter-brokerage', file: 'template-yacht-charter-brokerage.html', id: 'yacht-charter-brokerage-card', name: 'Luxury Yacht Charter Brokerage', category: 'luxury-hobbies', layout: 'split-gold', logo: 'tr', plainTitle: false, fields: SPLIT_FIELDS },
  { slug: 'cnc-precision-manufacturing', file: 'template-cnc-precision-manufacturing.html', id: 'cnc-precision-manufacturing-card', name: 'Precision CNC Machinery Manufacturing', category: 'artisans', layout: 'grid4-steel', logo: 'tl', plainTitle: false, fields: GRID_FIELDS },
  { slug: 'micro-hydro-turbine', file: 'template-micro-hydro-turbine.html', id: 'micro-hydro-turbine-card', name: 'Micro-Hydro Turbine Installation', category: 'science', layout: null, logo: 'br', plainTitle: false, fields: HERO_FIELDS },
  // Creative (21–24)
  { slug: 'jewelry-gold-casting', file: 'template-jewelry-gold-casting.html', id: 'jewelry-gold-casting-card', name: 'Fine Jewelry Casting & Metallurgy', category: 'artisans', layout: null, logo: 'tl', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'architectural-lighting-design', file: 'template-architectural-lighting-design.html', id: 'architectural-lighting-design-card', name: 'Architectural Lighting Design', category: 'creative', layout: 'split-dark-green', logo: 'tr', plainTitle: false, fields: SPLIT_FIELDS },
  { slug: 'japanese-wood-joinery', file: 'template-japanese-wood-joinery.html', id: 'japanese-wood-joinery-card', name: 'Japanese Wood Joinery Culture', category: 'artisans', layout: 'grid4-tan', logo: 'bl', plainTitle: false, fields: GRID_FIELDS },
  { slug: 'oil-painting-conservation', file: 'template-oil-painting-conservation.html', id: 'oil-painting-conservation-card', name: 'Museum-Grade Oil Painting Conservation', category: 'creative', layout: null, logo: 'tr', plainTitle: false, fields: HERO_FIELDS, markSelectors: ['.t-title', '.t-subtitle'] },
  // Medicine (25–28)
  { slug: 'tbi-recovery-protocols', file: 'template-tbi-recovery-protocols.html', id: 'tbi-recovery-protocols-card', name: 'Traumatic Brain Injury Recovery', category: 'health', layout: null, logo: 'tl', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'executive-vocal-health', file: 'template-executive-vocal-health.html', id: 'executive-vocal-health-card', name: 'Executive Vocal Cord Health', category: 'health', layout: 'split-cyan', logo: 'tr', plainTitle: false, fields: SPLIT_FIELDS },
  { slug: 'sensory-integration-therapy', file: 'template-sensory-integration-therapy.html', id: 'sensory-integration-therapy-card', name: 'Pediatric Sensory Integration', category: 'health', layout: 'grid4-muted', logo: 'br', plainTitle: false, fields: GRID_FIELDS },
  { slug: 'hypoxic-adaptation-training', file: 'template-hypoxic-adaptation-training.html', id: 'hypoxic-adaptation-training-card', name: 'High-Altitude Hypoxic Training', category: 'longevity', layout: null, logo: 'tl', plainTitle: false, fields: HERO_FIELDS },
  // Finance (29–32)
  { slug: 'mineral-rights-acquisition', file: 'template-mineral-rights-acquisition.html', id: 'mineral-rights-acquisition-card', name: 'High-Yield Mineral Rights Acquisition', category: 'investing', layout: null, logo: 'tr', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'expired-domain-flipping', file: 'template-expired-domain-flipping.html', id: 'expired-domain-flipping-card', name: 'Flipping Expired Domain Portfolios', category: 'finance', layout: 'split-teal', logo: 'tl', plainTitle: false, fields: SPLIT_FIELDS },
  { slug: 'orchid-hybrid-cultivation', file: 'template-orchid-hybrid-cultivation.html', id: 'orchid-hybrid-cultivation-card', name: 'Rare Orchid Hybrid Cultivation', category: 'collectibles', layout: 'grid4-slate', logo: 'br', plainTitle: false, fields: GRID_FIELDS },
  { slug: 'car-wash-portfolio', file: 'template-car-wash-portfolio.html', id: 'car-wash-portfolio-card', name: 'Automated Car Wash Portfolios', category: 'investing', layout: null, logo: 'tr', plainTitle: false, fields: HERO_FIELDS },
  // B2B Software (33–36)
  { slug: 'serverless-cloud-architecture', file: 'template-serverless-cloud-architecture.html', id: 'serverless-cloud-architecture-card', name: 'Serverless Cloud Cost Architecture', category: 'b2b-saas', layout: null, logo: 'tl', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'penetration-testing-cyber', file: 'template-penetration-testing-cyber.html', id: 'penetration-testing-cyber-card', name: 'Enterprise Cybersecurity Pen Testing', category: 'tech', layout: 'split-cyber', logo: 'tr', plainTitle: false, fields: SPLIT_FIELDS },
  { slug: 'ecommerce-checkout-ui', file: 'template-ecommerce-checkout-ui.html', id: 'ecommerce-checkout-ui-card', name: 'High-Conversion Checkout UI', category: 'b2b-saas', layout: 'grid4-light', logo: 'tl', plainTitle: false, fields: GRID_FIELDS },
  { slug: 'self-hosted-data-warehouse', file: 'template-self-hosted-data-warehouse.html', id: 'self-hosted-data-warehouse-card', name: 'Privacy-First Data Warehousing', category: 'tech', layout: null, logo: 'br', plainTitle: false, fields: HERO_FIELDS },
  // Cosmic Science (37–40)
  { slug: 'exoplanet-spectroscopy', file: 'template-exoplanet-spectroscopy.html', id: 'exoplanet-spectroscopy-card', name: 'Exoplanet Atmospheric Spectroscopy', category: 'space', layout: null, logo: 'tl', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'hypernova-gamma-burst', file: 'template-hypernova-gamma-burst.html', id: 'hypernova-gamma-burst-card', name: 'Hypernova Gamma Ray Burst Physics', category: 'space', layout: 'split-cyber', logo: 'tr', plainTitle: false, fields: SPLIT_FIELDS },
  { slug: 'europa-ocean-chemistry', file: 'template-europa-ocean-chemistry.html', id: 'europa-ocean-chemistry-card', name: 'Sub-Surface Ocean Chemistry on Europa', category: 'science', layout: 'grid4-ice', logo: 'bl', plainTitle: false, fields: GRID_FIELDS },
  { slug: 'white-dwarf-crystallization', file: 'template-white-dwarf-crystallization.html', id: 'white-dwarf-crystallization-card', name: 'White Dwarf Stellar Crystallization', category: 'space', layout: null, logo: 'tr', plainTitle: false, fields: HERO_FIELDS },
  // Extreme Lifestyles (41–44)
  { slug: 'icebreaker-polar-navigation', file: 'template-icebreaker-polar-navigation.html', id: 'icebreaker-polar-navigation-card', name: 'Professional Icebreaker Navigation', category: 'extreme-lifestyles', layout: null, logo: 'tr', plainTitle: false, fields: HERO_FIELDS },
  { slug: 'high-altitude-weather-station', file: 'template-high-altitude-weather-station.html', id: 'high-altitude-weather-station-card', name: 'High-Altitude Weather Station Logistics', category: 'science', layout: 'split-cyan', logo: 'tl', plainTitle: false, fields: SPLIT_FIELDS },
  { slug: 'earthship-desert-architecture', file: 'template-earthship-desert-architecture.html', id: 'earthship-desert-architecture-card', name: 'Off-Grid Desert Earthship Architecture', category: 'living', layout: 'grid4-warm', logo: 'br', plainTitle: false, fields: GRID_FIELDS },
  { slug: 'deep-cave-speleology', file: 'template-deep-cave-speleology.html', id: 'deep-cave-speleology-card', name: 'Professional Deep Cave Speleology', category: 'extreme-lifestyles', layout: null, logo: 'tl', plainTitle: false, fields: HERO_FIELDS },
];

// Custom hero variants for quote-style and painting conservation
SLUG_LAYOUTS['oil-painting-conservation'] = (logo, m) => ({
  css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#1c1917;}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(0.65);}.scrim{position:absolute;inset:0;background:linear-gradient(to top,rgba(28,25,23,0.92),transparent 55%);}.copy{position:absolute;left:72px;right:72px;bottom:110px;z-index:4;}.t-title{font-family:'Playfair Display',serif;font-size:48px;font-weight:700;color:#fafaf9;line-height:1.15;}.t-subtitle{margin-top:16px;font-size:21px;color:#e7e5e4;line-height:1.45;}${m.replace(/#FFD600/g, '#d6d3d1').replace(/#0a0a0b/g, '#1c1917')}`,
  body: `<img class="t-photo" src="{{PHOTO}}" alt=""><div class="scrim"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
});

const font_map = {
  'quote-serif': 'family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;600;700',
  'split-dark-green': 'family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600',
  'split-gradient-yellow': 'family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600',
  default: 'family=Inter:wght@400;600;700;800&family=Barlow+Condensed:wght@700&family=JetBrains+Mono:wght@500;600&family=Playfair+Display:wght@500;600&family=Oswald:wght@600&family=Cormorant+Garamond:wght@600',
};

function resolveFonts(t) {
  if (t.layout && font_map[t.layout]) return font_map[t.layout];
  if (font_map[t.slug]) return font_map[t.slug];
  return font_map.default;
}

function generateHtml(t) {
  const { css, body } = buildLayout(t);
  const extraCss = css.includes('width:1080px;height:1080px') ? css : `.card{position:relative;width:1080px;height:1080px;}${css}`;
  return wrapHtml({ name: t.name, fontUrl: resolveFonts(t), extraCss, body });
}

function writeRegistry(entries) {
  const lines = entries.map((e) => {
    const fieldsStr = JSON.stringify(e.fields, null, 2).split('\n').map((l, i) => (i === 0 ? l : '    ' + l)).join('\n');
    return `  {
    file: '${e.file}',
    id: '${e.id}',
    name: ${JSON.stringify(e.name)},
    category: '${e.category}',
    previewBucket: 'square',
    fields: ${fieldsStr},
  }`;
  });
  fs.writeFileSync(REGISTRY_PATH, `export const AUDIENCE_TEMPLATE_REGISTRY = [\n${lines.join(',\n')},\n];\n`, 'utf8');
}

function main() {
  fs.mkdirSync(HTML_DIR, { recursive: true });
  const registry = [];
  for (const t of TEMPLATES) {
    fs.writeFileSync(path.join(HTML_DIR, t.file), generateHtml(t), 'utf8');
    registry.push({ file: t.file, id: t.id, name: t.name, category: t.category, fields: fieldDefs(t.fields) });
  }
  writeRegistry(registry);
  console.log(`Generated ${TEMPLATES.length} audience templates in ${HTML_DIR}`);
  console.log(`Registry: ${REGISTRY_PATH}`);
}

main();
