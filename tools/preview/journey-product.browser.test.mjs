// Journey mode on a gift page, photo first (Krish, 4 Nov: "one step at a time, non-duplicative, in the right
// order"; "Nothing on this page must randomly change size"). A buyer who chose the photo, the style and the gifts
// on the home page lands on /products/<gift>?journey=1: the photo goes to the painter once by itself, asking for
// the dog in the photo (recipes v19), nothing else on the page shows, the studio shows for a few seconds and the
// questions follow on the first gift; a later gift asks nothing; Teeinblue's framing box is saved, never shown;
// one free repaint; a photo that did not carry over gets one button; a page without a photo-first journey is the
// normal page. The rendered theme (render.mjs) with its Teeinblue stand-in, in Chromium; nothing leaves localhost.
//
//   node --test tools/preview/journey-product.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out'), shots = path.join(out, 'journey-product');
fs.mkdirSync(shots, {recursive: true});
if (!fs.existsSync(path.join(out, 'assets', 'hs-journey-choose.js'))) execFileSync(process.execPath, ['render.mjs'], {cwd: here, stdio: 'ignore'});
const PAGE_FOR = {'your-dogs-illustrated-mug': 'product-mug-native.html', 'your-dogs-portrait': 'product-portrait-native.html', 'your-dogs-personality-blanket': 'product-blanket-native.html'};
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json'};
const URLS = {print: '/products/your-dogs-portrait?journey=1&variant=58300000000001', mug: '/products/your-dogs-illustrated-mug?journey=1&variant=58300000000003', blanket: '/products/your-dogs-personality-blanket?journey=1'};
const GIFTS = {mug: {url: '/products/your-dogs-illustrated-mug', handle: 'your-dogs-illustrated-mug', price: 45}, blanket: {url: '/products/your-dogs-personality-blanket', handle: 'your-dogs-personality-blanket', price: 129}, print: {url: '/products/your-dogs-portrait', handle: 'your-dogs-portrait', price: 59}};
const STANDIN = '<script>(' + (() => {
  window.__sends = 0;
  // a painting request is hs2's upload lock reaching "sent", written just before the photo goes to Teeinblue;
  // the file field itself sees the photo more than once (the hand-over, then the cleaned photo)
  window.__painted = 0;
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { if (/^hs2-blanket-upload:/.test(k) && /"stage":"sent"/.test(v)) window.__painted++; return set.call(this, k, v); };
  const ids = {'your-dogs-illustrated-mug': 101, 'your-dogs-portrait': 102, 'your-dogs-personality-blanket': 103};
  const pid = ids[(location.pathname.split('/')[2] || '')];
  if (pid) window.ShopifyAnalytics = {meta: {product: {id: pid}}};
  document.addEventListener('change', e => { if (e.target.type === 'file' && e.target.files && e.target.files.length) window.__sends++; }, true);
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
let server, base, browser, cart = [];
before(async () => {
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/cart.js') { res.writeHead(200, {'Content-Type': 'application/json'}); return res.end(JSON.stringify({items: cart})); }
    if (u.pathname === '/__add') { cart.push({handle: u.searchParams.get('h')}); res.writeHead(200); return res.end('ok'); }
    if (u.pathname === '/cart') { res.writeHead(200, {'Content-Type': 'text/html'}); return res.end('<!doctype html><title>Cart</title>'); }
    if (u.pathname === '/__photo.jpg') { res.writeHead(200, {'Content-Type': 'image/jpeg'}); return res.end(fs.readFileSync(path.join(here, '../../assets/photos/pug-autumn-leaves.jpg'))); }
    let f = path.join(out, decodeURIComponent(u.pathname));
    if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
    else if (u.pathname.startsWith('/products/')) f = path.join(out, PAGE_FOR[u.pathname.split('/')[2]] || 'missing');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    // Shopify's own headers: no store page shows inside another
    if (u.pathname.startsWith('/products/')) { res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Content-Security-Policy', "frame-ancestors 'none'"); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'});
    if (u.pathname.startsWith('/products/')) return res.end(fs.readFileSync(f, 'utf8').replace('<head>', '<head>' + STANDIN));
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

// what the home page hands over (hs-journey.js handOver): the photo's time, the style, the gifts in order, nothing else
async function open(size, {photo = true, journeyAge = 0, queue = ['print', 'mug'], answered = false, mode = 'photo-first'} = {}) {
  const ctx = await browser.newContext({viewport: size, isMobile: size.width < 900, hasTouch: true});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(u => !u.href.startsWith(base) && !/^(data|blob):/.test(u.href), r => r.abort());
  const t = Date.now() - 60000;
  await page.addInitScript(([t, photo, journeyAge, queue, URLS, GIFTS, answered, mode]) => {
    if (sessionStorage.getItem('hs2-review')) return;
    sessionStorage.setItem('hs-artwork-choices-v1', JSON.stringify({version: 1, style: 'collage', tone: 'warm'}));
    const review = {dog: answered ? 'Mowgli' : '', person: answered ? 'Sam' : '', hs3_lines: answered ? {home: 'a', spot: 'b', together: 'c', meaning: 'd'} : null, hs3_copy_owner: 'generated', hs3_photo_t: photo ? t : 0,
      hs3_art_profile: null, hs3_energy: '', hs3_art_choices: {style: 'collage', tone: 'warm'}, hs_brief_input: {breed: '', pronoun: 'they', archetype: '', likeness: true},
      hs_journey: {t: Date.now() - journeyAge, gift: queue[0], tone: 'warm', style: 'collage', queue: queue.map(g => ({gift: g, url: URLS[g]})), gifts: GIFTS, notes: {}, answered, compose: {url: '', ai: false}}};
    if (mode) review.hs_journey.mode = mode;
    sessionStorage.setItem('hs2-review', JSON.stringify(review));
    if (answered) sessionStorage.setItem('hs-journey', JSON.stringify({dog: 'Mowgli', breed: 'Border Collie', pro: 'he', rel: 'named', person: 'Sam', home: 'door', spot: 'couch', together: 'walk', meaning: 'best', tone: 'warm', noteDone: true, gifts: {}}));
  }, [t, photo, journeyAge, queue, URLS, GIFTS, answered, mode]);
  if (photo) {
    await page.goto(base + '/robots.txt');
    // a real dog photo, as the home page keeps it (a tiny one would be refused by the gift page's own check)
    await page.evaluate(t => fetch('/__photo.jpg').then(r => r.blob()).then(b => new Promise((resolve, reject) => {
      const f = new File([b], 'dog.jpg', {type: 'image/jpeg'}); const o = indexedDB.open('hs2', 1);
      o.onupgradeneeded = () => o.result.createObjectStore('files');
      o.onerror = () => reject(o.error);
      o.onsuccess = () => { const tx = o.result.transaction('files', 'readwrite'); tx.objectStore('files').put({file: f, t}, 'headshot'); tx.oncomplete = () => { o.result.close(); resolve(); }; };
    })), t);
  }
  return {page, ctx, errors};
}
const PHONES = [{width: 320, height: 568}, {width: 360, height: 640}, {width: 375, height: 667}, {width: 390, height: 844}, {width: 412, height: 915}, {width: 430, height: 932}];
const fits = page => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1);
const paintDone = page => page.evaluate(() => {
  const a = document.querySelector('[data-hs-art]');
  a.setAttribute = function (k, v) { return Element.prototype.setAttribute.call(this, k, k === 'data-state' ? 'done' : v); };
  a.setAttribute('data-state', 'done');
  a.querySelector('[data-hs-art-result]').src = '/assets/hs-ex-style-screenprint.webp';
});
const ready = page => page.evaluate(() => {
  const a = document.querySelector('[data-hs2-artwork-accept]'), b = a.cloneNode(); let on = false;
  Object.defineProperty(b, 'checked', {get: () => on, set: v => { on = !!v; }}); a.replaceWith(b);
  document.querySelector('#buy #teeAtcButton').click = () => { fetch('/__add?h=' + location.pathname.split('/')[2]); };
});

for (const size of PHONES) test(`${size.width}x${size.height}: it paints once by itself, as the dog in the photo, shows the studio, then asks while it paints`, async () => {
  const {page, ctx, errors} = await open(size);
  try {
    await page.goto(base + URLS.print);
    await page.waitForFunction(() => window.__sends > 0, null, {timeout: 15000});
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.__painted), 1, 'the photo goes to the painter once');
    const view = await page.evaluate(() => {
      const panel = document.querySelector('[data-hs-jm]');
      return {panel: !panel.hidden, phase: panel.getAttribute('data-phase'), card: !!panel.querySelector('[data-hs-jm-paint] [data-hs-art]'), title: document.querySelector('[data-hs-jm-title]').textContent,
        asked: ['[data-hs-journey]', '[data-hs-art-choices]', '[data-hs-extras]', '[data-hs2-answers]', '.hs2-product__info select', '.tee-option', '.hs-jm-tile', '.hs-jm-dot']
          .filter(s => [...document.querySelectorAll(s)].some(e => { const r = e.getBoundingClientRect(); return r.height > 1 && r.width > 1 && r.bottom > 0 && !e.closest('#buy > :not(.hs-jm)'); }))};
    });
    assert.deepEqual(view, {panel: true, phase: 'studio', card: true, title: 'Painting your dog', asked: []});
    // recipes v19: the painter is asked for the dog in the photo, with no scene from answers not given yet
    const brief = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-brief]')].map(i => [i.getAttribute('data-brief'), i.value])));
    assert.match(brief.Energy, /^The face is locked to the photo/);
    assert.match(brief['Tone direction'], /^Mood: happy and easy, with a small wink\./);
    assert.doesNotMatch(brief['Tone direction'], /walk|side-eye|brow/);
    assert.match(brief['Style direction'], /^a cut-paper collage\./);
    assert.ok(await fits(page), 'no scrolling while it paints');
    await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, size.width + '-studio.png')});
    // a few seconds later, the questions, with the painting badge in the header
    await page.waitForFunction(() => /ask=name/.test(location.hash), null, {timeout: 10000});
    assert.equal(await page.locator('[data-hsj-screen="name"] [data-hsj-paint]').count(), 1);
    assert.ok(await fits(page), 'the first question fits');
    await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, size.width + '-ask.png')});
    // the painting lands while they answer: the badge shows it, and the questions stay put
    await paintDone(page);
    await page.waitForFunction(() => document.querySelector('[data-hsj-paint]').classList.contains('is-done'), null, {timeout: 5000});
    assert.match(page.url(), /ask=name/);
    // a reload part way through goes straight back to the questions, and never paints again
    await page.reload();
    await page.waitForFunction(() => /ask=name/.test(location.hash) && document.querySelector('[data-hsj-screen="name"]'), null, {timeout: 10000});
    assert.equal(await page.evaluate(() => window.__painted), 0, 'no resend on a reload');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('a later gift: the same studio, nothing asked, the framing box saved unseen, the painting on the product, and the cart', async () => {
  cart = [];
  const {page, ctx, errors} = await open({width: 390, height: 844}, {queue: ['print', 'mug'], answered: true});
  try {
    await page.goto(base + URLS.mug);
    await page.waitForFunction(() => window.__sends > 0, null, {timeout: 15000});
    await page.waitForSelector('[data-hs-jm][data-phase="studio"]');
    assert.equal(await page.textContent('[data-hs-jm-title]'), 'Now the mug');
    assert.match(await page.textContent('[data-hs-jm-step]'), /gift 2 of 2/);
    const dock = await page.evaluate(() => Math.round(document.querySelector('[data-hs-jm-frame] .hsj-dock').getBoundingClientRect().top));
    // Teeinblue's framing box opens when the painting is back: saved as the painter framed it, never shown
    await page.evaluate(() => { const d = document.createElement('div'); d.className = 'vm--container'; d.innerHTML = '<div class="vm--modal"><button type="button" class="tee-btn">Cancel</button><button type="button" class="tee-btn">Save</button></div>'; d.querySelectorAll('button')[1].addEventListener('click', () => { window.__saved = (window.__saved || 0) + 1; d.remove(); }); document.body.appendChild(d); window.__shown = getComputedStyle(d).opacity; });
    await page.waitForFunction(() => window.__saved === 1 && !document.querySelector('.vm--container'), null, {timeout: 5000});
    assert.equal(await page.evaluate(() => window.__shown), '0', 'the framing box is never seen');
    await page.waitForTimeout(6500);
    assert.equal(await page.evaluate(() => /ask=/.test(location.hash)), false, 'nothing is asked again');
    await paintDone(page);
    await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 6000});
    assert.equal(await page.textContent('[data-hs-jm-title]'), 'Mowgli on the mug');
    assert.equal(await page.evaluate(() => Math.round(document.querySelector('[data-hs-jm-frame] .hsj-dock').getBoundingClientRect().top)), dock, 'the dock stays put as the painting lands');
    assert.ok(await fits(page));
    // the close-up is the painting itself
    await page.click('[data-hs-jm-view="close"]');
    assert.equal(await page.evaluate(() => !document.querySelector('[data-hs-jm-close]').hidden && /hs-ex-style-screenprint/.test(document.querySelector('[data-hs-jm-close] img').src)), true);
    await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, '390-reveal-later.png')});
    await ready(page);
    assert.equal(await page.isDisabled('[data-hs-jm-add]'), true, 'no add before the tick');
    await page.check('[data-hs-jm-tick]');
    await page.click('[data-hs-jm-add]');
    await page.waitForURL(/\/cart$/, {timeout: 15000});
    assert.deepEqual(cart.map(i => i.handle), ['your-dogs-illustrated-mug']);
    assert.deepEqual(errors, []);
  } finally { cart = []; await ctx.close(); }
});

test('one free repaint: the same photo once more, then the link is gone', async () => {
  const {page, ctx} = await open({width: 390, height: 844}, {queue: ['blanket'], answered: true});
  try {
    await page.goto(base + URLS.blanket);
    await page.waitForFunction(() => window.__sends > 0, null, {timeout: 15000});
    await paintDone(page);
    // hs2 offers the repaint once the painting is saved; the stand-in says it is
    await page.evaluate(() => { window.__hs2api.journeyRepaintLeft = () => !window.__repainted; window.__hs2api.journeyRepaint = () => { window.__repainted = true; window.__painted++; return true; }; });
    await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 12000});
    await page.waitForFunction(() => document.querySelector('[data-hs-jm-repaint]').style.visibility !== 'hidden');
    await page.click('[data-hs-jm-repaint]');
    await page.click('[data-hs-jm-again]');
    assert.equal(await page.evaluate(() => window.__painted), 2);
    await page.waitForSelector('[data-hs-jm][data-phase="wait"]');
    await page.evaluate(() => { document.querySelector('[data-hs-art-result]').src = '/assets/hs-ex-style-comic.webp'; });
    await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 6000});
    assert.equal(await page.evaluate(() => document.querySelector('[data-hs-jm-repaint]').style.visibility), 'hidden', 'one repaint only');
  } finally { await ctx.close(); }
});

test("a photo that did not carry over: one button opens Teeinblue's picker, and the automatic send stands down", async () => {
  const {page, ctx} = await open({width: 390, height: 844}, {photo: false});
  try {
    await page.goto(base + URLS.print);
    await page.waitForSelector('[data-hs-jm][data-phase="nophoto"]', {timeout: 12000});
    assert.equal(await page.textContent('[data-hs-jm-add]'), "Choose your dog's photo");
    assert.ok(await fits(page));
    await page.evaluate(() => { window.__picked = 0; document.querySelectorAll('#buy input[type=file]').forEach(i => i.addEventListener('click', e => { e.preventDefault(); window.__picked++; })); });
    await page.click('[data-hs-jm-add]');
    assert.equal(await page.evaluate(() => window.__picked), 1, "Teeinblue's own photo field opens");
    assert.ok(await page.evaluate(() => Object.keys(sessionStorage).some(k => k.startsWith('hs2-journey-sent:'))), 'no automatic send after a pick');
  } finally { await ctx.close(); }
});

test('without a photo-first journey (no ?journey=1, a stale one, or one from before photo first) the gift page is the normal page', async () => {
  for (const [url, opts] of [[URLS.print.replace('journey=1&', ''), {}], [URLS.print, {journeyAge: 7 * 36e5}], [URLS.print, {mode: ''}]]) {
    const {page, ctx} = await open({width: 390, height: 844}, opts);
    try {
      await page.goto(base + url);
      await page.waitForTimeout(2500);
      const s = await page.evaluate(() => ({panel: !document.querySelector('[data-hs-jm]').hidden, on: document.documentElement.classList.contains('hs-jm-on')}));
      assert.deepEqual(s, {panel: false, on: false}, url + ' ' + JSON.stringify(opts));
    } finally { await ctx.close(); }
  }
});

test("Teeinblue's ?variant= address after an option change keeps journey mode on a reload", async () => {
  const {page, ctx} = await open({width: 390, height: 844});
  try {
    await page.goto(base + URLS.print);
    await page.waitForSelector('[data-hs-jm]:not([hidden])');
    await page.goto(base + '/products/your-dogs-portrait?variant=58300000000009');
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => !document.querySelector('[data-hs-jm]').hidden), true);
  } finally { await ctx.close(); }
});

test('desktop: the journey card, the painting beside the headline, nothing scrolls', async () => {
  const {page, ctx} = await open({width: 1440, height: 900}, {queue: ['mug'], answered: true});
  try {
    await page.goto(base + URLS.mug);
    await page.waitForSelector('[data-hs-jm][data-phase="studio"]');
    assert.ok(await fits(page));
    await paintDone(page);
    // the studio always shows for its few seconds first (Krish, 4 Nov), then the painting
    await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 12000});
    assert.ok(await fits(page));
    await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, '1440-reveal.png')});
  } finally { await ctx.close(); }
});
