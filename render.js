// Fills HTML template placeholders with data and screenshots each as a PNG.
// Usage:  node render.js
// Setup:  npm install puppeteer
//
// Add/replace rows in posts.json to generate different posts. Each row's
// "template" field must match one of the .html files in this folder, and
// every other field must match a {{token}} used inside that template.
//
// Each post is rendered in ALL 4 layouts automatically:
//   square     1080×1080   Instagram 1:1
//   portrait   1080×1350   Instagram/Facebook 4:5
//   story      1080×1920   Story/Reels 9:16
//   landscape  1200×628    Facebook horizontal
// Output files are suffixed: post_01_square.png, post_01_portrait.png, etc.

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const POSTS_FILE = path.join(__dirname, 'posts.json');
const OUTPUT_DIR = path.join(__dirname, 'output');

const LAYOUTS = {
  square:    { width: 1080, height: 1080 },
  portrait:  { width: 1080, height: 1350 },
  story:     { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 628  },
};

// Convert CSV-friendly highlight syntax to HTML:
//   [[text]]  →  <span class="highlight-red">text</span>
//   [text]    →  <mark>text</mark>
// Double-bracket is checked first so it isn't consumed by single-bracket.
function applyHighlights(value) {
  return String(value)
    .replace(/\[\[(.+?)\]\]/g, '<span class="highlight-red">$1</span>')
    .replace(/\[(.+?)\]/g, '<mark>$1</mark>');
}

function fillTemplate(html, data) {
  return html.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
    if (data[key] === undefined) {
      console.warn(`  ! missing value for {{${key}}} — left blank`);
      return '';
    }
    return applyHighlights(data[key]);
  });
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const layoutNames = Object.keys(LAYOUTS);

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const templatePath = path.join(__dirname, `template-${post.template}.html`);
    if (!fs.existsSync(templatePath)) {
      console.error(`Row ${i + 1}: no template file for "${post.template}", skipping`);
      continue;
    }

    const baseRawHtml = fs.readFileSync(templatePath, 'utf8');
    const baseName = (post.output || `post_${String(i + 1).padStart(2, '0')}.png`).replace(/\.png$/i, '');

    for (const layoutName of layoutNames) {
      const layout = LAYOUTS[layoutName];
      await page.setViewport({ width: layout.width, height: layout.height, deviceScaleFactor: 1 });

      let rawHtml = baseRawHtml
        .replace(/(html,\s*body\s*\{[^}]*width:)\s*\d+px/g, `$1${layout.width}px`)
        .replace(/(html,\s*body\s*\{[^}]*height:)\s*\d+px/g, `$1${layout.height}px`)
        .replace(/(\.card\s*\{[^}]*width:)\s*\d+px/g, `$1${layout.width}px`)
        .replace(/(\.card\s*\{[^}]*height:)\s*\d+px/g, `$1${layout.height}px`);

      const filledHtml = fillTemplate(rawHtml, post);

      await page.setContent(filledHtml, { waitUntil: 'networkidle0' });
      await page.evaluateHandle('document.fonts.ready');

      const outName = `${baseName}_${layoutName}.png`;
      const outPath = path.join(OUTPUT_DIR, outName);
      await page.screenshot({ path: outPath });
      console.log(`Row ${i + 1}: rendered -> output/${outName}  [${layout.width}×${layout.height}]`);
    }
  }

  await browser.close();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
