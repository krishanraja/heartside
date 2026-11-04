// Journey mode on a gift page (29 Oct plan; Krish: show and tell, no scrolling, nothing asked twice,
// always offer the bundle). A buyer who came through the journey lands on /products/<gift>?journey=1
// with everything answered: the photo goes to the painter once by itself (no resend on a reload),
// nothing else on the page shows, the painting appears on every gift with the bundle line, the add
// waits for the tick, and extra gifts go in the gift queue. A page without the journey is the normal
// page. The rendered theme (render.mjs) with its Teeinblue stand-in, in Chromium at phone sizes;
// nothing leaves localhost.
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
// the rendered pages come from render.mjs; CI renders after the tests that need none
if (!fs.existsSync(path.join(out, 'assets', 'hs-journey-choose.js'))) execFileSync(process.execPath, ['render.mjs'], {cwd: here, stdio: 'ignore'});
const PAGE_FOR = {'your-dogs-illustrated-mug': 'product-mug-native.html', 'your-dogs-portrait': 'product-portrait-native.html', 'your-dogs-personality-blanket': 'product-blanket-native.html'};
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json'};
const GIFTS = {
  mug: {url: '/products/your-dogs-illustrated-mug?journey=1', handle: 'your-dogs-illustrated-mug', price: 34},
  blanket: {url: '/products/your-dogs-personality-blanket?journey=1', handle: 'your-dogs-personality-blanket', price: 89},
  print: {url: '/products/your-dogs-portrait?journey=1', handle: 'your-dogs-portrait', price: 49},
};
const STANDIN = '<script>(' + (() => {
    // count every file handed to Teeinblue's photo field
  window.__sends = 0;
  // each gift page has its own product id, as the live pages do (Teeinblue's campaign carries it)
  const ids = {'your-dogs-illustrated-mug': 101, 'your-dogs-portrait': 102, 'your-dogs-personality-blanket': 103};
  const pid = ids[(location.pathname.split('/')[2] || '')];
  if (pid) window.ShopifyAnalytics = {meta: {product: {id: pid}}};
  document.addEventListener('change', e => { if (e.target.type === 'file' && e.target.files && e.target.files.length) window.__sends++; }, true);
  // the live campaigns carry the painting's hidden fields; the stand-in form gets them here
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
    // the stand-in for Teeinblue's add to cart, from any page or background copy
    if (u.pathname === '/__add') { cart.push({handle: u.searchParams.get('h')}); res.writeHead(200); return res.end('ok'); }
    let f = path.join(out, decodeURIComponent(u.pathname));
    if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
    else if (u.pathname.startsWith('/products/')) f = path.join(out, PAGE_FOR[u.pathname.split('/')[2]] || 'missing');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    // Shopify's own headers on every store page: no store page shows inside another (2 Nov: a hidden
    // copy of a gift page never loaded live, while this server, without them, let the tests pass)
    if (u.pathname.startsWith('/products/')) { res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Content-Security-Policy', "frame-ancestors 'none'"); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'});
    // every gift page gets the Teeinblue stand-in before its own scripts
    if (u.pathname.startsWith('/products/')) return res.end(fs.readFileSync(f, 'utf8').replace('<head>', '<head>' + STANDIN));
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

async function open(size, {photo = true, journeyAge = 0, gift = 'print'} = {}) {
  const ctx = await browser.newContext({viewport: size, isMobile: true, hasTouch: true});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(u => !u.href.startsWith(base) && !/^(data|blob):/.test(u.href), r => r.abort());
  const t = Date.now() - 60000; // a photo saved a minute ago (hs2 drops one older than three days)
  await page.addInitScript(([t, photo, journeyAge, gift, GIFTS]) => {
    if (sessionStorage.getItem('hs2-review')) return;
    sessionStorage.setItem('hs-artwork-choices-v1', JSON.stringify({version: 1, style: 'collage', tone: 'hilarious'}));
    sessionStorage.setItem('hs2-review', JSON.stringify({
      dog: 'Mowgli', person: 'Sam', hs3_lines: {home: 'a', spot: 'b', together: 'c', meaning: 'You let me live here.'}, hs3_copy_owner: 'generated', hs3_photo_t: photo ? t : 0,
      hs3_art_profile: {version: 1, facts: [{source: 'spot', text: "Rests at their person's feet."}]}, hs3_art_choices: {style: 'collage', tone: 'hilarious'},
      hs_brief_input: {breed: 'Border Collie', pronoun: 'he', archetype: 'Herding Manager', home: 'toy', spot: 'couch', together: 'walk', meaning: 'shadow', toys: 'a tennis ball and a big stick', accessory: '', noToy: false},
      hs_journey: {t: Date.now() - journeyAge, gift, tone: 'hilarious', style: 'collage', gifts: GIFTS},
    }));
  }, [t, photo, journeyAge, gift, GIFTS]);
  // the photo the journey saved on this device, in place before the gift page opens
  if (photo) {
    await page.goto(base + '/robots.txt');
    await page.evaluate(t => new Promise((resolve, reject) => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      c.toBlob(b => { const f = new File([b], 'dog.png', {type: 'image/png'}); const o = indexedDB.open('hs2', 1);
        o.onupgradeneeded = () => o.result.createObjectStore('files');
        o.onerror = () => reject(o.error);
        o.onsuccess = () => { const tx = o.result.transaction('files', 'readwrite'); tx.objectStore('files').put({file: f, t}, 'headshot'); tx.oncomplete = () => { o.result.close(); resolve(); }; }; });
    }), t);
  }
  return {page, ctx, errors};
}
const PHONES = [{width: 320, height: 568}, {width: 360, height: 640}, {width: 375, height: 667}, {width: 390, height: 844}, {width: 412, height: 915}, {width: 430, height: 932}];
const fits = page => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1);
// stand in for a saved painting: hs2 marks the card done only once Teeinblue's preview holds it
const paintDone = page => page.evaluate(() => {
  const a = document.querySelector('[data-hs-art]');
  a.setAttribute = function (k, v) { return Element.prototype.setAttribute.call(this, k, k === 'data-state' ? 'done' : v); };
  a.setAttribute('data-state', 'done');
  a.querySelector('[data-hs-art-result]').src = '/assets/hs-ex-style-screenprint.webp';
});

for (const size of PHONES) test(`${size.width}x${size.height}: the painting starts by itself, once, with nothing asked again and nothing to scroll`, async () => {
  const {page, ctx, errors} = await open(size);
  try {
    await page.goto(base + GIFTS.print.url);
    await page.waitForFunction(() => window.__sends > 0, null, {timeout: 15000});
    await page.waitForTimeout(2500);
    assert.equal(await page.evaluate(() => window.__sends), 1, 'the photo goes to the painter once');
    const view = await page.evaluate(() => {
      const seen = s => [...document.querySelectorAll(s)].some(e => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(e).opacity !== '0' && !e.closest('[style*="opacity: 0"]'); });
      const panel = document.querySelector('[data-hs-jm]');
      return {panel: !panel.hidden, card: !!panel.querySelector('[data-hs-art]'), title: document.querySelector('[data-hs-jm-title]').textContent,
        asked: ['[data-hs-journey]', '[data-hs-art-choices]', '[data-hs-extras]', '[data-hs2-answers]', '.hs2-product__info select', '.tee-option', 'h1:not(.hs-jm__title)']
          .filter(s => [...document.querySelectorAll(s)].some(e => { const r = e.getBoundingClientRect(); return r.height > 1 && r.width > 1 && r.bottom > 0 && !e.closest('#buy > :not(.hs-jm)'); }))};
    });
    assert.equal(view.panel, true);
    assert.equal(view.card, true, 'the painting card sits in the panel');
    assert.equal(view.title, 'Painting Mowgli');
    assert.deepEqual(view.asked, [], 'no question, select, option or note editor shows');
    // recipes v10: the painter's hidden fields carry the directed brief for this dog (PROMPT-SPEC-2026-10-29.md)
    const brief = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-brief]')].map(i => [i.getAttribute('data-brief'), i.value])));
    assert.match(brief.Energy, /^Keep exactly who he is: this Border Collie's face shape/);
    // v15: the breed's character joins the identity line, and the composer ranks every answer: with
    // archetype scenes on (Ruling, Krish, 2026-10-30) the Herding Manager's own walk joke wins, staged with
    // the stated toys, and no person
    assert.match(brief.Energy, /never mirrored\. Character: a herding dog's intense, unblinking work focus, applied to everything\.$/);
    assert.match(brief['Tone direction'], /^One visual joke anyone gets at a glance: the dog crouched flat on the path in a sheepdog's stalking pose, eyes locked with total intensity on his tennis ball and big stick lying in the path ahead, one front paw lifted, ready to pounce the moment anything moves\. /);
    assert.doesNotMatch(brief['Tone direction'], /person|only their/);
    assert.match(brief['Style direction'], /^a cut-paper collage\. .*20 to 30 hand-cut paper pieces/);
    assert.ok(await fits(page), 'no scrolling while it paints');
    // what Teeinblue shows while it paints (its uploading marker): the painting card, still on one screen
    await page.evaluate(() => { const m = document.createElement('div'); m.className = 'tee-photo-uploading'; m.setAttribute('data-standin', ''); document.querySelector('#buy .tee-field--photo').appendChild(m); });
    await page.waitForSelector('[data-hs-jm-paint] [data-hs-art][data-state="painting"]', {timeout: 8000});
    assert.ok(await fits(page), 'the painting card fits without scrolling');
    await page.screenshot({path: path.join(shots, size.width + '-painting.png')});
    await page.evaluate(() => document.querySelector('[data-standin]').remove());
    // a reload does not paint again
    await page.reload();
    await page.waitForTimeout(3500);
    assert.equal(await page.evaluate(() => window.__sends), 0, 'no resend on a reload');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

for (const size of PHONES) test(`${size.width}x${size.height}: select your gifts: one tick, one button, and each extra gift adds itself on one progress screen`, async () => {
  const {page, ctx, errors} = await open(size);
  try {
    await page.goto(base + GIFTS.print.url);
    await page.waitForSelector('[data-hs-jm]:not([hidden])');
    await paintDone(page);
    await page.waitForSelector('[data-hs-jm-choose]:not([hidden])', {timeout: 5000});
    const first = await page.evaluate(() => ({
      title: document.querySelector('[data-hs-jm-title]').textContent,
      tiles: [...document.querySelectorAll('.hs-jm-tile')].map(t => [t.getAttribute('data-hs-jm-gift'), t.getAttribute('data-hs-jm-state'), t.getAttribute('aria-pressed')]),
      over: document.querySelectorAll('.hs-jm-tile__art .hs-jm-tile__tag').length,
      bundle: document.querySelector('[data-hs-jm-bundle]').textContent, tick: document.querySelector('[data-hs-jm-tick-text]').textContent,
      add: document.querySelector('[data-hs-jm-add]').disabled,
      wraps: [...document.querySelectorAll('.hs-jm__title, .hs-jm-tile__row, [data-hs-jm-bundle]')].filter(e => e.getBoundingClientRect().height > parseFloat(getComputedStyle(e).lineHeight) * 1.5 + 22).map(e => e.textContent),
    }));
    // Krish, 2 Nov: "Select your gifts", the three gifts with nothing over the pictures, no word on a line of its own
    assert.equal(first.title, 'Select your gifts');
    assert.deepEqual(first.tiles, [['print', 'done', 'true'], ['mug', 'idle', 'false'], ['blanket', 'idle', 'false']]);
    assert.equal(first.over, 0, 'no chip over a picture');
    assert.match(first.bundle, /15%.*20%/);
    assert.equal(first.tick, 'Yes, this is Mowgli');
    assert.equal(first.add, true, 'no add before the tick');
    if (size.width >= 360) assert.deepEqual(first.wraps, [], 'one line each');
    assert.ok(await fits(page), 'the gifts screen fits without scrolling');
    await page.screenshot({path: path.join(shots, size.width + '-gifts.png')});
    // every gift can be dropped, the painted one too (Krish, 4 Nov: "why can't I unselect the blanket?");
    // with nothing chosen the button says so and stays off
    await page.click('[data-hs-jm-gift=print]');
    const none = await page.evaluate(() => ({on: document.querySelectorAll('.hs-jm-tile.is-on').length, btn: document.querySelector('[data-hs-jm-add]').textContent, off: document.querySelector('[data-hs-jm-add]').disabled}));
    assert.deepEqual(none, {on: 0, btn: 'Choose a gift', off: true});
    await page.click('[data-hs-jm-gift=print]');
    // ticking a gift starts nothing in the background (Shopify refuses frames); it is added after this one
    await page.click('[data-hs-jm-gift=mug]'); await page.click('[data-hs-jm-gift=mug]');
    await page.click('[data-hs-jm-gift=blanket]');
    const picked = await page.evaluate(() => ({on: [...document.querySelectorAll('.hs-jm-tile.is-on')].map(t => t.getAttribute('data-hs-jm-gift')), btn: document.querySelector('[data-hs-jm-add]').textContent, bundle: document.querySelector('[data-hs-jm-bundle]').textContent, frames: document.querySelectorAll('iframe').length}));
    assert.deepEqual(picked.on, ['print', 'blanket']);
    assert.match(picked.btn, /^Add 2 gifts · \$\d+/);
    assert.match(picked.bundle, /^You save 15% on 2 gifts/);
    assert.equal(picked.frames, 0, 'no hidden copies of other pages');
    // a colour or option drives Teeinblue's own radios
    const opt = page.locator('.hs-jm-dot:not(.is-on), .hs-jm-pill:not(.is-on)').first();
    if (await opt.count()) {
      const label = ((await opt.getAttribute('aria-label')) || (await opt.textContent())).trim();
      await opt.click(); await page.waitForTimeout(300);
      assert.equal(await page.evaluate(l => [...document.querySelectorAll('#buy .tee-option input[type=radio]:checked')].some(r => { const lab = r.id && document.querySelector(`label[for="${r.id}"]`); return (lab ? lab.textContent : r.value).trim() === l; }), label), true, 'the option clicks Teeinblue');
    }
    // the tick is hs2's own approval box; the add clicks Teeinblue's own button
    const plainBox = () => { const a = document.querySelector('[data-hs2-artwork-accept]'), b = a.cloneNode(); let on = false; Object.defineProperty(b, 'checked', {get: () => on, set: v => { if (v) on = true; }}); a.replaceWith(b); };
    await page.evaluate(plainBox);
    await page.check('[data-hs-jm-tick]');
    assert.equal(await page.evaluate(() => document.querySelector('[data-hs2-artwork-accept]').checked), true);
    await page.evaluate(() => { document.querySelector('#buy #teeAtcButton').click = () => { fetch('/__add?h=your-dogs-portrait'); }; });
    cart = [];
    await page.click('[data-hs-jm-add]');
    // the blanket opens in auto mode: one progress screen, never the chooser or the tick again
    await page.waitForURL(/your-dogs-personality-blanket\?journey=1&hsauto=1/, {timeout: 10000});
    assert.deepEqual(cart.map(i => i.handle), ['your-dogs-portrait']);
    await page.waitForSelector('[data-hs-jm].is-auto:not([hidden])', {timeout: 8000});
    await page.waitForFunction(() => window.__sends > 0, null, {timeout: 15000});
    const auto = await page.evaluate(() => ({title: document.querySelector('[data-hs-jm-title]').textContent, lead: document.querySelector('[data-hs-jm-auto]').textContent, tick: getComputedStyle(document.querySelector('.hs-jm__tick')).display}));
    assert.equal(auto.title, 'Putting Mowgli on the blanket');
    assert.equal(auto.lead, 'Gift 2 of 2. The others are in your cart.');
    assert.equal(auto.tick, 'none', 'not asked again');
    await page.screenshot({path: path.join(shots, size.width + '-auto-painting.png')});
    // Teeinblue's framing box opens when the painting is back; auto mode saves it
    await page.evaluate(() => { const d = document.createElement('div'); d.className = 'vm--container'; d.innerHTML = '<div class="vm--modal"><button type="button" class="tee-btn">Cancel</button><button type="button" class="tee-btn">Save</button></div>'; d.querySelectorAll('button')[1].addEventListener('click', () => { window.__saved = (window.__saved || 0) + 1; d.remove(); }); document.body.appendChild(d); });
    await page.waitForFunction(() => window.__saved === 1 && !document.querySelector('.vm--container'), null, {timeout: 5000});
    await page.evaluate(plainBox);
    await page.evaluate(() => { document.querySelector('#buy #teeAtcButton').click = () => { fetch('/__add?h=your-dogs-personality-blanket'); }; });
    await paintDone(page);
    await page.waitForFunction(() => /Adding it to your cart in \d/.test(document.querySelector('[data-hs-jm-auto-say]').textContent), null, {timeout: 5000});
    assert.equal(await page.textContent('[data-hs-jm-title]'), 'Mowgli on the blanket');
    await page.screenshot({path: path.join(shots, size.width + '-auto-ready.png')});
    if (size.width >= 360) assert.ok(await fits(page), 'the auto screen fits without scrolling');
    // after the short count it goes in the cart by itself, approved by the first tick, and the cart opens
    await page.waitForURL(/\/cart$/, {timeout: 15000});
    assert.deepEqual(cart.map(i => i.handle), ['your-dogs-portrait', 'your-dogs-personality-blanket']);
    assert.deepEqual(errors, []);
  } finally { cart = []; await ctx.close(); }
});

test('dropping the painted gift: only the chosen gift is painted and added, and nothing goes in the cart from this page', async () => {
  const {page, ctx, errors} = await open({width: 390, height: 844});
  try {
    await page.goto(base + GIFTS.print.url);
    await page.waitForSelector('[data-hs-jm]:not([hidden])');
    await paintDone(page);
    await page.waitForSelector('[data-hs-jm-choose]:not([hidden])', {timeout: 5000});
    await page.click('[data-hs-jm-gift=print]');
    await page.click('[data-hs-jm-gift=mug]');
    const on = await page.evaluate(() => ({on: [...document.querySelectorAll('.hs-jm-tile.is-on')].map(t => t.getAttribute('data-hs-jm-gift')), btn: document.querySelector('[data-hs-jm-add]').textContent}));
    assert.deepEqual(on.on, ['mug']);
    assert.match(on.btn, /^Add to cart · \$34$/);
    const plainBox = () => { const a = document.querySelector('[data-hs2-artwork-accept]'), b = a.cloneNode(); let v = false; Object.defineProperty(b, 'checked', {get: () => v, set: x => { if (x) v = true; }}); a.replaceWith(b); };
    await page.evaluate(plainBox);
    await page.evaluate(() => { document.querySelector('#buy #teeAtcButton').click = () => { fetch('/__add?h=your-dogs-portrait'); }; });
    cart = [];
    await page.check('[data-hs-jm-tick]');
    await page.click('[data-hs-jm-add]');
    await page.waitForURL(/your-dogs-illustrated-mug\?journey=1&hsauto=1/, {timeout: 10000});
    assert.deepEqual(cart, [], 'the portrait was not added');
    await page.waitForSelector('[data-hs-jm].is-auto:not([hidden])', {timeout: 8000});
    assert.equal(await page.textContent('[data-hs-jm-auto]'), 'Gift 1 of 1.');
    assert.deepEqual(errors, []);
  } finally { cart = []; await ctx.close(); }
});

test('a photo that did not carry over: one button opens the picker, and the automatic send stands down', async () => {
  const {page, ctx} = await open({width: 390, height: 844}, {photo: false});
  try {
    await page.goto(base + GIFTS.print.url);
    await page.waitForSelector('[data-hs-jm-nophoto]:not([hidden])', {timeout: 9000});
    assert.equal(await page.textContent('[data-hs-jm-photo]'), "Choose Mowgli's photo");
    assert.ok(await fits(page));
    await page.screenshot({path: path.join(shots, '390-nophoto.png')});
    await page.evaluate(() => { window.__picked = 0; document.querySelectorAll('#buy input[type=file]').forEach(i => i.addEventListener('click', e => { e.preventDefault(); window.__picked++; })); });
    await page.click('[data-hs-jm-photo]');
    assert.equal(await page.evaluate(() => window.__picked), 1, "Teeinblue's own photo field opens");
    assert.ok(await page.evaluate(() => Object.keys(sessionStorage).some(k => k.startsWith('hs2-journey-sent:'))), 'no automatic send after a pick');
  } finally { await ctx.close(); }
});

test('without the journey (no ?journey=1, or a stale one) the gift page is the normal page', async () => {
  for (const [url, opts] of [[GIFTS.print.url.replace('?journey=1', ''), {}], [GIFTS.print.url, {journeyAge: 7 * 36e5}]]) {
    const {page, ctx} = await open({width: 390, height: 844}, opts);
    try {
      await page.goto(base + url);
      await page.waitForTimeout(2500);
      const s = await page.evaluate(() => ({panel: !document.querySelector('[data-hs-jm]').hidden, on: document.documentElement.classList.contains('hs-jm-on'), sends: window.__sends}));
      assert.deepEqual(s, {panel: false, on: false, sends: 0}, url);
    } finally { await ctx.close(); }
  }
});

test("Teeinblue's ?variant= address after an option change keeps journey mode on a reload", async () => {
  const {page, ctx} = await open({width: 390, height: 844});
  try {
    await page.goto(base + GIFTS.print.url);
    await page.waitForSelector('[data-hs-jm]:not([hidden])');
    await page.goto(base + '/products/your-dogs-portrait?variant=58300000000009');
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => !document.querySelector('[data-hs-jm]').hidden), true);
  } finally { await ctx.close(); }
});
