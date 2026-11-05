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
const out = path.join(here, 'out');
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
let server, base, browser;
before(async () => {
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/cart.js') { res.writeHead(200, {'Content-Type': 'application/json'}); return res.end('{"items":[]}'); }
    if (u.pathname === '/__photo.jpg') { res.writeHead(200, {'Content-Type': 'image/jpeg'}); return res.end(fs.readFileSync(path.join(here, '../../assets/photos/pug-autumn-leaves.jpg'))); }
    if (u.pathname === '/__tib/app-v1.js') {
      return setTimeout(() => { res.writeHead(200, {'Content-Type': 'text/javascript'}); res.end('window.__tibAt = performance.now();'); }, holds.tib);
    }
    let f = path.join(out, decodeURIComponent(u.pathname));
    if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
    else if (u.pathname.startsWith('/products/')) f = path.join(out, PAGE_FOR[u.pathname.split('/')[2]] || 'missing');
    else if (u.pathname === '/') f = path.join(out, 'index.html');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'});
    if (u.pathname.startsWith('/products/')) return res.end(fs.readFileSync(f, 'utf8').replace('<head>', '<head>' + STANDIN + TIB));
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
