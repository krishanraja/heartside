// The speed lab (5 Nov speed ask): one throttled phone profile over a rendered theme, so a change can be
// measured before and after with the same harness. Lab figures only: Chromium's network emulation shares the
// bandwidth equally and ignores fetch priority (speed-review.md, flaw 2), so read the direction, not the
// seconds, and confirm on a phone. Nothing leaves localhost: every other host is aborted.
//
//   node speed-lab.mjs --out out --scenario gift  [--runs 3] [--tib 424]
//   node speed-lab.mjs --out out --scenario home  [--runs 3]
//   node speed-lab.mjs --out out --scenario photo [--runs 3]
//   node speed-lab.mjs --out out --scenario warm  [--runs 3]   (cache on: the gifts step, then Start painting)
//
// --out is a folder render.mjs wrote (tools/preview/out, or one rendered from an older revision).
// Profile: 390x844 at DPR 3, touch, 4x CPU slowdown, Lighthouse "Fast 3G" (562.5 ms latency, about 184 KB/s
// down, 84 KB/s up), cache off. gift: the mug page in journey mode with a stand-in for Teeinblue's app-v1.js,
// --tib KB of classic defer script in the head as on the live store, and a photo on the device as the home page
// leaves it (the painter is a local stand-in; nothing is sent anywhere).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const out = path.resolve(arg('out', path.join(here, 'out')));
const scenario = arg('scenario', 'gift'), runs = +arg('runs', 3), tibKB = +arg('tib', 424);
// --savedata: the page is told Data Saver is on (the warm-up and the detector stand down), to isolate the warm-up
const saveData = process.argv.includes('--savedata');
const PAGE_FOR = {'your-dogs-illustrated-mug': 'product-mug-native.html', 'your-dogs-portrait': 'product-portrait-native.html', 'your-dogs-personality-blanket': 'product-blanket-native.html'};
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml'};
const TIB_BODY = 'window.__tibAt=performance.now();\n/*' + 'x'.repeat(tibKB * 1024) + '*/';
const STANDIN = '<script>(' + (() => {
  const ids = {'your-dogs-illustrated-mug': 16160217956734, 'your-dogs-portrait': 16151384260990, 'your-dogs-personality-blanket': 16158073880958};
  const pid = ids[(location.pathname.split('/')[2] || '')];
  if (pid) window.ShopifyAnalytics = {meta: {product: {id: pid}}};
}).toString() + ')();</script>';
const DETECTOR = /tfjs|tf\.min\.js|ssdlite|coco-ssd|storage\.googleapis\.com/;

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/cart.js') { res.writeHead(200, {'Content-Type': 'application/json'}); return res.end('{"items":[]}'); }
  if (u.pathname === '/__photo.jpg') { res.writeHead(200, {'Content-Type': 'image/jpeg'}); return res.end(fs.readFileSync(path.join(here, '../../assets/photos/pug-autumn-leaves.jpg'))); }
  if (u.pathname === '/__tib/app-v1.js') { res.writeHead(200, {'Content-Type': 'text/javascript'}); return res.end(TIB_BODY); }
  let f = path.join(out, decodeURIComponent(u.pathname));
  if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
  else if (u.pathname.startsWith('/products/')) f = path.join(out, PAGE_FOR[u.pathname.split('/')[2]] || 'missing');
  else if (u.pathname === '/') f = path.join(out, 'index.html');
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'});
  if (u.pathname.startsWith('/products/')) return res.end(fs.readFileSync(f, 'utf8').replace('<head>', '<head>' + STANDIN + '<script src="/__tib/app-v1.js" defer="defer"></script>'));
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch();

async function phone({cache = false} = {}) {
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true});
  const page = await ctx.newPage();
  await page.route(u => !u.href.startsWith(base) && !/^(data|blob):/.test(u.href), r => r.abort());
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', {cacheDisabled: !cache});
  await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: 562.5, downloadThroughput: 180 * 1024, uploadThroughput: 84 * 1024});
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
  const reqs = new Map(), log = [];
  let t0 = 0;
  cdp.on('Network.requestWillBeSent', e => { if (!t0) t0 = e.timestamp; reqs.set(e.requestId, {url: e.request.url, start: (e.timestamp - t0) * 1000}); });
  cdp.on('Network.loadingFinished', e => { const r = reqs.get(e.requestId); if (r) { r.end = (e.timestamp - t0) * 1000; r.bytes = e.encodedDataLength; log.push(r); } });
  await page.addInitScript(() => {
    window.__lcp = 0;
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({type: 'largest-contentful-paint', buffered: true}); } catch (e) { /* old */ }
  });
  return {ctx, page, cdp, log, reqs};
}
const name = u => u.replace(base, '').split('?')[0];
const round = v => v == null ? null : Math.round(v);

async function gift() {
  const {ctx, page, log} = await phone();
  const t = Date.now() - 60000;
  await page.addInitScript(([t]) => {
    const URLS = {mug: '/products/your-dogs-illustrated-mug?journey=1&variant=58300000000003', print: '/products/your-dogs-portrait?journey=1&variant=58300000000001'};
    const GIFTS = {mug: {url: '/products/your-dogs-illustrated-mug', handle: 'your-dogs-illustrated-mug', price: 45}, print: {url: '/products/your-dogs-portrait', handle: 'your-dogs-portrait', price: 59}};
    if (!sessionStorage.getItem('hs2-review')) sessionStorage.setItem('hs-artwork-choices-v1', JSON.stringify({version: 1, style: 'collage', tone: 'warm'}));
    if (!sessionStorage.getItem('hs2-review')) sessionStorage.setItem('hs2-review', JSON.stringify({dog: '', person: '', hs3_photo_t: t, hs3_copy_owner: 'generated', hs3_art_choices: {style: 'collage', tone: 'warm'}, hs_brief_input: {breed: '', pronoun: 'they', likeness: true},
      hs_journey: {t: Date.now(), mode: 'photo-first', gift: 'mug', tone: 'warm', style: 'collage', queue: [{gift: 'mug', url: URLS.mug}, {gift: 'print', url: URLS.print}], gifts: GIFTS, notes: {}, answered: false, compose: {url: '', ai: false}}}));
    // when each part of the page is first ready, from the page's own clock
    const marks = window.__marks = {};
    const poll = setInterval(() => {
      const now = performance.now(), jm = document.querySelector('[data-hs-jm]');
      if (!marks.frame && document.documentElement.classList.contains('hs-jm-on')) marks.frame = now;
      if (!marks.studio && jm && jm.getAttribute('data-phase')) marks.studio = now;
      const q = document.querySelector('[data-hsj-screen="name"] input');
      if (!marks.question && q && q.getBoundingClientRect().height > 0) marks.question = now;
      if (!marks.hs2 && window.__hs2api) marks.hs2 = now;
      if (!marks.tib && window.__tibAt) marks.tib = window.__tibAt;
      if (marks.question && marks.hs2) clearInterval(poll);
    }, 50);
  }, [t]);
  await page.goto(base + '/robots.txt');
  await page.evaluate(t => fetch('/__photo.jpg').then(r => r.blob()).then(b => new Promise(resolve => {
    const o = indexedDB.open('hs2', 1);
    o.onupgradeneeded = () => o.result.createObjectStore('files');
    o.onsuccess = () => { const tx = o.result.transaction('files', 'readwrite'); tx.objectStore('files').put({file: new File([b], 'dog.jpg', {type: 'image/jpeg'}), t}, 'headshot'); tx.oncomplete = () => { o.result.close(); resolve(); }; };
  })), t);
  log.length = 0;
  await page.goto(base + '/products/your-dogs-illustrated-mug?journey=1&variant=58300000000003', {waitUntil: 'commit'});
  await page.waitForFunction(() => window.__marks.question && window.__marks.hs2, null, {timeout: 120000}).catch(() => {});
  const m = await page.evaluate(() => window.__marks);
  await ctx.close();
  return {frame: round(m.frame), studio: round(m.studio), question: round(m.question), tib: round(m.tib), hs2: round(m.hs2)};
}

async function home() {
  const {ctx, page, log, reqs} = await phone();
  await page.addInitScript(() => {
    const marks = window.__marks = {};
    const poll = setInterval(() => {
      const i = [...document.querySelectorAll('[data-hss-reel-track] > li')].findIndex(li => li.classList.contains('is-on'));
      if (!marks.set1 && i >= 1) marks.set1 = performance.now();
      if (marks.set1) clearInterval(poll);
    }, 50);
    addEventListener('load', () => { marks.load = performance.now(); });
  });
  await page.goto(base + '/', {waitUntil: 'commit'});
  await page.waitForFunction(() => window.__marks.load, null, {timeout: 180000}).catch(() => {});
  await page.waitForFunction(() => window.__marks.set1, null, {timeout: 30000}).catch(() => {});
  const m = await page.evaluate(() => ({lcp: window.__lcp, ...window.__marks}));
  const all = [...log];
  const golden = all.find(r => /hs-hero-golden-/.test(r.url));
  const before = golden ? all.filter(r => r.start < golden.end) : all;
  const pics = all.filter(r => /hs-(hero|ex)-/.test(r.url) && !/golden/.test(r.url));
  await ctx.close();
  return {lcp: round(m.lcp), golden: round(golden && golden.end), set1: round(m.set1), load: round(m.load),
    kbBeforeGolden: Math.round(before.reduce((s, r) => s + (r.bytes || 0), 0) / 1024),
    otherPicturesBeforeGolden: pics.filter(r => golden && r.start < golden.end).length,
    kbAll: Math.round(all.reduce((s, r) => s + (r.bytes || 0), 0) / 1024)};
}

async function photo() {
  // the photo step before a photo is chosen: does anything start the dog detector?
  const {ctx, page, reqs} = await phone();
  const seen = [];
  page.on('request', r => { if (DETECTOR.test(r.url()) || /hs-photo-quality/.test(r.url())) seen.push(name(r.url())); });
  await page.goto(base + '/?step=photo', {waitUntil: 'commit'});
  await page.waitForTimeout(20000);
  await ctx.close();
  return {detectorRequests: seen.filter(u => DETECTOR.test(u)).length};
}

async function warm() {
  // the real order with the HTTP cache on: the photo, the look, the tone, the gifts step for 20 s, then Start painting
  const {ctx, page} = await phone({cache: true});
  if (saveData) await page.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'connection', {get: () => ({effectiveType: '4g', saveData: true}), configurable: true}); });
  await page.addInitScript(() => {
    if (!/\/products\//.test(location.pathname)) return;
    const marks = window.__marks = {};
    const poll = setInterval(() => {
      const now = performance.now(), jm = document.querySelector('[data-hs-jm]');
      if (!marks.studio && jm && jm.getAttribute('data-phase')) marks.studio = now;
      const q = document.querySelector('[data-hsj-screen="name"] input');
      if (!marks.question && q && q.getBoundingClientRect().height > 0) marks.question = now;
      if (!marks.hs2 && window.__hs2api) marks.hs2 = now;
      if (marks.question && marks.hs2) clearInterval(poll);
    }, 50);
  });
  await page.goto(base + '/?step=photo&gift=blanket');
  await page.locator('[data-hsj-file]').setInputFiles(path.join(here, '../../assets/photos/pug-autumn-leaves.jpg'));
  await page.waitForURL(/step=look/, {timeout: 120000});
  await page.locator('[data-hsj-next]').click();
  await page.waitForURL(/step=tone/);
  await page.locator('[data-hsj-next]').click();
  await page.waitForURL(/step=spot/);
  await page.locator('[data-hsj-pick="spot"][data-v="couch"]').click();
  await page.waitForURL(/step=gifts/);
  await page.waitForSelector('[data-hsj-screen="gifts"]');
  await page.waitForTimeout(20000);
  const warmed = await page.evaluate(() => document.querySelectorAll('[data-hsj-warm]').length);
  await page.locator('[data-hsj-start]').click();
  await page.waitForURL(/\/products\//, {waitUntil: 'commit', timeout: 60000});
  await page.waitForFunction(() => window.__marks && window.__marks.question && window.__marks.hs2, null, {timeout: 120000}).catch(() => {});
  const m = await page.evaluate(() => window.__marks || {});
  await ctx.close();
  return {warmed, studio: round(m.studio), question: round(m.question), hs2: round(m.hs2)};
}

const fn = {gift, home, photo, warm}[scenario];
const results = [];
for (let i = 0; i < runs; i++) results.push(await fn());
console.log(JSON.stringify({scenario, out: path.relative(process.cwd(), out) || '.', profile: 'Fast 3G, 4x CPU, 390x844 DPR 3, ' + (scenario === 'warm' ? 'cache on' : 'cache off') + (saveData ? ', Data Saver' : '') + ' (lab, equal-share)', results}, null, 1));
await browser.close();
server.close();
