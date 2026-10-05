// Build the print files for the Annual Review poster (Teeinblue template) from
// design/Poster.dc.html, and the v2 social sharing image.
//
//   cd tools/preview && npm install && node print.mjs
//
// Writes design/poster-template/:
//   poster-sample.png       the full poster with the sample answers (3600 x 5400, 12x18 in at 300 dpi)
//   poster-background.png   everything that never changes; personalised parts left blank
//   poster-stamp.png        the APPROVED stamp alone on a transparent full-size canvas (top layer)
//   layers.json             where each personalised layer goes, in print pixels
//   lines/<kind>/<Label>.png  the 15 joke lines as Teeinblue clipart, 3096 x 269 transparent:
//                           two lines of Courier Prime 96 px at line height 1.4 (134.4 px),
//                           copy read from shopify/snippets/hs2-lines.liquid
// and assets/social-share-1200x628.png.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const outDir = path.join(repo, 'design', 'poster-template');
fs.mkdirSync(outDir, { recursive: true });
const asset = (f) => pathToFileURL(path.join(repo, 'shopify', 'assets', f)).href;
const SCALE = 6; // 600 x 900 design -> 3600 x 5400 print

const fontCss = `
  @font-face { font-family: "HS Fraunces"; font-weight: 400 700; src: url(${asset('hs-fraunces.woff2')}) format("woff2"); }
  @font-face { font-family: "HS Courier Prime"; font-weight: 400; src: url(${asset('hs-courierprime-400.woff2')}) format("woff2"); }
  @font-face { font-family: "HS Courier Prime"; font-weight: 700; src: url(${asset('hs-courierprime-700.woff2')}) format("woff2"); }
  body { margin: 0; }
  .stars { font-family: "DejaVu Sans", "Segoe UI Symbol", sans-serif; }
`;
const paw = '<svg width="58" height="58" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="6.2" cy="9.2" rx="2" ry="2.6"></ellipse><ellipse cx="10" cy="5.8" rx="2" ry="2.6"></ellipse><ellipse cx="14.4" cy="5.8" rx="2" ry="2.6"></ellipse><ellipse cx="18.2" cy="9.2" rx="2" ry="2.6"></ellipse><path d="M12.2 10.6c-3.2 0-6 3.6-6 6.2 0 1.8 1.4 2.6 3 2.6 1.3 0 2-.6 3-.6s1.7.6 3 .6c1.6 0 3-.8 3-2.6 0-2.6-2.8-6.2-6-6.2z"></path></svg>';

// Markup follows design/Poster.dc.html, THREAT ASSESSMENT block included. Every line that
// can wrap gets two lines of room (min-height 2.8em at line-height 1.4), so a two-line
// answer never reaches the next heading. data-layer marks each personalised part.
const poster = `
<div id="poster" style="width: 600px; height: 900px; box-sizing: border-box; background: #FFFDF9; color: #121010; font-family: 'HS Courier Prime', monospace; padding: 40px 42px 34px; display: flex; flex-direction: column; gap: 18px; position: relative; overflow: hidden">
  <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #121010; padding-bottom: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.12em">
    <span>ANNUAL PERFORMANCE REVIEW · 2026</span><span>FORM HR-26</span>
  </div>
  <div style="display: flex; gap: 20px; align-items: center">
    <img data-layer="photo" src="${pathToFileURL(path.join(repo, 'assets', 'v2', 'hero-manager.jpg')).href}" alt="" style="width: 170px; height: 170px; object-fit: cover; object-position: 50% 24%; border-radius: 4px">
    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 16px; line-height: 1.35">
      <div><strong>Employee:</strong> <span data-layer="person">Sarah</span></div>
      <div><strong>Role:</strong> My Person</div>
      <div><strong>Reviewer:</strong> <span data-layer="dog">Biscuit</span></div>
      <div><strong>Title:</strong> Head of Household</div>
    </div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 7px; font-size: 16px">
    <div style="font-weight: 700; letter-spacing: 0.1em">RATINGS</div>
    <div style="display: flex; justify-content: space-between"><span>Snack delivery</span><span class="stars" style="color: #A8284E">★★★★★</span></div>
    <div style="display: flex; justify-content: space-between"><span>Belly rubs</span><span class="stars" style="color: #A8284E">★★★★☆</span></div>
    <div style="display: flex; justify-content: space-between"><span>Leaving the house</span><span class="stars" style="color: #A8284E">★☆☆☆☆</span></div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 5px; font-size: 16px; line-height: 1.4">
    <div style="font-weight: 700; letter-spacing: 0.1em">KEY ACHIEVEMENTS</div>
    <div data-layer="cupboard_line" style="min-height: 2.8em">Opened the treat cupboard 1,412 times. Strong numbers.</div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 5px; font-size: 16px; line-height: 1.4">
    <div style="font-weight: 700; letter-spacing: 0.1em">AREAS FOR IMPROVEMENT</div>
    <div data-layer="improvement" style="min-height: 2.8em">Leaving. Please stop leaving.</div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 5px; font-size: 16px; line-height: 1.4">
    <div style="font-weight: 700; letter-spacing: 0.1em">INCIDENT REPORT</div>
    <div data-layer="incident" style="min-height: 2.8em">The sock. I would do it again. Case closed.</div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 5px; font-size: 16px; line-height: 1.4">
    <div style="font-weight: 700; letter-spacing: 0.1em">THREAT ASSESSMENT</div>
    <div data-layer="enemy" style="min-height: 2.8em">The mailman. Comes every day. Clearly planning something.</div>
  </div>
  <div style="margin-top: auto; border-top: 3px solid #121010; padding-top: 11px; display: flex; justify-content: space-between; align-items: flex-end">
    <div style="display: flex; flex-direction: column; gap: 4px">
      <div style="font-size: 14px; font-weight: 700; letter-spacing: 0.12em">OUTCOME</div>
      <div style="font-family: 'HS Fraunces', serif; font-size: 40px; font-weight: 700; line-height: 1.02">Contract renewed.<br>For life.</div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; color: #8A4A2B">
      ${paw}
      <div data-layer="signature" style="font-size: 15px">Biscuit</div>
    </div>
  </div>
  <div data-stamp style="position: absolute; right: 30px; top: 210px; border: 5px solid #A8284E; color: #A8284E; font-weight: 700; font-size: 30px; letter-spacing: 0.08em; padding: 8px 16px; transform: rotate(-14deg); border-radius: 10px">APPROVED</div>
</div>`;

const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const ctx = await browser.newContext({ viewport: { width: 600, height: 900 }, deviceScaleFactor: SCALE });
const pg = await ctx.newPage();
// file:// pages may load file:// fonts and images; in-memory pages may not
const tmp = path.join(here, 'out'); fs.mkdirSync(tmp, { recursive: true });
fs.writeFileSync(path.join(tmp, 'print-poster.html'), `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}</style></head><body>${poster}</body></html>`);
await pg.goto(pathToFileURL(path.join(tmp, 'print-poster.html')).href, { waitUntil: 'load' });
await pg.evaluate(() => document.fonts.ready);
await pg.evaluate(() => Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
const loaded = await pg.evaluate(() => ({ fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight), img: document.querySelector('img').naturalWidth }));
console.log('fonts loaded:', loaded.fonts.join(', '), '| photo width:', loaded.img);
if (!loaded.img || loaded.fonts.length < 2) throw new Error('fonts or photo did not load; refusing to write print files');
await pg.waitForTimeout(300);

// 1. sample
await pg.locator('#poster').screenshot({ path: path.join(outDir, 'poster-sample.png') });
// 1b. the same sample with Biscuit, the brand's own dog (generated for Heartside, so it carries
// no licence question), for the product photos in design/mockups/
const biscuit = path.join(repo, 'assets', 'v2', 'biscuit-headshot.jpg');
if (fs.existsSync(biscuit)) {
  const mockDir = path.join(repo, 'design', 'mockups'); fs.mkdirSync(mockDir, { recursive: true });
  const before = await pg.evaluate(() => { const i = document.querySelector('[data-layer="photo"]'); return [i.src, i.style.objectPosition]; });
  await pg.evaluate((src) => new Promise((r) => { const i = document.querySelector('[data-layer="photo"]'); i.onload = r; i.style.objectPosition = '50% 35%'; i.src = src; }), pathToFileURL(biscuit).href);
  await pg.locator('#poster').screenshot({ path: path.join(mockDir, 'poster-biscuit.png') });
  await pg.evaluate(([src, pos]) => new Promise((r) => { const i = document.querySelector('[data-layer="photo"]'); i.onload = r; i.style.objectPosition = pos; i.src = src; }), before);
}

// 2. layer boxes, measured on the sample (print px = design px x 6)
const layers = await pg.evaluate((S) => {
  const box = document.querySelector('#poster').getBoundingClientRect();
  return [...document.querySelectorAll('[data-layer]')].map((el) => {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return {
      id: el.getAttribute('data-layer'),
      x: Math.round((r.left - box.left) * S), y: Math.round((r.top - box.top) * S),
      width: Math.round(r.width * S), height: Math.round(r.height * S),
      font: el.tagName === 'IMG' ? null : cs.fontFamily.split(',')[0].replace(/"/g, ''),
      font_size_px: el.tagName === 'IMG' ? null : Math.round(parseFloat(cs.fontSize) * S),
      font_weight: el.tagName === 'IMG' ? null : cs.fontWeight,
      color: el.tagName === 'IMG' ? null : cs.color,
      sample: el.tagName === 'IMG' ? 'dog photo, cover-cropped, 4 px corner radius' : el.textContent,
    };
  });
}, SCALE);
const room = await pg.evaluate(() => {
  const enemy = document.querySelector('[data-layer="enemy"]').getBoundingClientRect();
  const outcome = document.querySelector('[data-layer="signature"]').closest('#poster > div').getBoundingClientRect();
  return Math.round(outcome.top - enemy.bottom);
});
console.log('room between the threat lines and the outcome rule:', room, 'design px');
if (room < 12) throw new Error('the joke lines push the outcome off its place; refusing to write print files');
fs.writeFileSync(path.join(outDir, 'layers.json'), JSON.stringify({ canvas: { width: 3600, height: 5400, dpi: 300, inches: '12 x 18' }, layers }, null, 2) + '\n');

// 3. background: personalised parts and the stamp hidden
await pg.evaluate(() => {
  document.querySelectorAll('[data-layer], [data-stamp]').forEach((el) => { el.style.visibility = 'hidden'; });
});
await pg.locator('#poster').screenshot({ path: path.join(outDir, 'poster-background.png') });

// 4. stamp alone, transparent, full canvas so it aligns at 0,0
await pg.evaluate(() => {
  const p = document.querySelector('#poster');
  p.style.background = 'transparent';
  [...p.querySelectorAll('*')].forEach((el) => { el.style.visibility = 'hidden'; el.style.borderColor = 'transparent'; });
  const s = p.querySelector('[data-stamp]'); s.style.visibility = 'visible'; s.style.borderColor = '#A8284E';
  p.style.borderColor = 'transparent';
});
await pg.evaluate(() => { document.body.style.background = 'transparent'; });
await pg.locator('#poster').screenshot({ path: path.join(outDir, 'poster-stamp.png'), omitBackground: true });

// 5. the joke lines as clipart, one PNG per chip, sized to the layer boxes above
const snippet = fs.readFileSync(path.join(repo, 'shopify', 'snippets', 'hs2-lines.liquid'), 'utf8');
const lineSets = {};
for (const m of snippet.matchAll(/when '(\w+)'\s+assign labels = '([^']+)' \| split: '\|'\s+assign lines = '([^']+)'/g)) {
  const labels = m[2].split('|'), texts = m[3].split('|');
  lineSets[m[1]] = labels.map((l, i) => [l, texts[i]]);
}
const lineCtx = await browser.newContext({ viewport: { width: 3096, height: 269 }, deviceScaleFactor: 1 });
const lp = await lineCtx.newPage();
fs.writeFileSync(path.join(tmp, 'print-line.html'), `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
  html, body { background: transparent; }
  #line { width: 3096px; height: 269px; font-family: "HS Courier Prime", monospace; font-size: 96px; line-height: 1.4; color: #121010; overflow: hidden; }
</style></head><body><div id="line"></div></body></html>`);
await lp.goto(pathToFileURL(path.join(tmp, 'print-line.html')).href, { waitUntil: 'load' });
await lp.evaluate(() => document.fonts.load('96px "HS Courier Prime"'));
let lineCount = 0;
for (const [kind, set] of Object.entries(lineSets)) {
  const dir = path.join(outDir, 'lines', kind);
  fs.mkdirSync(dir, { recursive: true });
  for (const [label, text] of set) {
    const rows = await lp.evaluate((t) => { const el = document.querySelector('#line'); el.textContent = t; return Math.round(el.scrollHeight / 134.4); }, text);
    if (rows > 2) throw new Error(`"${text}" needs ${rows} lines; the layer holds 2`);
    await lp.locator('#line').screenshot({ path: path.join(dir, `${label}.png`), omitBackground: true });
    lineCount++;
  }
}
console.log('joke line PNGs:', lineCount, Object.entries(lineSets).map(([k, s]) => `${k}: ${s.length}`).join(', '));

// 6. Tiny Me's face with Biscuit, for the ornament product photo. Built to the spec in
// docs/ADMIN-RUN-2026-10-04.md (photo cropped to a circle, the verdict in a ring around it,
// the name in Fraunces underneath). Provisional until it is checked against Teeinblue's
// artwork for the ornament, which is the file that actually prints.
if (fs.existsSync(biscuit)) {
  const orn = await browser.newContext({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
  const op = await orn.newPage();
  const ring = 'OVERALL RATING: EXCEEDS EXPECTATIONS \u2022 CONTRACT RENEWED. FOR LIFE. \u2022 ';
  fs.writeFileSync(path.join(tmp, 'print-ornament.html'), `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
    html, body { margin: 0; background: transparent; }
  </style></head><body>
  <svg width="1200" height="1200" viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="c"><circle cx="600" cy="500" r="300"/></clipPath>
      <path id="ring" d="M 600,1105 a 505,505 0 1,1 0,-1010 a 505,505 0 1,1 0,1010"/>
    </defs>
    <circle cx="600" cy="600" r="600" fill="#FFFDF9"/>
    <image href="${pathToFileURL(biscuit).href}" x="300" y="200" width="600" height="600" preserveAspectRatio="xMidYMid slice" clip-path="url(#c)"/>
    <circle cx="600" cy="500" r="300" fill="none" stroke="#121010" stroke-width="5"/>
    <text font-family="HS Courier Prime" font-weight="700" font-size="52" fill="#121010">
      <textPath href="#ring" startOffset="12" textLength="3140" lengthAdjust="spacing">${ring}</textPath>
    </text>
    <text x="600" y="910" text-anchor="middle" font-family="HS Fraunces" font-weight="650" font-size="96" fill="#121010">Biscuit</text>
  </svg></body></html>`);
  await op.goto(pathToFileURL(path.join(tmp, 'print-ornament.html')).href, { waitUntil: 'load' });
  await op.evaluate(() => document.fonts.ready);
  await op.waitForTimeout(300);
  await op.locator('svg').screenshot({ path: path.join(repo, 'design', 'mockups', 'ornament-biscuit.png'), omitBackground: true });
  await orn.close();
}

// 7. v2 social sharing image, 1200 x 628
const share = await browser.newContext({ viewport: { width: 1200, height: 628 }, deviceScaleFactor: 1 });
const sp = await share.newPage();
fs.writeFileSync(path.join(tmp, 'print-share.html'), `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
  @font-face { font-family: "HS Fraunces"; font-style: italic; font-weight: 400; src: url(${asset('hs-fraunces-italic.woff2')}) format("woff2"); }
  body { width: 1200px; height: 628px; background: #FBF6F1; overflow: hidden; font-family: "HS Courier Prime", monospace; color: #121010; position: relative; }
  .copy { position: absolute; left: 72px; top: 92px; width: 560px; display: flex; flex-direction: column; gap: 22px; }
  .stamp { align-self: flex-start; border: 3px solid #A8284E; color: #A8284E; font-weight: 700; font-size: 17px; letter-spacing: 0.14em; padding: 6px 12px; transform: rotate(-2deg); border-radius: 6px; }
  h1 { margin: 0; font-family: "HS Fraunces", serif; font-weight: 650; font-size: 72px; line-height: 0.96; letter-spacing: -0.025em; }
  h1 em { font-weight: 400; color: #A8284E; }
  .url { font-size: 20px; font-weight: 700; }
  .poster { position: absolute; right: 78px; top: 40px; transform: rotate(3deg); transform-origin: top left; box-shadow: 0 30px 60px rgba(18,16,16,0.25); }
  .poster > div { transform: scale(0.6); transform-origin: top left; }
  .poster { width: 360px; height: 540px; overflow: hidden; }
</style></head><body>
  <div class="copy">
    <div class="stamp">YOUR DOG HAS NOTES</div>
    <h1>Biscuit has completed your <em>annual review.</em></h1>
    <div class="url">heartside.io</div>
  </div>
  <div class="poster">${poster}</div>
</body></html>`);
await sp.goto(pathToFileURL(path.join(tmp, 'print-share.html')).href, { waitUntil: 'load' });
await sp.evaluate(() => document.fonts.ready);
await sp.waitForTimeout(300);
await sp.screenshot({ path: path.join(repo, 'assets', 'social-share-1200x628.png') });

await browser.close();
console.log('wrote design/poster-template/{poster-sample,poster-background,poster-stamp}.png, layers.json and assets/social-share-1200x628.png');
console.log(JSON.stringify(layers.map((l) => [l.id, l.x, l.y, l.width, l.height, l.font_size_px])));
