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

// Markup follows design/Poster.dc.html. One addition: the THREAT ASSESSMENT block,
// because the homepage builder asks for the "known enemy" and shows it on the preview.
// data-layer marks each personalised part.
const poster = `
<div id="poster" style="width: 600px; height: 900px; box-sizing: border-box; background: #FFFDF9; color: #121010; font-family: 'HS Courier Prime', monospace; padding: 40px 42px 34px; display: flex; flex-direction: column; gap: 18px; position: relative; overflow: hidden">
  <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #121010; padding-bottom: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.12em">
    <span>ANNUAL PERFORMANCE REVIEW · 2026</span><span>FORM HR-26</span>
  </div>
  <div style="display: flex; gap: 20px; align-items: center">
    <img data-layer="photo" src="${asset('hs-photo-dachshund-800.webp')}" alt="" style="width: 170px; height: 170px; object-fit: cover; border-radius: 4px">
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
    <div data-layer="cupboard_line">Opened the treat cupboard 1,412 times. Strong numbers.</div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 5px; font-size: 16px; line-height: 1.4">
    <div style="font-weight: 700; letter-spacing: 0.1em">AREAS FOR IMPROVEMENT</div>
    <div data-layer="improvement">Leaving. Please stop leaving.</div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 5px; font-size: 16px; line-height: 1.4">
    <div style="font-weight: 700; letter-spacing: 0.1em">INCIDENT REPORT</div>
    <div data-layer="incident">The sock. I would do it again. Case closed.</div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 5px; font-size: 16px; line-height: 1.4">
    <div style="font-weight: 700; letter-spacing: 0.1em">THREAT ASSESSMENT</div>
    <div data-layer="enemy">The mailman. Comes every day. Clearly planning something.</div>
  </div>
  <div style="margin-top: auto; border-top: 3px solid #121010; padding-top: 14px; display: flex; justify-content: space-between; align-items: flex-end">
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

// 5. v2 social sharing image, 1200 x 628
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
