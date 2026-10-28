// The checkout tiles (28 Oct): the picture each gift variant carries for checkout's component line,
// and the Artist's touch product picture. Shopify on Basic draws a nested checkout line with its
// variant's own catalog image; that was the blank supplier base, so a buyer saw a blank white
// thumbnail under their design. A tile shows the gift's shape and Buddy's heart instead: no example
// dog, so it never stands in for someone else's dog, and no claim beyond the gift itself. The
// text is large because checkout draws the picture at about 64 px.
//
// CoWork uploads each PNG to its product with the alt text printed below (the theme hides any photo
// whose alt says "checkout tile" from the gallery and the chat, hs-product-gallery.liquid), then
// points only the variants handle-check.mjs reports as blank at it. The product's own first photo
// does not change. The Artist's touch tile is artists-touch-tile.png: the heart stand-in it
// replaces is stored in Shopify as artists-touch.png, and handle-check.mjs tells them apart by name.
//
//   cd tools/preview && node ../build_checkout_tiles.mjs        # writes design/checkout-tiles/*.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const require = createRequire(path.join(root, 'tools/preview/package.json'));
const { chromium } = require('playwright');
const out = path.join(root, 'design/checkout-tiles');
fs.mkdirSync(out, { recursive: true });

const font = (f) => pathToFileURL(path.join(root, 'shopify/assets', f)).href;
const heart = pathToFileURL(path.join(root, 'design/brand-v4/heart-paw-source.png')).href;
// Each gift drawn as its own shape, its print area in blush with Buddy's heart where the painting goes.
const INK = '#121010', PAPER = '#FFFDF9', BLUSH = '#F0C0C0', CHESTNUT = '#8A4A2B', TAN = '#E8D9C4';
const SHAPE = {
  mug: `<path d="M330 300h470v380c0 70-56 126-126 126H456c-70 0-126-56-126-126z" fill="${PAPER}" stroke="${INK}" stroke-width="14" stroke-linejoin="round"/>
    <path d="M800 400h46c62 0 104 44 104 104s-42 104-104 104h-46" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
    <rect x="380" y="360" width="370" height="360" rx="34" fill="${BLUSH}"/>`,
  portrait: `<rect x="350" y="250" width="500" height="620" rx="10" fill="${CHESTNUT}"/>
    <rect x="384" y="284" width="432" height="552" rx="4" fill="${PAPER}"/>
    <rect x="430" y="330" width="340" height="400" rx="170" fill="${BLUSH}"/>
    <rect x="486" y="770" width="228" height="12" rx="6" fill="${INK}" opacity=".55"/>`,
  blanket: `<path d="M300 300h600v460c0 40-32 72-72 72H300z" fill="${BLUSH}" stroke="${INK}" stroke-width="14" stroke-linejoin="round"/>
    <path d="M760 832l140-140v68c0 40-32 72-72 72z" fill="${TAN}" stroke="${INK}" stroke-width="14" stroke-linejoin="round"/>
    <path d="M300 300h600" stroke="${INK}" stroke-width="14"/>`,
  brush: `<circle cx="560" cy="580" r="230" fill="${BLUSH}"/>
    <path d="M836 236c20 0 76 56 76 76 0 18-90 114-124 136l-34-34c22-34 64-178 82-178z" fill="${CHESTNUT}"/>
    <path d="M736 400l34 34c-12 34-40 68-92 68-28 0-56-12-68-22 34-6 46-22 52-46 6-28 40-46 74-34z" fill="${INK}"/>`,
};
const HEART = { mug: [565, 540, 250], portrait: [600, 530, 230], blanket: [600, 560, 260], brush: [470, 610, 230] };
export const TILES = [
  { file: 'checkout-tile-mug.png', icon: 'mug', name: 'Your mug', alt: 'Your mug, painted from your dog. Heartside checkout tile.' },
  { file: 'checkout-tile-portrait.png', icon: 'portrait', name: 'Your portrait', alt: 'Your portrait, painted from your dog. Heartside checkout tile.' },
  { file: 'checkout-tile-blanket.png', icon: 'blanket', name: 'Your blanket', alt: 'Your blanket, painted from your dog. Heartside checkout tile.' },
  { file: 'artists-touch-tile.png', icon: 'brush', name: 'Our artist\u2019s touch', sub: 'a person adds the details you send', alt: "Our artist's touch: a person adds the details you send." },
];
const page = (t) => {
  const [hx, hy, hs] = HEART[t.icon];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: F; src: url(${font('hs-fraunces.woff2')}) format('woff2'); font-weight: 100 900; }
@font-face { font-family: FI; src: url(${font('hs-fraunces-italic.woff2')}) format('woff2'); font-weight: 100 900; font-style: italic; }
@font-face { font-family: C; src: url(${font('hs-courierprime-700.woff2')}) format('woff2'); }
html, body { margin: 0; width: 1200px; height: 1200px; background: #FBF6F1; overflow: hidden; }
svg { position: absolute; left: 0; top: 0; width: 1200px; height: 1200px; }
img { position: absolute; left: ${hx - hs / 2}px; top: ${hy - hs / 2}px; width: ${hs}px; height: ${hs}px; }
.t { position: absolute; left: 80px; right: 80px; top: 900px; text-align: center; }
.n { margin: 0; font: 650 84px/1 F; color: ${INK}; letter-spacing: -0.02em; }
.s { margin: 18px 0 0; font: italic 400 50px/1.1 FI; color: #A8284E; }
</style></head><body><svg viewBox="0 0 1200 1200" aria-hidden="true">${SHAPE[t.icon]}</svg><img src="${heart}" alt="">
<div class="t"><p class="n">${t.name}</p><p class="s">${t.sub || 'painted from your dog'}</p></div></body></html>`;
};

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
for (const t of TILES) {
  const html = path.join(out, '.tile.html');
  fs.writeFileSync(html, page(t));
  await tab.goto(pathToFileURL(html).href);
  await tab.evaluate(() => document.fonts.ready);
  const ok = await tab.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length >= 2 && document.querySelector('img').naturalWidth > 0);
  if (!ok) throw new Error('fonts or the heart did not load for ' + t.file);
  await tab.waitForTimeout(100);
  await tab.screenshot({ path: path.join(out, t.file) });
  console.log(`${t.file}  alt: ${t.alt}`);
}
fs.rmSync(path.join(out, '.tile.html'), { force: true });
await browser.close();
