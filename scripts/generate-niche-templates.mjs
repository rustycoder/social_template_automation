import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../seed-data/templates');
const HTML_DIR = path.join(TEMPLATES_DIR, 'html');
const REGISTRY_PATH = path.join(TEMPLATES_DIR, 'nicheTemplateRegistry.js');

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
    'steps-keyboard': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#1a1a1e;}.bg-photo{position:absolute;inset:0;filter:blur(3px) brightness(0.45);}.bg-photo img{width:100%;height:100%;object-fit:cover;}.panel{position:absolute;left:72px;right:72px;top:140px;bottom:100px;background:#fff;border-radius:24px;padding:48px 44px;box-shadow:0 24px 60px rgba(0,0,0,0.35);z-index:3;}.t-title{font-family:'JetBrains Mono',monospace;font-size:38px;font-weight:700;color:#111;margin-bottom:36px;}.steps{display:grid;grid-template-columns:1fr 1fr;gap:22px;}.step{background:#f8fafc;border-radius:14px;padding:20px 18px;border-left:5px solid #f97316;font-size:17px;line-height:1.45;color:#334155;}.step mark{background:#fb923c;color:#111;padding:2px 6px;border-radius:2px;}.step .highlight-red{background:#ea580c;color:#fff;padding:2px 6px;border-radius:2px;}`,
      body: `<div class="bg-photo"><img src="{{PHOTO}}" alt=""></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="panel"><div class="t-title">{{TITLE}}</div><div class="steps"><div class="step">{{STEP1}}</div><div class="step">{{STEP2}}</div><div class="step">{{STEP3}}</div><div class="step">{{STEP4}}</div></div></div>`,
    }),
    'grid4-title': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#0f172a;}.t-title{position:absolute;top:48px;left:56px;right:140px;font-family:'Inter',sans-serif;font-size:44px;font-weight:800;color:#f8fafc;z-index:5;line-height:1.15;}${m}.grid{position:absolute;left:40px;right:40px;top:160px;bottom:120px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:16px;}.cell{border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.35);}.cell img{width:100%;height:100%;object-fit:cover;}`,
      body: `<div class="t-title">{{TITLE}}</div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="grid"><div class="cell"><img src="{{PHOTO_1}}" alt=""></div><div class="cell"><img src="{{PHOTO_2}}" alt=""></div><div class="cell"><img src="{{PHOTO_3}}" alt=""></div><div class="cell"><img src="{{PHOTO_4}}" alt=""></div></div>`,
    }),
    'quote-serif': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#1c1917;}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}.veil{position:absolute;inset:0;background:rgba(28,25,23,0.55);}.t-quote{position:absolute;left:80px;right:80px;top:50%;transform:translateY(-58%);font-family:'Playfair Display',serif;font-size:46px;line-height:1.35;color:#fafaf9;text-align:center;z-index:3;}${m}.t-subtitle{position:absolute;left:64px;right:64px;bottom:110px;text-align:center;font-size:22px;color:#e7e5e4;letter-spacing:.08em;text-transform:uppercase;z-index:3;}`,
      body: `<img class="t-photo" src="{{PHOTO}}" alt=""><div class="veil"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="t-quote">{{QUOTE}}</div><div class="t-subtitle">{{SUBTITLE}}</div>`,
    }),
    'glass-cosmic': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#030712;}.stars{position:absolute;inset:0;background:radial-gradient(circle at 20% 30%,#1e3a8a 0%,transparent 40%),radial-gradient(circle at 80% 70%,#7c3aed 0%,transparent 45%),#030712;}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.35;}.glass{position:absolute;left:90px;right:90px;top:50%;transform:translateY(-50%);padding:56px 52px;border-radius:28px;background:rgba(15,23,42,0.55);border:1px solid rgba(56,189,248,0.35);backdrop-filter:blur(12px);z-index:4;}.t-title{font-size:44px;font-weight:800;color:#e0f2fe;line-height:1.15;}.t-subtitle{margin-top:18px;font-size:21px;color:#bae6fd;line-height:1.5;}${m.replace(/#FFD600/g, '#38bdf8').replace(/#0a0a0b/g, '#0c4a6e')}`,
      body: `<div class="stars"></div><img class="t-photo" src="{{PHOTO}}" alt=""><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="glass"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    }),
    'split-gradient-yellow': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#111;}.split{display:flex;position:absolute;inset:0;}.half{flex:1;overflow:hidden;}.half img{width:100%;height:100%;object-fit:cover;}.copy{position:absolute;left:0;right:0;bottom:0;padding:64px 72px 80px;background:linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.4) 70%,transparent 100%);z-index:4;}.t-title{font-family:'Barlow Condensed',sans-serif;font-size:50px;font-weight:800;color:#fff;line-height:1.1;}.t-subtitle{margin-top:14px;font-size:21px;color:#fef3c7;line-height:1.45;}${m}`,
      body: `<div class="split"><div class="half"><img src="{{PHOTO_LEFT}}" alt=""></div><div class="half"><img src="{{PHOTO_RIGHT}}" alt=""></div></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    }),
    'split-labels': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#292524;}.hdr{position:absolute;top:0;left:0;right:0;padding:44px 120px 28px 56px;background:rgba(0,0,0,0.65);z-index:5;}.t-title{font-family:'Oswald',sans-serif;font-size:40px;color:#fff;letter-spacing:.06em;text-transform:uppercase;}${m}.split{display:flex;position:absolute;left:0;right:0;top:120px;bottom:0;}.half{flex:1;position:relative;overflow:hidden;}.half img{width:100%;height:100%;object-fit:cover;}.lbl{position:absolute;bottom:28px;left:24px;right:24px;padding:12px 16px;background:rgba(0,0,0,0.72);color:#fff;font-weight:700;font-size:20px;text-align:center;border-radius:10px;}`,
      body: `<div class="hdr"><div class="t-title">{{TITLE}}</div></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="split"><div class="half"><img src="{{PHOTO_LEFT}}" alt=""><div class="lbl">{{LEFT_LABEL}}</div></div><div class="half"><img src="{{PHOTO_RIGHT}}" alt=""><div class="lbl">{{RIGHT_LABEL}}</div></div></div>`,
    }),
    'cream-box': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#365314;}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}.shade{position:absolute;inset:0;background:rgba(54,83,20,0.25);}.box{position:absolute;left:80px;right:80px;top:50%;transform:translateY(-50%);background:#fefce8;border-radius:20px;padding:52px 48px;box-shadow:0 20px 50px rgba(0,0,0,0.25);z-index:3;}.t-title{font-family:'Playfair Display',serif;font-size:44px;color:#1c1917;line-height:1.2;}.t-subtitle{margin-top:16px;font-size:20px;color:#57534e;line-height:1.5;}${m.replace(/#FFD600/g, '#84cc16').replace(/#0a0a0b/g, '#1a2e05')}`,
      body: `<img class="t-photo" src="{{PHOTO}}" alt=""><div class="shade"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="box"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    }),
    'grid4-rating': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#0c4a6e;}.grid{position:absolute;inset:32px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;}.cell{border-radius:16px;overflow:hidden;}.cell img{width:100%;height:100%;object-fit:cover;}.overlay{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:420px;padding:32px 28px;background:rgba(15,23,42,0.88);border-radius:20px;border:1px solid rgba(255,255,255,0.15);z-index:6;text-align:center;}.t-title{font-size:32px;font-weight:800;color:#fff;margin-bottom:20px;line-height:1.2;}${m}.ratings{display:flex;gap:16px;justify-content:center;}.rate{flex:1;background:rgba(255,255,255,0.08);border-radius:12px;padding:14px 10px;}.rate-label{font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;}.rate-score{font-size:28px;font-weight:800;color:#38bdf8;margin-top:6px;}`,
      body: `<div class="grid"><div class="cell"><img src="{{PHOTO_1}}" alt=""></div><div class="cell"><img src="{{PHOTO_2}}" alt=""></div><div class="cell"><img src="{{PHOTO_3}}" alt=""></div><div class="cell"><img src="{{PHOTO_4}}" alt=""></div></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="overlay"><div class="t-title">{{TITLE}}</div><div class="ratings"><div class="rate"><div class="rate-label">{{RATING_1_LABEL}}</div><div class="rate-score">{{RATING_1_SCORE}}</div></div><div class="rate"><div class="rate-label">{{RATING_2_LABEL}}</div><div class="rate-score">{{RATING_2_SCORE}}</div></div></div></div>`,
    }),
    'drone-vignette': () => ({
      css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#0f172a;}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}.vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 35%,rgba(15,23,42,0.85) 100%),linear-gradient(to top,rgba(15,23,42,0.9),transparent 50%);}.copy{position:absolute;left:72px;right:72px;bottom:120px;z-index:4;}.t-title{font-family:'Inter',sans-serif;font-size:48px;font-weight:700;color:#fff;line-height:1.15;}.t-subtitle{margin-top:16px;font-size:22px;color:#cbd5e1;line-height:1.45;}`,
      body: `<img class="t-photo" src="{{PHOTO}}" alt=""><div class="vig"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
    }),
  };

  const fn = builders[t.layout];
  if (!fn) throw new Error(`Unknown layout: ${t.layout} for ${t.file}`);
  return fn();
}

const SLUG_LAYOUTS = {
  'restomod-porsche': (logo, m) => ({
    css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#0a0a0b;}.stripe{position:absolute;top:0;left:0;right:0;height:8px;background:linear-gradient(90deg,#dc2626,#991b1b);z-index:9;}.split{display:flex;position:absolute;inset:0;top:8px;}.half{flex:1;overflow:hidden;}.half img{width:100%;height:100%;object-fit:cover;}.grad{position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,0,0,0.75),transparent 60%);}.copy{position:absolute;left:56px;right:56px;bottom:72px;z-index:4;}.t-title{font-family:'Oswald',sans-serif;font-size:54px;color:#fff;text-transform:uppercase;}.t-subtitle{margin-top:12px;font-size:22px;color:#fecaca;}${m.replace(/#FFD600/g, '#ef4444')}`,
    body: `<div class="stripe"></div><div class="split"><div class="half"><img src="{{PHOTO_LEFT}}" alt=""></div><div class="half"><img src="{{PHOTO_RIGHT}}" alt=""></div></div><div class="grad"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
  }),
  'vintage-watch-collecting': (logo, m) => ({
    css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#1c1917;}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}.frame{position:absolute;inset:48px;border:2px solid rgba(212,175,55,0.55);border-radius:4px;z-index:2;}.copy{position:absolute;left:88px;right:88px;bottom:100px;z-index:4;}.t-title{font-family:'Cormorant Garamond',serif;font-size:56px;color:#faf5e6;line-height:1.1;}.t-subtitle{margin-top:14px;font-size:20px;color:#d4af37;letter-spacing:.12em;text-transform:uppercase;}${m.replace(/#FFD600/g, '#d4af37').replace(/#0a0a0b/g, '#1c1917')}`,
    body: `<img class="t-photo" src="{{PHOTO}}" alt=""><div class="frame"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
  }),
  'mechanical-keyboards': (logo, m) => ({
    css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#18181b;}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(0.5);}.glow{position:absolute;inset:0;background:linear-gradient(120deg,rgba(236,72,153,0.35),rgba(59,130,246,0.35));mix-blend-mode:screen;}.copy{position:absolute;left:64px;right:64px;top:50%;transform:translateY(-50%);z-index:4;}.t-title{font-family:'JetBrains Mono',monospace;font-size:42px;color:#f4f4f5;font-weight:700;}.t-subtitle{margin-top:18px;font-size:20px;color:#e4e4e7;line-height:1.5;}${m.replace(/#FFD600/g, '#a78bfa')}`,
    body: `<img class="t-photo" src="{{PHOTO}}" alt=""><div class="glow"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
  }),
  'audiophile-gear': (logo, m) => ({
    css: `${logo}.card{position:relative;width:1080px;height:1080px;background:#020617;}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}.scrim{position:absolute;inset:0;background:linear-gradient(to right,rgba(2,6,23,0.95) 0%,rgba(2,6,23,0.4) 55%,transparent 100%);}.copy{position:absolute;left:72px;top:50%;transform:translateY(-50%);max-width:520px;z-index:4;}.t-title{font-size:46px;font-weight:800;color:#e2e8f0;line-height:1.12;}.t-subtitle{margin-top:16px;font-size:20px;color:#7dd3fc;line-height:1.5;}${m.replace(/#FFD600/g, '#0ea5e9')}`,
    body: `<img class="t-photo" src="{{PHOTO}}" alt=""><div class="scrim"></div><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
  }),
  'whiskey-investment': (logo, m) => ({
    css: `${logo}.card{position:relative;width:1080px;height:1080px;background:linear-gradient(160deg,#78350f,#451a03);}.t-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.55;}.copy{position:absolute;left:72px;right:72px;bottom:96px;z-index:4;}.t-title{font-family:'Playfair Display',serif;font-size:50px;color:#fff7ed;line-height:1.15;}.t-subtitle{margin-top:14px;font-size:21px;color:#fed7aa;}${m}`,
    body: `<img class="t-photo" src="{{PHOTO}}" alt=""><div class="logo-slot"><img src="{{LOGO}}" alt=""></div><div class="copy"><div class="t-title">{{TITLE}}</div><div class="t-subtitle">{{SUBTITLE}}</div></div>`,
  }),
  'longevity-biohacking': makeHero({cardBg: '#f0fdf4', scrim: 'linear-gradient(to top,rgba(240,253,244,0.95),rgba(240,253,244,0.2))', titleColor: '#14532d', subColor: '#166534', accent: '#22c55e', accentDark: '#052e16', titleFont: "'Inter',sans-serif", block: 'bottom'}),
  'pediatric-neurodiversity': makeHero({cardBg: '#fdf2f8', scrim: 'linear-gradient(135deg,rgba(253,242,248,0.92),rgba(251,207,232,0.4))', titleColor: '#831843', subColor: '#9d174d', accent: '#f472b6', accentDark: '#500724', block: 'center', align: 'center'}),
  'athletic-sleep-optimization': makeHero({cardBg: '#0f172a', scrim: 'linear-gradient(to bottom,rgba(15,23,42,0.2),rgba(30,58,138,0.92))', titleColor: '#e0e7ff', subColor: '#a5b4fc', accent: '#818cf8', accentDark: '#1e1b4b', block: 'top'}),
  'executive-ergonomics': makeHero({cardBg: '#1e293b', scrim: 'linear-gradient(to right,rgba(15,23,42,0.9),transparent)', titleColor: '#f8fafc', subColor: '#94a3b8', accent: '#38bdf8', accentDark: '#0c4a6e', block: 'bottom'}),
  'functional-medicine-nutrition': makeHero({cardBg: '#ecfccb', scrim: 'linear-gradient(to top,rgba(54,83,20,0.85),transparent)', titleColor: '#fefce8', subColor: '#d9f99d', accent: '#a3e635', accentDark: '#1a2e05', block: 'bottom'}),
  'micro-angel-investing': makeHero({cardBg: '#2e1065', scrim: 'radial-gradient(circle at 70% 30%,rgba(124,58,237,0.5),rgba(46,16,101,0.95))', titleColor: '#ede9fe', subColor: '#c4b5fd', accent: '#a78bfa', accentDark: '#4c1d95', block: 'center', align: 'center'}),
  'agriculture-land-investing': makeHero({cardBg: '#422006', scrim: 'linear-gradient(to top,rgba(66,32,6,0.9),transparent)', titleColor: '#fef3c7', subColor: '#fcd34d', accent: '#f59e0b', accentDark: '#451a03', block: 'bottom'}),
  'saas-acquisition-flip': makeHero({cardBg: '#042f2e', scrim: 'linear-gradient(120deg,rgba(4,47,46,0.92),rgba(13,148,136,0.35))', titleColor: '#ccfbf1', subColor: '#5eead4', accent: '#2dd4bf', accentDark: '#134e4a', block: 'bottom'}),
  'web3-micro-grants': makeHero({cardBg: '#09090b', scrim: 'linear-gradient(45deg,rgba(236,72,153,0.35),rgba(34,211,238,0.35))', titleColor: '#fafafa', subColor: '#e4e4e7', accent: '#22d3ee', accentDark: '#083344', block: 'center', align: 'center', photoFilter: 'saturate(1.3)'}),
  'dividend-growth': makeHero({cardBg: '#172554', scrim: 'linear-gradient(to top,rgba(23,37,84,0.92),transparent)', titleColor: '#fffbeb', subColor: '#fde68a', accent: '#fbbf24', accentDark: '#78350f', titleFont: "'Cormorant Garamond',serif", block: 'bottom'}),
  'nocode-enterprise': makeHero({cardBg: '#faf5ff', scrim: 'linear-gradient(to bottom,rgba(250,245,255,0.85),rgba(192,132,252,0.45))', titleColor: '#581c87', subColor: '#7e22ce', accent: '#c084fc', accentDark: '#3b0764', block: 'top'}),
  'devops-automation': makeHero({cardBg: '#022c22', scrim: 'linear-gradient(to top,rgba(2,44,34,0.95),transparent)', titleColor: '#a7f3d0', subColor: '#6ee7b7', accent: '#34d399', accentDark: '#064e3b', titleFont: "'JetBrains Mono',monospace", block: 'bottom'}),
  'privacy-data-engineering': makeHero({cardBg: '#020617', scrim: 'repeating-linear-gradient(0deg,rgba(34,197,94,0.08) 0 2px,transparent 2px 24px),linear-gradient(to top,rgba(2,6,23,0.92),transparent)', titleColor: '#4ade80', subColor: '#86efac', accent: '#22c55e', accentDark: '#052e16', titleFont: "'JetBrains Mono',monospace", block: 'bottom'}),
  'ai-ecommerce-personalization': makeHero({cardBg: '#500724', scrim: 'linear-gradient(135deg,rgba(236,72,153,0.55),rgba(59,130,246,0.45))', titleColor: '#fff', subColor: '#fce7f3', accent: '#f9a8d4', accentDark: '#831843', block: 'center', align: 'center'}),
  'sustainable-supply-chain': makeHero({cardBg: '#14532d', scrim: 'linear-gradient(to right,rgba(20,83,45,0.9),transparent)', titleColor: '#ecfdf5', subColor: '#a7f3d0', accent: '#4ade80', accentDark: '#052e16', block: 'bottom'}),
  'deep-space-astrophoto': makeHero({cardBg: '#000', scrim: 'radial-gradient(circle at 50% 40%,transparent 20%,rgba(0,0,0,0.85) 75%)', titleColor: '#e0f2fe', subColor: '#bae6fd', accent: '#7dd3fc', accentDark: '#0c4a6e', block: 'bottom', photoFilter: 'contrast(1.15)'}),
  'quantum-computing': makeHero({cardBg: '#0c0a2a', scrim: 'linear-gradient(160deg,rgba(59,130,246,0.45),rgba(12,10,42,0.92))', titleColor: '#dbeafe', subColor: '#93c5fd', accent: '#60a5fa', accentDark: '#1e3a8a', block: 'center', align: 'center'}),
  'deep-ocean-marine': makeHero({cardBg: '#042f49', scrim: 'linear-gradient(to top,rgba(4,47,73,0.95),rgba(8,145,178,0.25))', titleColor: '#cffafe', subColor: '#67e8f9', accent: '#22d3ee', accentDark: '#164e63', block: 'bottom'}),
  'paleontology-dig': makeHero({cardBg: '#78350f', scrim: 'linear-gradient(to top,rgba(120,53,15,0.9),transparent)', titleColor: '#fff7ed', subColor: '#fed7aa', accent: '#fdba74', accentDark: '#7c2d12', titleFont: "'Oswald',sans-serif", block: 'bottom'}),
  'materials-science': makeHero({cardBg: '#334155', scrim: 'linear-gradient(135deg,rgba(148,163,184,0.35),rgba(15,23,42,0.9))', titleColor: '#f1f5f9', subColor: '#cbd5e1', accent: '#94a3b8', accentDark: '#0f172a', block: 'bottom'}),
  'cyberpunk-cinema': makeHero({cardBg: '#0a0a0b', scrim: 'linear-gradient(90deg,rgba(236,72,153,0.35),rgba(34,211,238,0.35))', titleColor: '#f0abfc', subColor: '#e879f9', accent: '#22d3ee', accentDark: '#083344', titleFont: "'Barlow Condensed',sans-serif", titleSize: '52px', block: 'center', align: 'center'}),
  'indie-game-studio': makeHero({cardBg: '#1e1b4b', scrim: 'linear-gradient(to bottom,rgba(30,27,75,0.3),rgba(30,27,75,0.92))', titleColor: '#fef08a', subColor: '#fde047', accent: '#facc15', accentDark: '#422006', titleFont: "'JetBrains Mono',monospace", block: 'top', extraCss: '.card{background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:40px 40px;}'}),
  'retro-anime-cells': makeHero({cardBg: '#be123c', scrim: 'linear-gradient(135deg,rgba(190,18,60,0.75),rgba(59,130,246,0.55))', titleColor: '#fff', subColor: '#fecdd3', accent: '#f472b6', accentDark: '#881337', titleFont: "'Barlow Condensed',sans-serif", block: 'center', align: 'center'}),
  'peak-tv-screenplay': makeHero({cardBg: '#171717', scrim: 'linear-gradient(to top,rgba(0,0,0,0.92),transparent)', titleColor: '#fafafa', subColor: '#d4d4d4', accent: '#fbbf24', accentDark: '#422006', titleFont: "'Oswald',sans-serif", block: 'bottom'}),
  'true-crime-forensic': makeHero({cardBg: '#1c1917', scrim: 'linear-gradient(to top,rgba(28,25,23,0.95),transparent)', titleColor: '#fecaca', subColor: '#fca5a5', accent: '#ef4444', accentDark: '#450a0a', block: 'bottom', extraCss: '.copy{border-left:6px solid #ef4444;padding-left:24px;}'}),
  'bespoke-leather': makeHero({cardBg: '#451a03', scrim: 'linear-gradient(to top,rgba(69,26,3,0.9),transparent)', titleColor: '#ffedd5', subColor: '#fdba74', accent: '#ea580c', accentDark: '#431407', titleFont: "'Playfair Display',serif", block: 'bottom'}),
  'brutalist-graphic-design': makeHero({cardBg: '#e5e5e5', scrim: 'linear-gradient(to bottom,rgba(229,229,229,0.2),rgba(229,229,229,0.92))', titleColor: '#0a0a0a', subColor: '#404040', accent: '#0a0a0a', accentDark: '#fafafa', titleFont: "'Barlow Condensed',sans-serif", titleSize: '58px', block: 'top'}),
  'sustainable-haute-couture': makeHero({cardBg: '#ecfdf5', scrim: 'linear-gradient(to top,rgba(236,253,245,0.92),transparent)', titleColor: '#14532d', subColor: '#166534', accent: '#86efac', accentDark: '#052e16', titleFont: "'Playfair Display',serif", block: 'bottom'}),
  'ceramic-arts': makeHero({cardBg: '#9a3412', scrim: 'linear-gradient(to top,rgba(154,52,18,0.88),transparent)', titleColor: '#fff7ed', subColor: '#fed7aa', accent: '#fb923c', accentDark: '#7c2d12', block: 'center', align: 'center'}),
  'architectural-model-making': makeHero({cardBg: '#f8fafc', scrim: 'linear-gradient(to bottom,rgba(248,250,252,0.85),rgba(148,163,184,0.35))', titleColor: '#0f172a', subColor: '#475569', accent: '#64748b', accentDark: '#f8fafc', block: 'top'}),
  'polar-expedition': makeHero({cardBg: '#e0f2fe', scrim: 'linear-gradient(to top,rgba(224,242,254,0.92),rgba(56,189,248,0.25))', titleColor: '#0c4a6e', subColor: '#0369a1', accent: '#38bdf8', accentDark: '#082f49', block: 'bottom'}),
  'spearfishing': makeHero({cardBg: '#164e63', scrim: 'linear-gradient(to top,rgba(22,78,99,0.92),rgba(8,145,178,0.3))', titleColor: '#ecfeff', subColor: '#a5f3fc', accent: '#22d3ee', accentDark: '#083344', block: 'bottom'}),
  'alpine-cabin-review': makeHero({cardBg: '#292524', scrim: 'linear-gradient(to top,rgba(41,37,36,0.9),transparent)', titleColor: '#fef3c7', subColor: '#fde68a', accent: '#f59e0b', accentDark: '#78350f', titleFont: "'Playfair Display',serif", block: 'bottom'}),
  'mountaineering-tech': makeHero({cardBg: '#7c2d12', scrim: 'linear-gradient(135deg,rgba(234,88,12,0.35),rgba(124,45,18,0.92))', titleColor: '#fff7ed', subColor: '#fdba74', accent: '#fb923c', accentDark: '#431407', block: 'bottom'}),
  'catamaran-community': makeHero({cardBg: '#0e7490', scrim: 'linear-gradient(to top,rgba(14,116,144,0.9),rgba(34,211,238,0.25))', titleColor: '#ecfeff', subColor: '#cffafe', accent: '#67e8f9', accentDark: '#164e63', block: 'center', align: 'center'}),
};

const TEMPLATES = [
  { slug: 'high-ticket-freelance', file: 'template-high-ticket-freelance.html', id: 'high-ticket-freelance-card', name: 'High-Ticket Freelance Blueprint', category: 'productivity', layout: 'split-dark-green', logo: 'tr', plainTitle: false, fields: ['PHOTO_LEFT', 'PHOTO_RIGHT', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'micro-saas-builder', file: 'template-micro-saas-builder.html', id: 'micro-saas-builder-card', name: 'Micro-SaaS Builder Insights', category: 'productivity', layout: 'steps-keyboard', logo: 'tl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'STEP1', 'STEP2', 'STEP3', 'STEP4', 'LOGO'] },
  { slug: 'solopreneur-systems', file: 'template-solopreneur-systems.html', id: 'solopreneur-systems-card', name: 'Solopreneur Systems & Automation', category: 'productivity', layout: 'grid4-title', logo: 'br', plainTitle: false, fields: ['PHOTO_1', 'PHOTO_2', 'PHOTO_3', 'PHOTO_4', 'TITLE', 'LOGO'] },
  { slug: 'remote-team-culture', file: 'template-remote-team-culture.html', id: 'remote-team-culture-card', name: 'Remote Team Culture Strategy', category: 'work-culture', layout: 'quote-serif', logo: 'bl', plainTitle: false, fields: ['PHOTO', 'QUOTE', 'SUBTITLE', 'LOGO'] },
  { slug: 'ai-prompt-enterprise', file: 'template-ai-prompt-enterprise.html', id: 'ai-prompt-enterprise-card', name: 'AI Prompt Engineering for Enterprise', category: 'productivity', layout: 'glass-cosmic', logo: 'tr', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'container-home-design', file: 'template-container-home-design.html', id: 'container-home-design-card', name: 'Architectural Container Home Design', category: 'real-estate', layout: 'split-gradient-yellow', logo: 'tl', plainTitle: false, fields: ['PHOTO_LEFT', 'PHOTO_RIGHT', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'heritage-restoration', file: 'template-heritage-restoration.html', id: 'heritage-restoration-card', name: 'Heritage Home Restorations', category: 'real-estate', layout: 'split-labels', logo: 'tr', plainTitle: false, fields: ['PHOTO_LEFT', 'PHOTO_RIGHT', 'LEFT_LABEL', 'RIGHT_LABEL', 'TITLE', 'LOGO'] },
  { slug: 'biophilic-interior', file: 'template-biophilic-interior.html', id: 'biophilic-interior-card', name: 'Biophilic Interior Design', category: 'real-estate', layout: 'cream-box', logo: 'br', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'tiny-house-glamping', file: 'template-tiny-house-glamping.html', id: 'tiny-house-glamping-card', name: 'High-End Tiny House Glamping', category: 'real-estate', layout: 'grid4-rating', logo: 'tl', plainTitle: false, fields: ['PHOTO_1', 'PHOTO_2', 'PHOTO_3', 'PHOTO_4', 'TITLE', 'RATING_1_LABEL', 'RATING_1_SCORE', 'RATING_2_LABEL', 'RATING_2_SCORE', 'LOGO'] },
  { slug: 'commercial-re-syndication', file: 'template-commercial-re-syndication.html', id: 'commercial-re-syndication-card', name: 'Commercial Real Estate Syndication', category: 'real-estate', layout: 'drone-vignette', logo: 'bl', plainTitle: true, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'restomod-porsche', file: 'template-restomod-porsche.html', id: 'restomod-porsche-card', name: 'Restomod Porsche Culture', category: 'luxury-hobbies', layout: null, logo: 'tr', plainTitle: false, fields: ['PHOTO_LEFT', 'PHOTO_RIGHT', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'vintage-watch-collecting', file: 'template-vintage-watch-collecting.html', id: 'vintage-watch-collecting-card', name: 'Vintage Watch Collecting', category: 'luxury-hobbies', layout: null, logo: 'tl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'mechanical-keyboards', file: 'template-mechanical-keyboards.html', id: 'mechanical-keyboards-card', name: 'Mechanical Keyboard Craft', category: 'luxury-hobbies', layout: null, logo: 'bl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'audiophile-gear', file: 'template-audiophile-gear.html', id: 'audiophile-gear-card', name: 'Audiophile Gear Reviews', category: 'luxury-hobbies', layout: null, logo: 'br', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'whiskey-investment', file: 'template-whiskey-investment.html', id: 'whiskey-investment-card', name: 'Whiskey Investment Insights', category: 'luxury-hobbies', layout: null, logo: 'tl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'longevity-biohacking', file: 'template-longevity-biohacking.html', id: 'longevity-biohacking-card', name: 'Longevity Biohacking Protocols', category: 'health', layout: null, logo: 'tr', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'pediatric-neurodiversity', file: 'template-pediatric-neurodiversity.html', id: 'pediatric-neurodiversity-card', name: 'Pediatric Neurodiversity Support', category: 'health', layout: null, logo: 'bl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'athletic-sleep-optimization', file: 'template-athletic-sleep-optimization.html', id: 'athletic-sleep-optimization-card', name: 'Athletic Sleep Optimization', category: 'health', layout: null, logo: 'tl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'executive-ergonomics', file: 'template-executive-ergonomics.html', id: 'executive-ergonomics-card', name: 'Executive Ergonomics Lab', category: 'health', layout: null, logo: 'br', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'functional-medicine-nutrition', file: 'template-functional-medicine-nutrition.html', id: 'functional-medicine-nutrition-card', name: 'Functional Medicine Nutrition', category: 'health', layout: null, logo: 'tr', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'micro-angel-investing', file: 'template-micro-angel-investing.html', id: 'micro-angel-investing-card', name: 'Micro Angel Investing Playbook', category: 'finance', layout: null, logo: 'tl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'agriculture-land-investing', file: 'template-agriculture-land-investing.html', id: 'agriculture-land-investing-card', name: 'Agriculture Land Investing', category: 'finance', layout: null, logo: 'bl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'saas-acquisition-flip', file: 'template-saas-acquisition-flip.html', id: 'saas-acquisition-flip-card', name: 'SaaS Acquisition Flips', category: 'finance', layout: null, logo: 'tr', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'web3-micro-grants', file: 'template-web3-micro-grants.html', id: 'web3-micro-grants-card', name: 'Web3 Micro Grants', category: 'finance', layout: null, logo: 'br', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'dividend-growth', file: 'template-dividend-growth.html', id: 'dividend-growth-card', name: 'Dividend Growth Portfolios', category: 'finance', layout: null, logo: 'bl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'nocode-enterprise', file: 'template-nocode-enterprise.html', id: 'nocode-enterprise-card', name: 'No-Code Enterprise Stacks', category: 'tech', layout: null, logo: 'tl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'devops-automation', file: 'template-devops-automation.html', id: 'devops-automation-card', name: 'DevOps Automation Patterns', category: 'tech', layout: null, logo: 'tr', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'privacy-data-engineering', file: 'template-privacy-data-engineering.html', id: 'privacy-data-engineering-card', name: 'Privacy-First Data Engineering', category: 'tech', layout: null, logo: 'br', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'ai-ecommerce-personalization', file: 'template-ai-ecommerce-personalization.html', id: 'ai-ecommerce-personalization-card', name: 'AI Ecommerce Personalization', category: 'tech', layout: null, logo: 'tl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'sustainable-supply-chain', file: 'template-sustainable-supply-chain.html', id: 'sustainable-supply-chain-card', name: 'Sustainable Supply Chain Design', category: 'tech', layout: null, logo: 'bl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'deep-space-astrophoto', file: 'template-deep-space-astrophoto.html', id: 'deep-space-astrophoto-card', name: 'Deep Space Astrophotography', category: 'space', layout: null, logo: 'tr', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'quantum-computing', file: 'template-quantum-computing.html', id: 'quantum-computing-card', name: 'Quantum Computing Frontiers', category: 'science', layout: null, logo: 'br', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'deep-ocean-marine', file: 'template-deep-ocean-marine.html', id: 'deep-ocean-marine-card', name: 'Deep Ocean Marine Science', category: 'science', layout: null, logo: 'tl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'paleontology-dig', file: 'template-paleontology-dig.html', id: 'paleontology-dig-card', name: 'Paleontology Field Digs', category: 'science', layout: null, logo: 'bl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'materials-science', file: 'template-materials-science.html', id: 'materials-science-card', name: 'Advanced Materials Science', category: 'science', layout: null, logo: 'tr', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'cyberpunk-cinema', file: 'template-cyberpunk-cinema.html', id: 'cyberpunk-cinema-card', name: 'Cyberpunk Cinema Studies', category: 'pop-culture', layout: null, logo: 'br', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'indie-game-studio', file: 'template-indie-game-studio.html', id: 'indie-game-studio-card', name: 'Indie Game Studio Diaries', category: 'pop-culture', layout: null, logo: 'tl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'retro-anime-cells', file: 'template-retro-anime-cells.html', id: 'retro-anime-cells-card', name: 'Retro Anime Cel Collecting', category: 'pop-culture', layout: null, logo: 'tr', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'peak-tv-screenplay', file: 'template-peak-tv-screenplay.html', id: 'peak-tv-screenplay-card', name: 'Peak TV Screenplay Craft', category: 'pop-culture', layout: null, logo: 'bl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'true-crime-forensic', file: 'template-true-crime-forensic.html', id: 'true-crime-forensic-card', name: 'True Crime Forensic Files', category: 'pop-culture', layout: null, logo: 'br', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'bespoke-leather', file: 'template-bespoke-leather.html', id: 'bespoke-leather-card', name: 'Bespoke Leather Atelier', category: 'creative', layout: null, logo: 'tl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'brutalist-graphic-design', file: 'template-brutalist-graphic-design.html', id: 'brutalist-graphic-design-card', name: 'Brutalist Graphic Design', category: 'creative', layout: null, logo: 'tr', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'sustainable-haute-couture', file: 'template-sustainable-haute-couture.html', id: 'sustainable-haute-couture-card', name: 'Sustainable Haute Couture', category: 'creative', layout: null, logo: 'bl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'ceramic-arts', file: 'template-ceramic-arts.html', id: 'ceramic-arts-card', name: 'Ceramic Arts Studio', category: 'creative', layout: null, logo: 'br', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'architectural-model-making', file: 'template-architectural-model-making.html', id: 'architectural-model-making-card', name: 'Architectural Model Making', category: 'creative', layout: null, logo: 'tl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'polar-expedition', file: 'template-polar-expedition.html', id: 'polar-expedition-card', name: 'Polar Expedition Logistics', category: 'adventure-travel', layout: null, logo: 'tr', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'spearfishing', file: 'template-spearfishing.html', id: 'spearfishing-card', name: 'Spearfishing Expeditions', category: 'adventure-travel', layout: null, logo: 'bl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'alpine-cabin-review', file: 'template-alpine-cabin-review.html', id: 'alpine-cabin-review-card', name: 'Alpine Cabin Reviews', category: 'adventure-travel', layout: null, logo: 'br', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'mountaineering-tech', file: 'template-mountaineering-tech.html', id: 'mountaineering-tech-card', name: 'Mountaineering Tech Gear', category: 'adventure-travel', layout: null, logo: 'tl', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
  { slug: 'catamaran-community', file: 'template-catamaran-community.html', id: 'catamaran-community-card', name: 'Catamaran Cruising Community', category: 'adventure-travel', layout: null, logo: 'tr', plainTitle: false, fields: ['PHOTO', 'TITLE', 'SUBTITLE', 'LOGO'] },
];


const font_map = {
  'quote-serif': 'family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;600;700',
  'glass-cosmic': 'family=Inter:wght@400;600;800&family=Barlow+Condensed:wght@700',
  'split-dark-green': 'family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600',
  'split-gradient-yellow': 'family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600',
  'split-labels': 'family=Oswald:wght@500;600;700&family=Inter:wght@400;600',
  'cream-box': 'family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;600',
  'steps-keyboard': 'family=JetBrains+Mono:wght@500;600;700&family=Inter:wght@400;600',
  'vintage-watch-collecting': 'family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;600',
  'whiskey-investment': 'family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;600',
  'restomod-porsche': 'family=Oswald:wght@500;600;700&family=Inter:wght@400;600',
  'default': 'family=Inter:wght@400;600;700;800&family=Barlow+Condensed:wght@700&family=JetBrains+Mono:wght@500;600&family=Playfair+Display:wght@500;600&family=Oswald:wght@600&family=Cormorant+Garamond:wght@600',
};

function resolveFonts(t) {
  if (t.layout && font_map[t.layout]) return font_map[t.layout];
  if (font_map[t.slug]) return font_map[t.slug];
  return font_map.default;
}


function generateHtml(t) {
  const { css, body } = buildLayout(t);
  const cardCss = `.card{position:relative;width:1080px;height:1080px;}`;
  const merged = css.includes('.card{') ? css : cardCss + css.replace(/^\./, '.card .x');
  const extraCss = css.startsWith('.logo-slot') || css.includes('.card{') ? css : `.card{position:relative;width:1080px;height:1080px;}${css}`;
  const finalCss = css.includes('width:1080px;height:1080px') ? css : extraCss;
  return wrapHtml({
    name: t.name,
    fontUrl: resolveFonts(t),
    extraCss: finalCss,
    body,
  });
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
  const file = `export const NICHE_TEMPLATE_REGISTRY = [\n${lines.join(',\n')},\n];\n`;
  fs.writeFileSync(REGISTRY_PATH, file, 'utf8');
}

function main() {
  fs.mkdirSync(HTML_DIR, { recursive: true });
  const registry = [];
  for (const t of TEMPLATES) {
    const html = generateHtml(t);
    const outPath = path.join(HTML_DIR, t.file);
    fs.writeFileSync(outPath, html, 'utf8');
    registry.push({
      file: t.file,
      id: t.id,
      name: t.name,
      category: t.category,
      fields: fieldDefs(t.fields),
    });
  }
  writeRegistry(registry);
  console.log(`Generated ${TEMPLATES.length} templates in ${HTML_DIR}`);
  console.log(`Registry: ${REGISTRY_PATH}`);
}

main();
