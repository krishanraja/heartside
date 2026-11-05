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
  // any moment the page stepped aside into journey mode, even one the gift page's script took back
  window.__jmFlash = false;
  new MutationObserver(() => { if (document.documentElement.classList.contains('hs-jm-on')) window.__jmFlash = true; }).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
  // a painting request is hs2's upload lock reaching "sent", written just before the photo goes to Teeinblue;
  // the file field itself sees the photo more than once (the hand-over, then the cleaned photo)
  window.__painted = 0;
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { if (/^hs2-blanket-upload:/.test(k) && /"stage":"sent"/.test(v)) window.__painted++; return set.call(this, k, v); };
  // the rendered pages' own product ids, so hs2.js and the inline journey check use the same key
  const ids = {'your-dogs-illustrated-mug': 16160217956734, 'your-dogs-portrait': 16151384260990, 'your-dogs-personality-blanket': 16158073880958};
  const pid = ids[(location.pathname.split('/')[2] || '')];
  if (pid) window.ShopifyAnalytics = {meta: {product: {id: pid}}};
  document.addEventListener('change', e => { if (e.target.type === 'file' && e.target.files && e.target.files.length) window.__sends++; }, true);
  // Teeinblue on the live store can take well over five seconds to open its fields (5 Nov, ten real buyers)
  const slow = +(sessionStorage.getItem('__slowTib') || 0);
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
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
  }, slow), true);
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
async function open(size, {photo = true, journeyAge = 0, queue = ['print', 'mug'], answered = false, mode = 'photo-first', slowTib = 0, badPhoto = false, onKey = 0} = {}) {
  const ctx = await browser.newContext({viewport: size, isMobile: size.width < 900, hasTouch: true});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(u => !u.href.startsWith(base) && !/^(data|blob):/.test(u.href), r => r.abort());
  const t = Date.now() - 60000;
  await page.addInitScript(([t, photo, journeyAge, queue, URLS, GIFTS, answered, mode, slowTib, onKey]) => {
    if (slowTib) sessionStorage.setItem('__slowTib', String(slowTib));
    if (sessionStorage.getItem('hs2-review')) return;
    sessionStorage.setItem('hs-artwork-choices-v1', JSON.stringify({version: 1, style: 'collage', tone: 'warm'}));
    const review = {dog: answered ? 'Mowgli' : '', person: answered ? 'Sam' : '', hs3_lines: answered ? {home: 'a', spot: 'b', together: 'c', meaning: 'd'} : null, hs3_copy_owner: 'generated', hs3_photo_t: photo ? t : 0,
      hs3_art_profile: null, hs3_energy: '', hs3_art_choices: {style: 'collage', tone: 'warm'}, hs_brief_input: {breed: '', pronoun: 'they', archetype: '', likeness: true},
      hs_journey: {t: Date.now() - journeyAge, gift: queue[0], tone: 'warm', style: 'collage', queue: queue.map(g => ({gift: g, url: URLS[g]})), gifts: GIFTS, notes: {}, answered, compose: {url: '', ai: false}}};
    if (mode) review.hs_journey.mode = mode;
    // the page that remembers it opened from this journey (hs2.js journey(): one key per product)
    if (onKey) sessionStorage.setItem('hs2-journey-on:' + onKey, String(review.hs_journey.t));
    sessionStorage.setItem('hs2-review', JSON.stringify(review));
    if (answered) sessionStorage.setItem('hs-journey', JSON.stringify({dog: 'Mowgli', breed: 'Border Collie', pro: 'he', rel: 'named', person: 'Sam', home: 'door', spot: 'couch', together: 'walk', meaning: 'best', tone: 'warm', noteDone: true, gifts: {}}));
  }, [t, photo, journeyAge, queue, URLS, GIFTS, answered, mode, slowTib, onKey]);
  if (photo) {
    await page.goto(base + '/robots.txt');
    // a real dog photo, as the home page keeps it (a tiny one would be refused by the gift page's own check)
    // badPhoto: a file named like a photo that no browser can open, so the painter's preparation refuses it
    await page.evaluate(([t, badPhoto]) => (badPhoto ? Promise.resolve(new Blob([new Uint8Array(40000).fill(7)], {type: 'image/jpeg'})) : fetch('/__photo.jpg').then(r => r.blob())).then(b => new Promise((resolve, reject) => {
      const f = new File([b], 'dog.jpg', {type: 'image/jpeg'}); const o = indexedDB.open('hs2', 1);
      o.onupgradeneeded = () => o.result.createObjectStore('files');
      o.onerror = () => reject(o.error);
      o.onsuccess = () => { const tx = o.result.transaction('files', 'readwrite'); tx.objectStore('files').put({file: f, t}, 'headshot'); tx.oncomplete = () => { o.result.close(); resolve(); }; };
    })), [t, badPhoto]);
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
    assert.match(brief.Energy, /^The face and build are locked to the photo/);
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
    // the whole print, never a crop (5 Nov judges: a zoomed close-up cut the mug dog's face off at the frame edge)
    assert.equal((await page.textContent('[data-hs-jm-view="close"]')).trim(), 'Whole print');
    const whole = await page.evaluate(() => { const img = document.querySelector('[data-hs-jm-close] img'), s = getComputedStyle(img), box = document.querySelector('.hs-jm__square').getBoundingClientRect(), r = img.getBoundingClientRect();
      return {fit: s.objectFit, transform: s.transform, inside: r.left >= box.left - 1 && r.right <= box.right + 1 && r.top >= box.top - 1 && r.bottom <= box.bottom + 1}; });
    assert.deepEqual(whole, {fit: 'contain', transform: 'none', inside: true});
    assert.match(await page.textContent('[data-hs-jm-sub]'), /all the way round the mug/);
    await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, '390-reveal-later.png')});
    // the last gift's reveal says the Christmas date from the store's own deadline, and only until that day ends
    await page.evaluate(() => document.querySelector('[data-hs2-memo]').setAttribute('data-deadline', '2099-12-04'));
    await page.waitForFunction(() => document.querySelector('[data-hs-jm-line]').textContent === 'Order by December 4 for Christmas delivery to a US address.', null, {timeout: 3000});
    await page.evaluate(() => document.querySelector('[data-hs2-memo]').setAttribute('data-deadline', '2020-12-04'));
    await page.waitForFunction(() => document.querySelector('[data-hs-jm-line]').textContent === '', null, {timeout: 3000});
    await ready(page);
    assert.equal(await page.isDisabled('[data-hs-jm-add]'), true, 'no add before the tick');
    await page.check('[data-hs-jm-tick]');
    await page.click('[data-hs-jm-add]');
    // the add says what it is doing (5 Nov judges: 15 to 40 seconds with only a dot on the button)
    assert.equal(await page.textContent('[data-hs-jm-line]'), 'Adding it to your cart. This can take up to a minute.');
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

test('a painter that takes 9 seconds to open: the photo is never called lost, and it paints once when the painter opens', async () => {
  const {page, ctx, errors} = await open({width: 390, height: 844}, {slowTib: 9000});
  try {
    await page.goto(base + URLS.print);
    await page.evaluate(() => { window.__phases = []; new MutationObserver(() => { const p = document.querySelector('[data-hs-jm]').getAttribute('data-phase'); if (window.__phases[window.__phases.length - 1] !== p) window.__phases.push(p); }).observe(document.querySelector('[data-hs-jm]'), {attributes: true, attributeFilter: ['data-phase']}); });
    await page.waitForFunction(() => window.__painted === 1, null, {timeout: 20000});
    await page.waitForTimeout(1500);
    const phases = await page.evaluate(() => window.__phases);
    assert.ok(!phases.includes('nophoto'), 'never told the photo is lost: ' + phases.join(' > '));
    assert.equal(await page.evaluate(() => window.__painted), 1, 'one painting');
    assert.equal(await page.evaluate(() => window.__hs2api.journeyStatus()), 'sent');
    assert.deepEqual(errors, []);
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

// 5 Nov, ten buyers on the live store: the portrait's and the blanket's first add failed while hs2.js registered
// the painting for checkout ("Checkout artwork is not ready"), and a second tap went through
for (const [name, fails, lands] of [['a slow checkout copy: the dock says what hs2 says, and one more press goes through by itself', 1, true],
  ['a checkout copy that fails twice: hs2 words in the dock, no third press', 2, false]]) test(name, async () => {
  cart = [];
  const {page, ctx} = await open({width: 390, height: 844}, {queue: ['blanket'], answered: true});
  try {
    await page.goto(base + URLS.blanket);
    await page.waitForFunction(() => window.__sends > 0, null, {timeout: 15000});
    await page.waitForTimeout(6500);
    await paintDone(page);
    await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 6000});
    await ready(page);
    // hs2's checkout step, as the live store showed it: its words go in a line after Teeinblue's button
    await page.evaluate(fails => {
      const atc = document.querySelector('#buy #teeAtcButton'), say = text => { let n = document.querySelector('[data-hs2-add-note]'); if (!n) { n = document.createElement('p'); n.setAttribute('data-hs2-add-note', ''); atc.after(n); } n.textContent = text; n.hidden = !text; };
      window.__presses = 0;
      atc.click = () => {
        window.__presses++;
        say("Getting Mowgli's picture ready for checkout.");
        setTimeout(() => { if (window.__presses <= fails) say('Checkout artwork is not ready. Please try Add to cart again. Your saved artwork does not need another upload.'); else { say(''); fetch('/__add?h=' + location.pathname.split('/')[2]); } }, 2500);
      };
    }, fails);
    await page.check('[data-hs-jm-tick]');
    await page.click('[data-hs-jm-add]');
    await page.waitForFunction(() => /ready for checkout/.test(document.querySelector('[data-hs-jm-line]').textContent), null, {timeout: 5000});
    if (lands) {
      await page.waitForURL(/\/cart$/, {timeout: 20000});
      assert.deepEqual(cart.map(i => i.handle), ['your-dogs-personality-blanket'], 'one line, after one tap');
    } else {
      // the second failure is said once, in the page's own words: the design is kept, one more tap from the buyer
      await page.waitForFunction(() => /didn't go through\. Your design is saved\. Tap the button again\./.test(document.querySelector('[data-hs-jm-line]').textContent), null, {timeout: 20000});
      await page.waitForTimeout(2500);
      assert.equal(await page.evaluate(() => window.__presses), 2, 'one automatic press, never a third');
      assert.equal(await page.isDisabled('[data-hs-jm-add]'), false, 'the buyer can try again');
      assert.deepEqual(cart, []);
    }
  } finally { cart = []; await ctx.close(); }
});

test('a reload mid-paint: the painting from the gone page never arrives, so the page says so, and one tap paints it again, once', async () => {
  // 5 Nov, a test buyer on the live store: a reload, then Back and Forward, and eight minutes on "Almost there"
  const {page, ctx, errors} = await open({width: 390, height: 844}, {queue: ['blanket'], answered: true});
  try {
    await page.goto(base + URLS.blanket);
    await page.waitForFunction(() => window.__painted === 1, null, {timeout: 30000});
    await page.reload();
    await page.waitForSelector('[data-hs-jm]:not([hidden])');
    await page.waitForTimeout(3000);
    assert.equal(await page.evaluate(() => window.__painted), 0, 'a reload sends nothing by itself');
    await page.waitForSelector('[data-hs-jm][data-phase="stopped"]', {timeout: 40000});
    assert.equal(await page.textContent('[data-hs-jm-title]'), 'The painting stopped');
    assert.equal((await page.textContent('[data-hs-jm-add]')).trim(), 'Paint it again');
    assert.ok(await fits(page));
    await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, '390-stopped.png')});
    await page.click('[data-hs-jm-add]');
    // the same photo goes through the device check again first (up to its own 10 s ceiling)
    await page.waitForFunction(() => window.__painted === 1, null, {timeout: 30000});
    await page.waitForSelector('[data-hs-jm][data-phase="wait"]');
    await page.waitForTimeout(3000);
    assert.equal(await page.evaluate(() => window.__painted), 1, 'one new painting');
    await paintDone(page);
    await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 8000});
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('320 px phone: another breed, typed, shows its suggestions above the button, and one tap answers it', async () => {
  // 5 Nov, a test buyer on the live store: typing "Labradoodle" on a small phone put the suggestions under the button
  const {page, ctx, errors} = await open({width: 320, height: 568});
  try {
    await page.goto(base + URLS.print);
    await page.waitForFunction(() => /ask=name/.test(location.hash), null, {timeout: 15000});
    await page.fill('[data-hsj-name]', 'Barky');
    await page.click('[data-hsj-next]');
    await page.waitForSelector('[data-hsj-screen="breed"]');
    await page.click('[data-hsj-pick="breed"][data-v="__other"]');
    await page.fill('[data-hsj-breed-search]', 'Labra');
    await page.waitForSelector('[data-hsj-breed-list] button');
    const room = await page.evaluate(() => {
      const s = document.querySelector('[data-hsj-breed-list] button').getBoundingClientRect(), d = [...document.querySelectorAll('.hsj-dock')].map(e => e.getBoundingClientRect()).filter(r => r.height > 0 && r.top > 0)[0];
      return {suggestionBottom: Math.round(s.bottom), dockTop: Math.round(d.top)};
    });
    assert.ok(room.suggestionBottom <= room.dockTop, 'the first suggestion clears the button: ' + JSON.stringify(room));
    assert.ok(await fits(page));
    await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, '320-breed-search.png')});
    await page.locator('[data-hsj-breed-list] button').first().click();
    await page.waitForFunction(() => /ask=pro/.test(location.hash), null, {timeout: 5000});
    // back to the breed: the typed breed is the one chosen, and the list is one tap away
    await page.goBack();
    await page.waitForSelector('[data-hsj-screen="breed"] [data-hsj-pick="breed"][data-v="__other"].is-on');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

// 5 Nov review: on 601 to 700 px tall phones the picture covered the support line and the free repaint sat under the dock
for (const size of [{width: 360, height: 640}, {width: 375, height: 667}, {width: 390, height: 700}, {width: 320, height: 568}, {width: 412, height: 915}]) test(`${size.width}x${size.height}: the reveal keeps the words, the picture, the repaint and the dock apart`, async () => {
  for (const gift of ['mug', 'print', 'blanket']) {
    const {page, ctx} = await open(size, {queue: [gift], answered: true});
    try {
      await page.goto(base + URLS[gift]);
      await page.waitForFunction(() => window.__sends > 0, null, {timeout: 15000});
      await paintDone(page);
      await page.evaluate(() => { window.__hs2api.journeyRepaintLeft = () => true; });
      await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 12000});
      await page.waitForFunction(() => document.querySelector('[data-hs-jm-repaint]').style.visibility !== 'hidden');
      // the theme's font, then a wide fallback font (GitHub's runner, 5 Nov: the view chips wrapped to a second row
      // and pushed the repaint link into the dock on a 320 px phone)
      for (const font of ['theme', 'wide']) {
        if (font === 'wide') await page.addStyleTag({content: '[data-hs-jm-frame], [data-hs-jm-frame] * { font-family: "DejaVu Sans", Verdana, "Liberation Sans", sans-serif !important; }'});
        await page.waitForTimeout(400);
        const r = await page.evaluate(() => {
          const box = s => { const e = document.querySelector(s); const b = e && e.getBoundingClientRect(); return b && b.height ? {top: Math.round(b.top), bottom: Math.round(b.bottom)} : null; };
          const sub = box('[data-hs-jm-frame] [data-hs-jm-sub]'), pic = box('[data-hs-jm-reveal] .hs-jm__square') || box('[data-hs-jm-reveal]'), rep = box('[data-hs-jm-repaint]'), dock = box('[data-hs-jm-frame] .hsj-dock'), views = box('.hs-jm__views');
          const repTop = rep && document.elementFromPoint(160, Math.round((rep.top + rep.bottom) / 2));
          return {sub, pic, views, rep, dock, repHit: !!(repTop && repTop.closest('[data-hs-jm-repaint]')), scroll: document.documentElement.scrollHeight <= innerHeight + 1};
        });
        const where = `${size.width}x${size.height} ${gift} (${font} font): ${JSON.stringify(r)}`;
        if (r.sub) assert.ok(r.pic.top >= r.sub.bottom - 1, 'the picture clears the words: ' + where);
        assert.ok(r.views.bottom - r.views.top <= 46, 'the view chips stay on one row: ' + where);
        assert.ok(await page.evaluate(() => [...document.querySelectorAll('.hs-jm__views .hsj-chip')].every(c => { const b = c.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth && c.scrollWidth <= c.clientWidth + 1; })), 'every view chip is whole and on the screen: ' + where);
        assert.ok(r.rep.bottom <= r.dock.top + 1, 'the repaint link clears the dock: ' + where);
        assert.ok(r.repHit, 'the repaint link can be tapped: ' + where);
        assert.ok(r.scroll, 'nothing scrolls: ' + where);
      }
    } finally { await ctx.close(); }
  }
});

// 5 Nov review: a photo refused after it left (the painter could not prepare it, the photo field was redrawn, or the
// send vanished) used to leave the buyer on "Almost there" for ever, the reason in a note spot journey mode hides.
// The page now says why, with one way on: the same photo again where there is an "It's my dog" override, otherwise
// Teeinblue's own photo field.
test('a photo the painter refuses after it was sent: the page says so, and one tap chooses another photo', async () => {
  const {page, ctx, errors} = await open({width: 390, height: 844}, {queue: ['print', 'mug'], answered: true, badPhoto: true});
  try {
    await page.goto(base + URLS.mug);
    await page.waitForSelector('[data-hs-jm][data-phase="refused"]', {timeout: 30000});
    assert.equal(await page.evaluate(() => window.__hs2api.journeyStatus()), 'refused');
    assert.equal(await page.textContent('[data-hs-jm-title]'), "This photo didn't go through");
    assert.ok((await page.textContent('[data-hs-jm-sub]')).trim().length > 10, 'the reason is said');
    assert.equal((await page.textContent('[data-hs-jm-add]')).trim(), 'Choose another photo');
    assert.equal(await page.isDisabled('[data-hs-jm-add]'), false);
    assert.ok(await fits(page));
    await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, '390-refused.png')});
    await page.evaluate(() => { window.__picked = 0; document.querySelectorAll('#buy input[type=file]').forEach(i => i.addEventListener('click', e => { e.preventDefault(); window.__picked++; })); });
    await page.click('[data-hs-jm-add]');
    assert.equal(await page.evaluate(() => window.__picked), 1, "Teeinblue's own photo field opens");
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.__hs2api.journeyStatus()), 'picked', 'the pick is not overwritten by the automatic send');
    assert.notEqual(await page.getAttribute('[data-hs-jm]', 'data-phase'), 'refused');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test("a refusal with an \"It's my dog\" override: one tap sends the same photo again, once", async () => {
  const {page, ctx} = await open({width: 390, height: 844}, {queue: ['print', 'mug'], answered: true, slowTib: 600000});
  try {
    await page.goto(base + URLS.mug);
    await page.waitForSelector('[data-hs-jm][data-phase="studio"]');
    // what hs2.js journeyRefused() leaves when its own check refused the photo and offered the override
    await page.evaluate(() => { const api = window.__hs2api; let st = 'refused'; window.__overrides = 0;
      api.journeyStatus = () => st; api.journeyNote = () => ({text: "We couldn't find a dog in this photo.", override: st === 'refused'}); api.journeyOverride = () => { window.__overrides++; st = 'sent'; return true; }; });
    await page.waitForSelector('[data-hs-jm][data-phase="refused"]', {timeout: 12000});
    assert.equal(await page.textContent('[data-hs-jm-sub]'), "We couldn't find a dog in this photo.");
    assert.equal((await page.textContent('[data-hs-jm-add]')).trim(), "It's my dog. Paint it.");
    await page.click('[data-hs-jm-add]');
    await page.waitForSelector('[data-hs-jm][data-phase="wait"]', {timeout: 6000});
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.__overrides), 1, 'the same photo goes once more');
    assert.equal(await page.getAttribute('[data-hs-jm]', 'data-phase'), 'wait');
  } finally { await ctx.close(); }
});

test("a painter that never starts: the page says so, and one tap reloads it", async () => {
  const {page, ctx} = await open({width: 390, height: 844}, {queue: ['print', 'mug'], answered: true, slowTib: 600000});
  try {
    await page.goto(base + URLS.mug);
    await page.waitForSelector('[data-hs-jm][data-phase="studio"]');
    // hs2.js reports 'stuck' when the painter has not opened in the 90 seconds the send waits
    await page.evaluate(() => { window.__hs2api.journeyStatus = () => 'stuck'; window.__before = 1; });
    await page.waitForSelector('[data-hs-jm][data-phase="stuck"]', {timeout: 12000});
    assert.equal(await page.textContent('[data-hs-jm-title]'), "The painter didn't start");
    assert.equal((await page.textContent('[data-hs-jm-add]')).trim(), 'Reload the page');
    assert.ok(await fits(page));
    await Promise.all([page.waitForEvent('load'), page.click('[data-hs-jm-add]')]);
    assert.equal(await page.evaluate(() => window.__before), undefined, 'the page reloaded');
  } finally { await ctx.close(); }
});

test('Back to a gift already added from this journey: it says it is in the cart, and nothing paints again', async () => {
  cart = [];
  const {page, ctx, errors} = await open({width: 390, height: 844}, {queue: ['mug', 'print'], answered: true});
  try {
    await page.goto(base + URLS.mug);
    await page.waitForFunction(() => window.__sends > 0, null, {timeout: 15000});
    await paintDone(page);
    await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 12000});
    await ready(page);
    await page.check('[data-hs-jm-tick]');
    await page.click('[data-hs-jm-add]');
    await page.waitForURL(/your-dogs-portrait/, {timeout: 15000, waitUntil: 'commit'});
    // Back only once the next page has loaded: pressing it mid-commit loses the page in the driver, not the buyer's
    await page.waitForLoadState('domcontentloaded');
    await page.goBack({waitUntil: 'domcontentloaded'});
    await page.waitForSelector('[data-hs-jm][data-phase="added"]', {timeout: 12000});
    assert.equal(await page.textContent('[data-hs-jm-title]'), "Mowgli's mug is in your cart");
    assert.equal((await page.textContent('[data-hs-jm-add]')).trim(), 'Next: the portrait');
    await page.waitForTimeout(2000);
    assert.equal(await page.evaluate(() => window.__painted || 0), 0, 'no second painting');
    assert.deepEqual(cart.map(i => i.handle), ['your-dogs-illustrated-mug'], 'one mug in the cart');
    await page.click('[data-hs-jm-add]');
    await page.waitForURL(/your-dogs-portrait/, {timeout: 15000, waitUntil: 'commit'});
    await page.waitForLoadState('domcontentloaded');
    // the mug taken out of the cart: Back to its page offers it again, never "in your cart" (review, 5 Nov)
    cart = [];
    await page.goBack({waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => { const p = document.querySelector('[data-hs-jm]').getAttribute('data-phase'); return p && p !== 'added'; }, null, {timeout: 12000});
    assert.notEqual(await page.textContent('[data-hs-jm-title]'), "Mowgli's mug is in your cart");
    assert.deepEqual(errors, []);
  } finally { cart = []; await ctx.close(); }
});

// Safari and Firefox restore the page from their page cache on Back: the add had finished and the page had moved
// on, so it says the gift is in the cart, never a busy button (review, 5 Nov)
test('Back from the page cache after an add: the gift says it is in the cart, and the button is free', async () => {
  cart = [{handle: 'your-dogs-illustrated-mug'}];
  const {page, ctx, errors} = await open({width: 390, height: 844}, {queue: ['mug', 'print'], answered: true});
  try {
    await page.goto(base + URLS.mug);
    await page.waitForFunction(() => window.__sends > 0, null, {timeout: 15000});
    await paintDone(page);
    await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 12000});
    // the moment the page left: the add done and recorded, the button still busy
    await page.evaluate(() => { const j = JSON.parse(sessionStorage.getItem('hs2-review')).hs_journey; sessionStorage.setItem('hs-jm-added:your-dogs-illustrated-mug:' + j.t, '1');
      const b = document.querySelector('[data-hs-jm-add]'); b.disabled = true; b.classList.add('is-busy');
      window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true})); });
    await page.waitForSelector('[data-hs-jm][data-phase="added"]', {timeout: 3000});
    assert.deepEqual(await page.evaluate(() => { const b = document.querySelector('[data-hs-jm-add]'); return {busy: b.classList.contains('is-busy'), off: b.disabled, label: b.textContent.trim()}; }), {busy: false, off: false, label: 'Next: the portrait'});
    assert.deepEqual(errors, []);
  } finally { cart = []; await ctx.close(); }
});

// the page as the server sends it, before any script: the easel at the gift's own shape, and no claim that the
// photo has gone (review, 5 Nov: it painted at 5:6 and then snapped, and said "Your photo is with the painter")
test('the studio as the server sends it: the easel at the gift\'s shape, and nothing said before it is true', () => {
  for (const [page, ratio] of [['product-mug-native.html', '3 / 2'], ['product-portrait-native.html', '2 / 3'], ['product-blanket-native.html', '5 / 6']]) {
    const html = fs.readFileSync(path.join(out, page), 'utf8');
    assert.match(html, new RegExp('data-hs-jm-easel style="--hs-art-ratio: ' + ratio.replace(/ /g, ' ') + ';'), page);
    assert.match(html, /data-hs-jm-sub>The painter is getting ready\.</, page);
    assert.doesNotMatch(html.slice(html.indexOf('data-hs-jm '), html.indexOf('data-hsj-mode')), /with the painter/, page);
    assert.ok(html.indexOf('hs-wait.css') < html.indexOf('data-hs-jm-easel'), page + ': the wait styles come before the easel');
  }
});

test("Back after the questions steps past them in one press, and another gift's journey key never turns this page", async () => {
  const {page, ctx} = await open({width: 390, height: 844}, {queue: ['print', 'mug'], answered: true});
  try {
    await page.goto(base + URLS.mug);
    await page.waitForSelector('[data-hs-jm][data-phase="studio"]');
    // the question screens' history entries, then the address hs-journey.js leaves when the note is done
    await page.evaluate(() => { history.pushState(null, '', '#ask=name'); history.pushState(null, '', '#ask=words'); history.replaceState(null, '', location.pathname + location.search); });
    await page.goBack({waitUntil: 'commit'}).catch(() => {});
    await page.waitForFunction(() => !location.hash, null, {timeout: 5000});
    await page.waitForTimeout(800);
    assert.equal(await page.evaluate(() => location.hash), '', 'not back on a question');
    assert.match(page.url(), /your-dogs-illustrated-mug/);
  } finally { await ctx.close(); }
  // the portrait opened without ?journey=1 while only the mug remembers this journey: the normal page, never a flash
  const other = await open({width: 390, height: 844}, {onKey: 16160217956734});
  try {
    await other.page.goto(base + URLS.print.replace('journey=1&', ''));
    await other.page.waitForTimeout(2500);
    assert.deepEqual(await other.page.evaluate(() => ({panel: !document.querySelector('[data-hs-jm]').hidden, on: document.documentElement.classList.contains('hs-jm-on'), flash: window.__jmFlash})), {panel: false, on: false, flash: false});
  } finally { await other.ctx.close(); }
  // its own key does
  const own = await open({width: 390, height: 844}, {onKey: 16151384260990});
  try {
    await own.page.goto(base + URLS.print.replace('journey=1&', ''));
    await own.page.waitForSelector('[data-hs-jm]:not([hidden])', {timeout: 8000});
  } finally { await own.ctx.close(); }
});

// 5 Nov judges (nine of eleven buyers): "Painting your dog" sat empty, a title and a Next button, until the painter
// opened. The studio now shows the buyer's own photo on the easel from the first paint of the page, at the size the
// painting card will take, and the card takes its place without a jump.
for (const size of [{width: 320, height: 568}, {width: 390, height: 844}]) test(`${size.width}x${size.height}: the studio is never an empty frame while the painter opens`, async () => {
  const {page, ctx, errors} = await open(size, {slowTib: 9000});
  try {
    await page.goto(base + URLS.print, {waitUntil: 'commit'});
    const filled = () => page.evaluate(() => {
      const box = document.querySelector('[data-hs-jm-paint]');
      if (!box || document.querySelector('[data-hs-jm]').hidden) return null;
      const seen = [...box.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width >= 80 && r.height >= 80 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.5; });
      return {seen: seen.length, words: document.querySelector('[data-hs-jm-paint]').innerText.trim().length};
    });
    await page.waitForSelector('[data-hs-jm]:not([hidden])', {timeout: 8000});
    for (const at of [300, 2500]) {
      await page.waitForTimeout(at === 300 ? 300 : 2200);
      const f = await filled();
      assert.ok(f && f.seen > 0, at + ' ms: something to look at on the easel ' + JSON.stringify(f));
      assert.ok(f.words > 10, at + ' ms: a line from the studio ' + JSON.stringify(f));
    }
    assert.equal(await page.evaluate(() => window.__painted), 0, 'the painter has not opened yet');
    // the buyer's photo is on the easel, and the brush stays over it (review, 5 Nov: the photo hid the brush)
    assert.deepEqual(await page.evaluate(() => { const e = document.querySelector('[data-hs-jm-easel]'), ph = e.querySelector('[data-hs-jm-photo]'), br = e.querySelector('.hs-art__brush');
      return {photo: !ph.hidden && !!ph.getAttribute('src'), brush: getComputedStyle(br).display !== 'none'}; }), {photo: true, brush: true});
    await page.screenshot({path: path.join(shots, size.width + '-studio-before-painter.png')});
    // when the painter opens and the card takes over, the dock does not move
    const dock = () => page.evaluate(() => Math.round(document.querySelector('[data-hs-jm-frame] .hsj-dock').getBoundingClientRect().top));
    const before = await dock();
    await page.waitForFunction(() => window.__painted === 1, null, {timeout: 20000});
    await page.waitForTimeout(800);
    if (await page.getAttribute('[data-hs-jm]', 'data-phase') === 'studio') assert.equal(await dock(), before, 'the dock stays put');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

// 5 Nov judges, the only desktop buyer (1280x800): every question on the gift page sat in a 40 to 90 px column, the
// note read "I w / the / so", and the card changed width at every step. The questions take the journey card's width.
test('desktop 1280x800: the questions on the gift page use the card, at one width from the studio to the note', async () => {
  const {page, ctx, errors} = await open({width: 1280, height: 800});
  try {
    await page.goto(base + URLS.print);
    await page.waitForFunction(() => /ask=name/.test(location.hash), null, {timeout: 15000});
    await page.waitForTimeout(500);
    const measure = () => page.evaluate(() => {
      const screen = [...document.querySelectorAll('[data-hsj-screen]')].find(s => s.getBoundingClientRect().width > 0);
      const field = screen && screen.querySelector('input:not([type=radio]):not([type=checkbox]), .hsj-chip, button.hsj-btn');
      const card = screen && screen.closest('.hsj__screen, [data-hsj-screen]');
      return {screen: screen ? Math.round(screen.getBoundingClientRect().width) : 0, field: field ? Math.round(field.getBoundingClientRect().width) : 0};
    });
    const name = await measure();
    assert.ok(name.screen >= 480, 'the question card is wide: ' + JSON.stringify(name));
    assert.ok(name.field >= 240, 'the name box is a real box: ' + JSON.stringify(name));
    assert.ok(await fits(page), 'the card fits the window');
    const sameBox = await page.evaluate(() => { const r = [...document.querySelectorAll('[data-hsj-screen]')].find(s => s.getBoundingClientRect().width > 0).getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom)}; });
    assert.ok(sameBox.bottom <= 800 - 16, 'the card ends inside the window: ' + JSON.stringify(sameBox));
    await page.screenshot({path: path.join(shots, '1280-ask-name.png')});
    await page.fill('[data-hsj-screen="name"] input', 'Honey');
    await page.click('[data-hsj-screen="name"] [data-hsj-next], [data-hsj-screen="name"] .hsj-btn');
    await page.waitForFunction(() => /ask=breed/.test(location.hash), null, {timeout: 5000});
    await page.waitForTimeout(400);
    const breed = await measure();
    assert.ok(breed.screen >= 480 && Math.abs(breed.screen - name.screen) <= 1, 'the same width: ' + JSON.stringify({name, breed}));
    await page.screenshot({path: path.join(shots, '1280-ask-breed.png')});
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

// 5 Nov judges (every buyer): the progress line ran backwards, 31% at the gifts, 60% in the studio, 38% at the first
// question. It now only moves forward: the gifts 40%, the studio 45%, the questions from 50%.
test('the progress line only moves forward from the studio into the questions', async () => {
  const {page, ctx} = await open({width: 390, height: 844});
  try {
    await page.goto(base + URLS.print);
    await page.waitForSelector('[data-hs-jm][data-phase="studio"]');
    const width = sel => page.evaluate(sel => { const s = [...document.querySelectorAll(sel)].find(e => e.getBoundingClientRect().width > 0); return s ? Math.round(s.getBoundingClientRect().width / s.parentElement.getBoundingClientRect().width * 100) : -1; }, sel);
    const studio = await width('[data-hs-jm-progress]');
    await page.waitForFunction(() => /ask=name/.test(location.hash), null, {timeout: 10000});
    await page.waitForTimeout(400);
    const name = await width('[data-hsj-screen="name"] .hsj-progress span');
    assert.deepEqual([studio, name], [45, 50]);
  } finally { await ctx.close(); }
});
