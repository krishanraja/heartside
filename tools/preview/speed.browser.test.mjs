// Speed (Krish, 5 Nov: "let's make sure that everything loads as fast as possible"). The rendered theme
// (render.mjs) in Chromium; nothing leaves localhost. Each test here failed on the theme of 5 November and
// passes after the change it names (docs/review/asks-2026-11-05/speed-report.md and speed-review.md).
//
//   node --test tools/preview/speed.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
// HS_OUT: another rendered theme (an older revision), to show a test failing before its change
const out = process.env.HS_OUT ? path.resolve(process.env.HS_OUT) : path.join(here, 'out');
if (!fs.existsSync(path.join(out, 'assets', 'hs-journey-choose.js'))) execFileSync(process.execPath, ['render.mjs'], {cwd: here, stdio: 'ignore'});
const PAGE_FOR = {'your-dogs-illustrated-mug': 'product-mug-native.html', 'your-dogs-portrait': 'product-portrait-native.html', 'your-dogs-personality-blanket': 'product-blanket-native.html'};
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2'};
const URLS = {print: '/products/your-dogs-portrait?journey=1&variant=58300000000001', mug: '/products/your-dogs-illustrated-mug?journey=1&variant=58300000000003', blanket: '/products/your-dogs-personality-blanket?journey=1'};
const GIFTS = {mug: {url: '/products/your-dogs-illustrated-mug', handle: 'your-dogs-illustrated-mug', price: 45}, blanket: {url: '/products/your-dogs-personality-blanket', handle: 'your-dogs-personality-blanket', price: 129}, print: {url: '/products/your-dogs-portrait', handle: 'your-dogs-portrait', price: 59}};
// what journey-product.browser.test.mjs stands in for: the product id, the painting counter, Teeinblue's fields
const STANDIN = '<script>(' + (() => {
  window.__painted = 0;
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { if (/^hs2-blanket-upload:/.test(k) && /"stage":"sent"/.test(v)) window.__painted++; return set.call(this, k, v); };
  const ids = {'your-dogs-illustrated-mug': 16160217956734, 'your-dogs-portrait': 16151384260990, 'your-dogs-personality-blanket': 16158073880958};
  const pid = ids[(location.pathname.split('/')[2] || '')];
  if (pid) window.ShopifyAnalytics = {meta: {product: {id: pid}}};
  document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('#buy input.tee-photo-input');
    if (!input) return;
    input.id = 'tee-photo-standin';
    const photo = input.closest('.tee-field') || input.closest('.tee-photo');
    photo.classList.add('tee-field--photo');
    const field = (label, body) => { const d = document.createElement('div'); d.className = 'tee-field'; d.innerHTML = '<div class="tee-field__heading"><span>' + label + '</span></div>' + body; photo.before(d); };
    const pick = opts => '<select>' + opts.map(o => '<option>' + o + '</option>').join('') + '</select>';
    field('Personality', '<input type="text">');
    field('Artwork style', pick(['Cinematic', 'Painterly', 'Vintage screenprint', 'Comic book', 'Cut-paper collage', 'Fine ink drawing']));
    field('Artwork tone', pick(['Sentimental', 'Warm with a wink', 'Hilarious']));
    for (const name of ['Style direction', 'Tone direction', 'Energy']) field(name, '<input type="text" data-brief="' + name + '">');
    document.dispatchEvent(new Event('teeinblue-event-component-injected'));
  }, true);
}).toString() + ')();</script>';
// Teeinblue's app block puts app-v1.js in the head as a classic defer script, ahead of the theme's own
// (speed-review.md, flaw 1). Here it is a stand-in held back by the server for `hold` ms.
const TIB = '<script src="/__tib/app-v1.js" defer="defer"></script>';
const holds = {tib: 0};
// a held response by path (the hero pictures), and a stand-in third-party pixel that holds window load back
const held = [];
const PIXEL = '<script async src="/__pixel.js"></script>';
let pixelMs = 0;
let server, base, browser;
before(async () => {
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/cart.js') { res.writeHead(200, {'Content-Type': 'application/json'}); return res.end('{"items":[]}'); }
    if (u.pathname === '/__photo.jpg') { res.writeHead(200, {'Content-Type': 'image/jpeg'}); return res.end(fs.readFileSync(path.join(here, '../../assets/photos/pug-autumn-leaves.jpg'))); }
    if (u.pathname === '/__tib/app-v1.js') {
      return setTimeout(() => { res.writeHead(200, {'Content-Type': 'text/javascript'}); res.end('window.__tibAt = performance.now();'); }, holds.tib);
    }
    if (u.pathname === '/__pixel.js') return setTimeout(() => { res.writeHead(200, {'Content-Type': 'text/javascript'}); res.end(''); }, pixelMs);
    const h = held.find(x => x.re.test(u.pathname));
    if (h && !req.__held) { req.__held = true; return setTimeout(() => server.emit('request', req, res), h.ms); }
    let f = path.join(out, decodeURIComponent(u.pathname));
    if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
    else if (u.pathname.startsWith('/products/')) f = path.join(out, PAGE_FOR[u.pathname.split('/')[2]] || 'missing');
    else if (u.pathname === '/') f = path.join(out, 'index.html');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'});
    if (u.pathname.startsWith('/products/')) return res.end(fs.readFileSync(f, 'utf8').replace('<head>', '<head>' + STANDIN + TIB));
    if (u.pathname === '/' && pixelMs) return res.end(fs.readFileSync(f, 'utf8').replace('</head>', PIXEL + '</head>'));
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

// a buyer who chose the photo, the style and the gifts on the home page (hs-journey.js handOver)
async function giftPage({queue = ['mug', 'print'], viewport = {width: 390, height: 844}} = {}) {
  const ctx = await browser.newContext({viewport, isMobile: true, hasTouch: true});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(u => !u.href.startsWith(base) && !/^(data|blob):/.test(u.href), r => r.abort());
  const t = Date.now() - 60000;
  await page.addInitScript(([t, queue, URLS, GIFTS]) => {
    if (sessionStorage.getItem('hs2-review')) return;
    sessionStorage.setItem('hs-artwork-choices-v1', JSON.stringify({version: 1, style: 'collage', tone: 'warm'}));
    sessionStorage.setItem('hs2-review', JSON.stringify({dog: '', person: '', hs3_lines: null, hs3_copy_owner: 'generated', hs3_photo_t: t, hs3_art_profile: null, hs3_energy: '',
      hs3_art_choices: {style: 'collage', tone: 'warm'}, hs_brief_input: {breed: '', pronoun: 'they', archetype: '', likeness: true},
      hs_journey: {t: Date.now(), mode: 'photo-first', gift: queue[0], tone: 'warm', style: 'collage', queue: queue.map(g => ({gift: g, url: URLS[g]})), gifts: GIFTS, notes: {}, answered: false, compose: {url: '', ai: false}}}));
  }, [t, queue, URLS, GIFTS]);
  await page.goto(base + '/robots.txt');
  await page.evaluate(t => fetch('/__photo.jpg').then(r => r.blob()).then(b => new Promise((resolve, reject) => {
    const o = indexedDB.open('hs2', 1);
    o.onupgradeneeded = () => o.result.createObjectStore('files');
    o.onerror = () => reject(o.error);
    o.onsuccess = () => { const tx = o.result.transaction('files', 'readwrite'); tx.objectStore('files').put({file: new File([b], 'dog.jpg', {type: 'image/jpeg'}), t}, 'headshot'); tx.oncomplete = () => { o.result.close(); resolve(); }; };
  })), t);
  return {page, ctx, errors};
}

test("1. the gift page's questions do not wait for Teeinblue's app-v1.js: the studio at once, the first question by 9 s, and the answer reaches the order once hs2.js runs", async () => {
  holds.tib = 14000;
  const {page, ctx, errors} = await giftPage();
  try {
    const t0 = Date.now();
    await page.goto(base + URLS.mug, {waitUntil: 'commit'});
    // hs-journey-choose.js has taken the frame (its phase attribute), long before Teeinblue arrives
    await page.waitForSelector('[data-hs-jm][data-phase="studio"]', {timeout: 4000});
    // the studio's few seconds, then the first question, still before Teeinblue
    await page.waitForSelector('[data-hsj-screen="name"] input', {state: 'visible', timeout: 9000});
    assert.equal(await page.evaluate(() => typeof window.__tibAt), 'undefined', 'Teeinblue is still held back');
    assert.equal(await page.evaluate(() => !!window.__hs2api), false, 'hs2.js waits behind it, as on the live store');
    await page.fill('[data-hsj-screen="name"] input', 'Honey');
    await page.click('[data-hsj-screen="name"] [data-hsj-next], [data-hsj-screen="name"] .hsj-btn');
    assert.ok(Date.now() - t0 < 13000, 'answered while Teeinblue was held');
    // once Teeinblue and hs2.js run, the answer given before them is on the order
    await page.waitForFunction(() => window.__hs2api && (JSON.parse(sessionStorage.getItem('hs2-review') || '{}').dog === 'Honey'), null, {timeout: 12000});
    // one painting, once hs2.js has the photo
    await page.waitForFunction(() => window.__painted >= 1, null, {timeout: 15000});
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.__painted), 1, 'one painting per gift');
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('hs-jm-on')), true, 'journey mode held');
    assert.deepEqual(errors, []);
  } finally { holds.tib = 0; await ctx.close(); }
});

// ------------------------------------------------------------------------------------------- the home page
async function home({reducedMotion = 'no-preference', javaScriptEnabled = true, viewport = {width: 390, height: 844}} = {}) {
  const ctx = await browser.newContext({viewport, isMobile: viewport.width < 900, hasTouch: true, reducedMotion, javaScriptEnabled});
  const page = await ctx.newPage();
  const errors = [], reqs = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(u => !u.href.startsWith(base) && !/^(data|blob):/.test(u.href), r => r.abort());
  page.on('request', r => reqs.push({url: r.url().replace(base, ''), at: Date.now()}));
  return {ctx, page, errors, reqs};
}
const pictures = reqs => reqs.filter(r => /hs-(hero|ex)-/.test(r.url)).map(r => r.url.split('/').pop());
const onSet = page => page.evaluate(() => [...document.querySelectorAll('[data-hss-reel-track] > li')].findIndex(li => li.classList.contains('is-on')));
// the same figures each time: the ones on the page when first measured (the strip's loop copies come later)
const boxes = page => page.evaluate(() => (window.__figs = window.__figs || [...document.querySelectorAll('.hss-fig')].filter(f => f.offsetParent)).map(f => { const r = f.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)].join('x'); }));

test('2a. home: nothing else starts before the first hero picture has arrived', async () => {
  held.push({re: /hs-hero-golden-/, ms: 3000});
  const {ctx, page, errors, reqs} = await home();
  try {
    let goldenDone = 0;
    page.on('requestfinished', r => { if (/hs-hero-golden-/.test(r.url()) && !goldenDone) goldenDone = Date.now(); });
    await page.goto(base + '/', {waitUntil: 'commit'});
    await page.waitForFunction(() => { const i = document.querySelector('[data-hss-reel] img'); return i && i.complete && i.naturalWidth > 0; }, null, {timeout: 10000});
    const early = reqs.filter(r => /hs-(hero|ex)-/.test(r.url) && !/golden/.test(r.url) && r.at < goldenDone);
    assert.deepEqual(early.map(r => r.url.split('/').pop()), [], 'no other example picture before the first one is in');
    assert.deepEqual(errors, []);
  } finally { held.length = 0; await ctx.close(); }
});

test("2b. home: the reel stays on the first set until the second set's picture is in, then moves on; one set loads at a time", async () => {
  held.push({re: /hs-hero-lab-/, ms: 6000});
  const {ctx, page, errors, reqs} = await home();
  try {
    await page.goto(base + '/');
    const t0 = Date.now();
    await page.waitForTimeout(4500);
    assert.equal(await onSet(page), 0, 'still the first set while the second picture is on its way');
    assert.deepEqual(pictures(reqs).filter(u => /hs-hero-(frenchie|doodle|dachshund|shepherd)-/.test(u)), [], 'the third set waits for the second');
    await page.waitForFunction(() => [...document.querySelectorAll('[data-hss-reel-track] > li')].findIndex(li => li.classList.contains('is-on')) === 1, null, {timeout: 9000});
    assert.ok(Date.now() - t0 > 4500);
    const lab = await page.evaluate(() => { const i = document.querySelectorAll('[data-hss-reel-track] > li')[1].querySelector('img'); return i.complete && i.naturalWidth > 0; });
    assert.equal(lab, true, 'it turned to a set whose picture is there');
    assert.deepEqual(errors, []);
  } finally { held.length = 0; await ctx.close(); }
});

test('2c. home: the reel does not wait for window load (a tracking pixel held back 20 s)', async () => {
  held.push({re: /hs-hero-golden-/, ms: 2500});
  pixelMs = 20000;
  const {ctx, page, errors} = await home();
  try {
    await page.goto(base + '/', {waitUntil: 'commit'});
    await page.waitForFunction(() => [...document.querySelectorAll('[data-hss-reel-track] > li')].findIndex(li => li.classList.contains('is-on')) >= 1, null, {timeout: 9000});
    assert.equal(await page.evaluate(() => document.readyState), 'interactive', 'window load still held back');
    assert.deepEqual(errors, []);
  } finally { held.length = 0; pixelMs = 0; await ctx.close(); }
});

test('2d. a journey step opened directly (/?step=gifts): no hidden hero set or example picture downloads', async () => {
  const {ctx, page, errors, reqs} = await home();
  try {
    await page.goto(base + '/?step=gifts');
    await page.waitForTimeout(6000);
    // the showcase is hidden on a step (hs-showcase.css): the first hero picture is the only example fetched
    assert.deepEqual(pictures(reqs).filter(u => !/hs-hero-golden-/.test(u) && /hs-hero-|hs-ex-(flow|tone|style|scene)/.test(u)), [], 'nothing hidden downloads');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('2e. home: every picture box keeps its size when its picture arrives, and the strip and the flow fill near the screen', async () => {
  const {ctx, page, errors} = await home();
  try {
    await page.goto(base + '/', {waitUntil: 'domcontentloaded'});
    const before = await boxes(page);
    await page.waitForLoadState('load');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => [...document.querySelectorAll('.hss-fig img')].every(i => !i.hasAttribute('data-hss-src')), null, {timeout: 15000});
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    assert.deepEqual(await boxes(page), before, 'no box changes size');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('2f. reduced motion: the second set (peeking in the swipe row) has its picture at once, the rest load as swiped to', async () => {
  const {ctx, page, errors} = await home({reducedMotion: 'reduce'});
  try {
    await page.goto(base + '/', {waitUntil: 'domcontentloaded'});
    const sets = await page.evaluate(() => [...document.querySelectorAll('[data-hss-reel-track] > li img')].map(i => ({src: !!i.getAttribute('src'), lazy: i.loading})));
    assert.equal(sets[1].src, true, 'set 2 is filled by DOMContentLoaded');
    assert.deepEqual(sets.slice(2).map(s => s.lazy), ['lazy', 'lazy', 'lazy', 'lazy']);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('2g. without JavaScript every example picture is still there; with hs-showcase.js blocked they are filled after load', async () => {
  const off = await home({javaScriptEnabled: false});
  try {
    await off.page.goto(base + '/');
    const shown = await off.page.evaluate(() => [...document.querySelectorAll('.hss-fig')].map(f => [...f.querySelectorAll('img')].filter(i => getComputedStyle(i).display !== 'none' && i.getAttribute('src')).length));
    assert.ok(shown.length >= 25 && shown.every(n => n === 1), 'one picture showing in every figure: ' + shown.join(','));
  } finally { await off.ctx.close(); }
  const {ctx, page} = await home();
  try {
    await page.route(/hs-showcase\.js/, r => r.abort());
    await page.goto(base + '/');
    await page.waitForFunction(() => [...document.querySelectorAll('.hss-fig img')].every(i => i.getAttribute('src')), null, {timeout: 8000});
  } finally { await ctx.close(); }
});

// ------------------------------------------------------------------------------------- the dog detector
// Ruling (Krish, 2026-11-05): the 18 MB dog detector loads only after a photo is chosen, on fast connections, still
// checking in the background. Its "no dog found" and "too far" findings are asked at Start painting, as two dogs are.
const PHOTO = path.join(here, '../../assets/photos/pug-autumn-leaves.jpg');
const DETECTOR = /tfjs|coco-ssd|tf\.min\.js|storage\.googleapis\.com/;
async function photoStep({connection = null} = {}) {
  const {ctx, page, errors} = await home();
  const detector = [];
  page.on('request', r => { if (DETECTOR.test(r.url())) detector.push(r.url()); });
  if (connection) await page.addInitScript(c => { Object.defineProperty(Navigator.prototype, 'connection', {get: () => c, configurable: true}); }, connection);
  await page.goto(base + '/?step=photo&gift=blanket');
  await page.waitForSelector('[data-hsj-file]', {state: 'attached'});
  return {ctx, page, errors, detector};
}
async function toGifts(page) {
  await page.waitForURL(/step=look/);
  await page.locator('[data-hsj-next]').click();
  await page.waitForURL(/step=tone/);
  await page.locator('[data-hsj-next]').click();
  await page.waitForSelector('[data-hsj-screen="gifts"]');
}

test('3a. the photo step never loads the dog detector before a photo is chosen', async () => {
  const {ctx, page, errors, detector} = await photoStep();
  try {
    await page.waitForTimeout(5000);
    assert.deepEqual(detector, [], 'nothing of the detector is fetched on the photo step');
    // once a photo is chosen on a fast line, it loads, out of sight
    await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
    await page.waitForURL(/step=look/);
    await page.waitForFunction(() => true);
    await page.waitForTimeout(1500);
    assert.ok(detector.length > 0, 'it loads after the pick');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

for (const [label, connection] of [['a 3G connection', {effectiveType: '3g', saveData: false}], ['Data Saver on', {effectiveType: '4g', saveData: true}]]) {
  test(`3b. with ${label}, the detector never loads, even after a photo is chosen`, async () => {
    const {ctx, page, errors, detector} = await photoStep({connection});
    try {
      await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
      await toGifts(page);
      await page.waitForTimeout(2000);
      assert.deepEqual(detector, []);
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}

for (const [code, title] of [['nodog', "We couldn't find a dog in this photo"], ['far', 'Your dog looks small in this photo']]) {
  test(`3c. "${code}" found out of sight: Start painting asks once, the safe answer under the finger, and "Paint this photo anyway" paints`, async () => {
    const {ctx, page, errors} = await photoStep();
    try {
      // the pick runs the pixel checks only; the detector's check comes back later with its finding
      await page.evaluate(code => { window.__checks = []; window.HSPhotoQuality = {
        check: (f, o) => { window.__checks.push(o && o.detect === false ? 'pixels' : 'dogs'); return Promise.resolve(o && o.detect === false ? {verdict: 'ok', reasons: [], detection: null} : {verdict: 'reject', overridable: true, reasons: [{code, message: ''}], detection: {dogs: []}}); },
        loadDetector: () => new Promise(r => setTimeout(() => r({}), 300))}; }, code);
      await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
      await toGifts(page);
      await page.waitForFunction(() => window.__checks.length >= 2, null, {timeout: 5000});
      assert.deepEqual(await page.evaluate(() => window.__checks), ['pixels', 'dogs'], 'nothing refused at the pick');
      await page.waitForTimeout(400);
      await page.locator('[data-hsj-start]').dblclick();
      await page.waitForTimeout(800);
      assert.equal(await page.isVisible('[data-hsj-dogs]'), true, 'the question stays up after a double tap');
      assert.equal(await page.textContent('#hsj-dogs-title'), title);
      assert.doesNotMatch(await page.textContent('[data-hsj-dogs]'), /!|—/);
      assert.match(page.url(), /step=gifts/, 'nothing paints yet');
      const under = await page.evaluate(() => { const s = document.querySelector('[data-hsj-start]').getBoundingClientRect(); const e = document.elementFromPoint(s.left + s.width / 2, s.top + s.height / 2); return e && e.closest('button') && e.closest('button').hasAttribute('data-hsj-dogs-repick'); });
      assert.equal(under, true, 'Choose another photo sits where Start painting was');
      await page.locator('[data-hsj-dogs-keep]').click();
      await page.waitForURL(/\/products\/your-dogs-personality-blanket\?.*journey=1/, {waitUntil: 'commit'});
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}
