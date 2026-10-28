// Teeinblue's chrome on the native gift pages (28 Oct acceptance, Krish's stills S15 to S21 and the
// four order recordings), at Krish's phone width. The real hs2.css and the real hs2.js functions over
// a Teeinblue stand-in built from the classes in fixtures/teeinblue-classes.json and the ones hs2
// already targets. Teeinblue's fixed Personalize bar, Preview, form header, upload count and its own
// "added to cart" line are put away; its words read "Add to cart", "Adjust the framing", "Color" and
// "Framed or unframed", again after it redraws; the crop dialog stays on screen; its arrows leave the
// mug's middle; our thumbnails keep one row; "Your design" is never current while one of Teeinblue's
// sample slides is on show; a fixed bar never covers the page's end; Buddy's line wraps without an
// orphan; and a buyer arriving from the chat never sees the direct-visit offer flash up.
//
//   node --test tools/preview/tib-chrome.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {deflateSync} from 'node:zlib';
import {chromium} from 'playwright';
import {Liquid} from 'liquidjs';
import {transformSync} from 'esbuild';

const root = new URL('../../', import.meta.url);
const source = readFileSync(new URL('shopify/assets/hs2.js', root), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
// HS_CHROME_CSS_BASELINE=<rev> runs today's code against that revision's stylesheet, to prove the rules
const css = process.env.HS_CHROME_CSS_BASELINE ? execFileSync('git', ['show', process.env.HS_CHROME_CSS_BASELINE + ':shopify/assets/hs2.css'], {cwd: root, encoding: 'utf8'}) : readFileSync(new URL('shopify/assets/hs2.css', root), 'utf8');
function png(w, h, [r, g, b]) {
  const crcTable = Array.from({length: 256}, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xFFFFFFFF; for (const x of buf) c = crcTable[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3).map((_, i) => [r, g, b][i % 3])]);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(Array(h).fill(row)))), chunk('IEND', Buffer.alloc(0))]);
}
const IMG = png(60, 60, [200, 120, 90]);
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });
async function open(html, {width = 360, height = 640, init} = {}) {
  const page = await browser.newPage({viewport: {width, height}});
  const offsite = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  if (init) await page.addInitScript(init);
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost') { offsite.push(url.href); return route.abort(); }
    if (url.pathname === '/') return route.fulfill({contentType: 'text/html', body: html});
    if (url.pathname.endsWith('.png')) return route.fulfill({contentType: 'image/png', body: IMG});
    return route.fulfill({status: 404, body: ''});
  });
  await page.goto('http://localhost/');
  return {page, offsite, errors};
}
const thumbs = n => Array.from({length: n}, (_, i) => `<button type="button" data-hs2-thumb="/p${i}.png" aria-current="false"><img src="/p${i}.png" alt="" width="76" height="76"></button>`).join('');
const product = `<div class="hs2"><div class="hs2-wrap hs2-product hs2-product--tib" id="buy" data-hs2-artwork-kind="mug" data-hs2-purchase-enabled="true" data-hs2-option-labels='{"size":"Size"}'>
<div class="hs2-product__media" data-hs2-media data-tib="off">
 <div class="hs2-product__stage" data-hs2-stage style="--hs2-ratio: 1"><div class="hs2-product__tib" data-hs2-tib-gallery>
  <div class="tee-gallery-wrapper"><div class="tee-gallery-content"><div class="tee-gallery"><div class="tee-gallery__stage" style="position:relative">
   <div class="tee-slider"><div class="tee-slider__inner" style="overflow:hidden"><div class="tee-slider__track" style="display:flex">
    <div class="tee-slide" style="flex:0 0 100%"><img src="/design.png" alt="" width="600" height="600" style="display:block;width:100%;height:auto"></div>
    <div class="tee-slide" style="flex:0 0 100%"><img src="/sample.png" alt="" width="600" height="600" style="display:block;width:100%;height:auto"></div>
   </div></div></div>
   <button type="button" aria-label="Previous" style="position:absolute;top:50%;left:0;transform:translateY(-50%);width:48px;height:48px">&lsaquo;</button>
   <button type="button" aria-label="Next" style="position:absolute;top:50%;right:0;transform:translateY(-50%);width:48px;height:48px">&rsaquo;</button>
  </div></div></div></div>
 </div></div>
 <div class="hs2-product__thumbs"><button type="button" class="hs2-product__thumb-preview" data-hs2-thumb-preview aria-current="false">Your design</button>${thumbs(5)}</div>
</div>
<div class="hs2-product__info">
 <div class="tee-form-wrapper"><div class="tee-campaign">
  <div class="tee-form-header"><span class="tee-form-header__title">Personalize</span></div>
  <div class="tee-option tee-option--color"><label class="tee-option__title">color</label><div class="tee-row"><div class="tee-radio active"><label class="tee-radio-label"><span>Black</span></label></div><div class="tee-radio"><label class="tee-radio-label"><span>Red</span></label></div></div></div>
  <div class="tee-option"><label class="tee-option__title">Available Products</label><div class="tee-row"><div class="tee-radio active"><label class="tee-radio-label"><span>Unframed</span></label></div><div class="tee-radio"><label class="tee-radio-label"><span>Framed</span></label></div></div></div>
  <div class="tee-field tee-field--photo"><div class="tee-photo"><div class="tee-photo-action"><button type="button" class="tee-btn tee-btn--upload">Choose another image</button><button type="button" class="tee-btn tee-btn--recustomize"><span>Recustomize image</span></button></div><p><i>9</i> You have 3/5 image effect uploads remaining</p></div></div>
  <div class="tee-form-actions"><div class="tee-form-action"><button type="button" class="tee-btn tee-btn--preview">Preview</button></div><div class="tee-form-action"><button type="button" class="tee-btn tee-btn--atc" id="teeAtcButton">Add To Cart</button></div></div>
  <div>This item has been added to cart! <a href="/cart">View cart</a></div>
 </div></div>
</div></div></div>
<div class="tee-btn-wrapper--personalize" style="position:fixed;bottom:0;left:0;right:0"><button type="button" class="tee-btn tee-btn--personalize">Personalize</button></div>
<div class="teeinblue-item"><div class="vm--container" style="position:fixed;inset:0"><div class="vm--modal" style="position:absolute;top:40px;left:-120px;width:600px;height:480px"><div class="tee-dialog-image-cropper"><img src="/crop.png" alt="" width="560" height="420"></div></div></div></div>`;
const fns = () => ['relabelOptions', 'tibChrome', 'syncTibAgreement', 'tibGallery', 'tibSlideShown'].map(section).join('\n');
const stubs = `var state={hs3_lines:{meaning:'x'}}, blanketAcceptedKey='';
  function nativeArtworkPurchase(){return true;} function blanketReviewAccepted(){return false;} function portraitSignLine(){}
  function v3Kind(){return 'mug';} function blanketArtPreview(){return false;} function previewHasArt(){return false;}`;

for (const minified of [false, true]) {
  const mode = minified ? 'minified' : 'source';
  test(`${mode}: Teeinblue's chrome is put away and its words read like ours, again after it redraws`, async () => {
    const {page, offsite, errors} = await open(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${product}</body></html>`);
    try {
      const code = fns() + '\n' + stubs + '\nrelabelOptions();';
      await page.addScriptTag({content: minified ? transformSync(code, {minify: true}).code : code});
      const shown = sel => page.evaluate(s => { const el = document.querySelector(s); return !!el && getComputedStyle(el).display !== 'none' && !!el.getClientRects().length; }, sel);
      for (const sel of ['.tee-btn-wrapper--personalize', '.tee-form-action:has(.tee-btn--preview)', '.tee-form-header', '.tee-photo > p', '.tee-campaign > div:last-child'])
        assert.equal(await shown(sel), false, sel + ' is put away');
      for (const sel of ['#teeAtcButton', '.tee-btn--upload', '.tee-btn--recustomize', '.tee-option'])
        assert.equal(await shown(sel), true, sel + ' stays');
      const words = () => page.evaluate(() => ({atc: document.querySelector('#teeAtcButton').textContent, recrop: document.querySelector('.tee-btn--recustomize').textContent,
        titles: [...document.querySelectorAll('.tee-option__title')].map(t => t.textContent)}));
      assert.deepEqual(await words(), {atc: 'Add to cart', recrop: 'Adjust the framing', titles: ['Color', 'Framed or unframed']});
      // Teeinblue redraws: its own words come back, and go again
      await page.evaluate(() => { document.querySelector('#teeAtcButton').textContent = 'Add To Cart'; document.querySelector('.tee-option__title').textContent = 'color'; });
      await page.waitForFunction(() => document.querySelector('#teeAtcButton').textContent === 'Add to cart');
      assert.deepEqual(await words(), {atc: 'Add to cart', recrop: 'Adjust the framing', titles: ['Color', 'Framed or unframed']});
      // the crop dialog stays on a 360px screen
      const crop = await page.evaluate(() => { const m = document.querySelector('.vm--modal').getBoundingClientRect(), i = document.querySelector('.tee-dialog-image-cropper img').getBoundingClientRect(); return {left: m.left, right: m.right, img: i.right}; });
      assert.ok(crop.left >= 0 && crop.right <= 360 && crop.img <= 360, JSON.stringify(crop));
      await page.evaluate(() => document.querySelector('.teeinblue-item').remove());
      // the arrows go to the bottom corners, small, off the mug's middle
      const arrows = await page.evaluate(() => { const st = document.querySelector('[data-hs2-stage]').getBoundingClientRect();
        return [...document.querySelectorAll('.tee-gallery__stage > button')].map(b => { const r = b.getBoundingClientRect(); return {w: r.width, bottomGap: st.bottom - r.bottom, fromTop: r.top - st.top, left: r.left - st.left, right: st.right - r.right, h: st.height}; }); });
      for (const a of arrows) { assert.equal(a.w, 36); assert.ok(a.bottomGap >= 0 && a.bottomGap <= 20, JSON.stringify(a)); assert.ok(a.fromTop > a.h - 56, JSON.stringify(a)); }
      assert.ok(arrows[0].left <= 12 && arrows[1].right <= 12, 'each keeps its side');
      // six thumbnails at 360: one row, no sideways scroll on the page
      await page.evaluate(() => document.querySelector('[data-hs2-media]').setAttribute('data-tib', 'on'));
      const row = await page.evaluate(() => ({tops: [...new Set([...document.querySelectorAll('.hs2-product__thumbs button')].filter(b => b.getClientRects().length).map(b => Math.round(b.getBoundingClientRect().top)))], count: [...document.querySelectorAll('.hs2-product__thumbs button')].filter(b => b.getClientRects().length).length, page: document.documentElement.scrollWidth}));
      assert.equal(row.count, 6); assert.equal(row.tops.length, 1, 'no sixth photo alone on a second row'); assert.ok(row.page <= 360, 'no sideways scroll');
      // a fixed bar at the bottom never covers the end of the page
      assert.ok(await page.evaluate(() => { document.documentElement.classList.add('hs2-has-next'); return parseFloat(getComputedStyle(document.querySelector('#buy')).paddingBottom); }) >= 96);
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await page.close(); }
  });

  test(`${mode}: "Your design" is current only while the buyer's design is the slide on show`, async () => {
    const {page, offsite, errors} = await open(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${product}</body></html>`);
    try {
      const code = fns() + '\n' + stubs + '\ndocument.querySelector(".teeinblue-item").remove();tibGallery();';
      await page.addScriptTag({content: minified ? transformSync(code, {minify: true}).code : code});
      const current = () => page.evaluate(() => [...document.querySelectorAll('[data-hs2-thumb-preview], [data-hs2-thumb]')].filter(b => b.getAttribute('aria-current') === 'true').map(b => b.textContent.trim() || b.getAttribute('data-hs2-thumb')));
      assert.deepEqual(await current(), ['Your design'], 'the preview arrived and is on show');
      // Teeinblue's arrow shows its sample mug
      await page.evaluate(() => { document.querySelector('.tee-slider__track').style.transform = 'translateX(-100%)'; });
      await page.waitForFunction(() => document.querySelector('[data-hs2-thumb-preview]').getAttribute('aria-current') === 'false');
      assert.deepEqual(await current(), [], 'no thumbnail claims the sample');
      // and back to the design
      await page.evaluate(() => { document.querySelector('.tee-slider__track').style.transform = 'translateX(0)'; });
      await page.waitForFunction(() => document.querySelector('[data-hs2-thumb-preview]').getAttribute('aria-current') === 'true');
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await page.close(); }
  });
}

test("Buddy's line on a gift page never leaves one word on its own line", async () => {
  const lines = ["Gift 2 of 3. Let's make Mochi's blanket.", "Let's make Bartholomew's portrait.", "Gift 1 of 3. Let's make Maximiliana's mug.", "Let's make Pip's mug."];
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div class="hs2" style="padding:0 16px">${lines.map(l => `<div class="hs-journey"><div class="hs-journey__bar"><span class="hs-journey__buddy"></span><p class="hs-journey__line">${l}</p></div></div>`).join('')}</div></body></html>`;
  for (const width of [360, 390]) {
    const {page, offsite, errors} = await open(html, {width});
    try {
      const last = await page.evaluate(() => [...document.querySelectorAll('.hs-journey__line')].map(p => {
        const words = []; const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); let n;
        while ((n = walk.nextNode())) { let i = 0; for (const w of n.nodeValue.split(/(\s+)/)) { if (w.trim()) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + w.length); words.push(Math.round(r.getBoundingClientRect().top)); } i += w.length; } }
        const tops = [...new Set(words)]; return tops.length < 2 ? Infinity : words.filter(t => t === tops.at(-1)).length;
      }));
      for (const [i, n] of last.entries()) assert.ok(n >= 2, `${width}px: "${lines[i]}" ends with one word alone`);
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await page.close(); }
  }
});

test('a buyer from the chat never sees the direct-visit offer flash up before hs2.js runs', async () => {
  const files = {'/hs-buddy.liquid': '<svg width="52" height="52"></svg>'};
  const engine = new Liquid({root: ['/'], extname: '.liquid', fs: {sep: '/', dirname: () => '/', contains: () => true, resolve: (r, file, ext) => '/' + file + ext, exists: async p => p in files, existsSync: p => p in files, readFile: async p => files[p], readFileSync: p => files[p]}});
  const journey = await engine.parseAndRender(readFileSync(new URL('shopify/snippets/hs-journey.liquid', root), 'utf8'), {s: {native_artwork_kind: 'mug'}, routes: {root_url: '/'}});
  // what the page shows at its first paint: read as soon as the parser has passed the card
  const html = `<!doctype html><html><head><style>${css}</style></head><body>${journey}<script>window.firstPaint={intro:document.querySelector('[data-hs-journey-intro]').hidden,line:document.querySelector('[data-hs-journey-line]').textContent};</script></body></html>`;
  for (const [saved, want] of [[{dog: 'Mochi', hs3_lines: {meaning: 'x'}}, {intro: true, line: 'Getting your mug ready.'}], [{dog: 'Mochi'}, {intro: false, line: "Hi, I'm Buddy. I help dogs pick gifts for their people."}], [null, {intro: false, line: "Hi, I'm Buddy. I help dogs pick gifts for their people."}]]) {
    const {page, offsite, errors} = await open(html, {width: 390, height: 844, init: saved ? `sessionStorage.setItem('hs2-review', ${JSON.stringify(JSON.stringify(saved))})` : undefined});
    try {
      assert.deepEqual(await page.evaluate(() => window.firstPaint), want, JSON.stringify(saved));
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await page.close(); }
  }
});
