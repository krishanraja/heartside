// The cart's "one more gift" drawer (Krish, 5 Nov: "There should be a side draw that bounces out from the left,
// which offers a special deal at checkout to upsell to other gifts"; his ruling: the existing bundle, 15% off two
// gifts and 20% off three, with the real dollar saving). In Chromium, on carts with 1, 2 and 3 gifts rendered by
// cart-fixture.mjs (cart-products.liquid for real, with the memo strip's bundle switch on), the full hs2.js and
// hs-cart-more.js, and the rendered gift pages (render.mjs) with the journey tests' Teeinblue stand-in:
//  - it opens by itself from the left, early, once, and offers only the gifts not in the cart, with the saving
//    in dollars ($26.10 for mug + blanket, $46.60 for mug + blanket + an unframed portrait);
//  - its button extends the photo-first journey: the next gift page paints once and asks nothing;
//  - without a fresh journey, its link starts the home journey with the cart's gifts unticked;
//  - paying is never blocked: its own Check out presses the page's, a tap outside never lands on Remove,
//    Escape closes it, a pending quantity change holds it, Back from the page cache works;
//  - it fits every phone and the desktop with no sideways scroll, the opener moves nothing, the bounce shows no
//    gap at the left edge, and reduced motion fades it.
// Nothing leaves 127.0.0.1; any n8n host is refused.
//
//   node --test tools/preview/cart-more.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {renderCart, giftLine, addon, asset, HELIO_TOKENS, ID, ID2} from './cart-fixture.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out'), shots = path.join(out, 'cart-more');
fs.mkdirSync(shots, {recursive: true});
if (!fs.existsSync(path.join(out, 'assets', 'hs-cart-more.js'))) execFileSync(process.execPath, ['render.mjs'], {cwd: here, stdio: 'ignore'});
const ID3 = 'cccccccc-3333-4333-8333-cccccccccccc';

// the three gifts as render.mjs renders them (the same ids, so the gift pages in out/ match)
const opt = (o) => o;
const MUG = {id: 16160217956734, handle: 'your-dogs-illustrated-mug', title: "Your Dog's Illustrated Mug", url: '/products/your-dogs-illustrated-mug', available: true,
  variants: ['Black', 'Dark Blue', 'Dark Green', 'Pink', 'Red'].map((c, i) => ({id: 58300000000001 + i, title: c + ' / 11 oz', options: opt(["Your Dog's Illustrated Mug", c, '11 oz']), price: 4500, available: true}))};
const PORTRAIT = {id: 16151384260990, handle: 'your-dogs-portrait', title: "Your Dog's Portrait", url: '/products/your-dogs-portrait', available: true,
  variants: [['Framed', 'Black', 11900], ['Framed', 'Red Oak', 11900], ['Framed', 'White', 11900], ['Unframed', 'Default', 5900]].map(([f, c, p], i) => ({id: 58300000000006 + i, title: f + ' / ' + c, options: [f, c, '12″×18″'], price: p, available: true}))};
const BLANKET = {id: 16158073880958, handle: 'your-dogs-personality-blanket', title: "Your Dog's Personality Blanket", url: '/products/your-dogs-personality-blanket', available: true,
  variants: [{id: 58300000000010, title: 'Tan', options: ['Heartside Personality Blanket', 'Tan', '50″×60″'], price: 12900, available: true}]};
const all_products = Object.fromEntries([MUG, PORTRAIT, BLANKET].map(p => [p.handle, p]));
const mugLine = (i = 0, id = ID) => giftLine(i, MUG, MUG.variants[2], 4500, id);
const blanketLine = (i = 1, id = ID2) => giftLine(i, BLANKET, BLANKET.variants[0], 12900, id);
const unframedLine = (i = 2, id = ID3) => giftLine(i, PORTRAIT, PORTRAIT.variants[3], 5900, id);
const CARTS = {one: () => [mugLine()], two: () => [mugLine(), blanketLine()], three: () => [mugLine(), blanketLine(), unframedLine()]};

const STANDIN = '<script>(' + (() => {
  window.__painted = 0;
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { if (/^hs2-blanket-upload:/.test(k) && /"stage":"sent"/.test(v)) window.__painted++; return set.call(this, k, v); };
  const ids = {'your-dogs-illustrated-mug': 16160217956734, 'your-dogs-portrait': 16151384260990, 'your-dogs-personality-blanket': 16158073880958};
  const pid = ids[(location.pathname.split('/')[2] || '')];
  if (pid) window.ShopifyAnalytics = {meta: {product: {id: pid}}};
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
  }, 0), true);
}).toString() + ')();</script>';
// every publish to Shopify's customer events, for the analytics check
const ANALYTICS = '<script>window.__events = []; window.Shopify = {analytics: {publish: (n, d) => window.__events.push([n, d])}};</script>';

const summary = `<div class="cart-summary"><div class="cart-totals"><div class="cart-totals__item cart-totals__total"><span>Estimated total</span><span class="hs-total">$174.00 USD</span></div></div>
<div class="cart-totals__item cart-totals__tax-note cart-primary-typography"><small>Taxes and <a href="/policies/shipping-policy">shipping</a> calculated at checkout. </small></div>
<button type="submit" form="cart-form" name="checkout" class="button cart__checkout-button">Check out</button></div>`;
const memo = (live = true, deadline = '2099-12-04') => `<div class="hs2-memo" data-hs2-memo${live ? ' data-hs-bundle-live' : ''} data-deadline="${deadline}" hidden></div>`;
async function cartPage(items, {live = true, deadline, drawer = true} = {}) {
  const {html, css} = await renderCart(items, {all_products});
  const head = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cart</title>
<style>${HELIO_TOKENS}</style><link rel="stylesheet" href="/assets/standin.css"><style>${css}</style><link rel="stylesheet" href="/assets/hs-brand.css"><link rel="stylesheet" href="/assets/hs2.css">${ANALYTICS}
<script src="/assets/hs2.js" defer></script></head>`;
  return `${head}<body>${memo(live, deadline)}<main id="MainContent"><cart-items-component class="cart-items-component" data-section-id="main"><div class="section section--page-width"><div class="cart-page"><div class="cart-page__items">${html.replace(/\/mock\//g, '/mock/')}</div><div class="cart-page__summary">${summary}</div></div></div></cart-items-component></main>
${drawer ? '<script src="/assets/hs-cart-more.js" defer></script>' : ''}</body></html>`;
}
const cartJs = items => JSON.stringify({items: items.map(it => ({key: it.key, product_title: it.product.title, properties: it.properties})),
  total_discount: items.length === 2 ? 2610 : items.length === 3 ? 4660 : 0});

let server, base, browser, page = {html: '', items: []}, posts = [];
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg'};
const PAGE_FOR = {'your-dogs-illustrated-mug': 'product-mug-native.html', 'your-dogs-portrait': 'product-portrait-native.html', 'your-dogs-personality-blanket': 'product-blanket-native.html'};
before(async () => {
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (req.method !== 'GET') { posts.push(req.method + ' ' + u.pathname); res.writeHead(200, {'Content-Type': 'application/json'}); return res.end('{}'); }
    if (u.pathname === '/cart') { res.writeHead(200, {'Content-Type': 'text/html', 'Cache-Control': 'no-store'}); return res.end(page.html); }
    if (u.pathname === '/cart.js') { res.writeHead(200, {'Content-Type': 'application/json'}); return res.end(cartJs(page.items)); }
    if (u.pathname === '/__photo.jpg') { res.writeHead(200, {'Content-Type': 'image/jpeg'}); return res.end(fs.readFileSync(path.join(here, '../../assets/photos/pug-autumn-leaves.jpg'))); }
    if (/^\/(mock|cdn)\//.test(u.pathname)) { res.writeHead(200, {'Content-Type': 'image/svg+xml'}); return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="#c89678"/></svg>'); }
    let f;
    if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
    else if (u.pathname.startsWith('/products/')) f = path.join(out, PAGE_FOR[u.pathname.split('/')[2]] || 'missing');
    else if (u.pathname === '/' || u.pathname === '/index.html') f = path.join(out, 'index-journey.html');
    else f = path.join(out, decodeURIComponent(u.pathname));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'});
    if (u.pathname.startsWith('/products/')) return res.end(fs.readFileSync(f, 'utf8').replace('<head>', '<head>' + STANDIN));
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

const URLS = {print: '/products/your-dogs-portrait?journey=1&variant=58300000000006', mug: '/products/your-dogs-illustrated-mug?journey=1&variant=58300000000003', blanket: '/products/your-dogs-personality-blanket?journey=1'};
const GIFTS = {mug: {url: '/products/your-dogs-illustrated-mug', handle: 'your-dogs-illustrated-mug', price: 45}, blanket: {url: '/products/your-dogs-personality-blanket', handle: 'your-dogs-personality-blanket', price: 129}, print: {url: '/products/your-dogs-portrait', handle: 'your-dogs-portrait', price: 59}};
const T0 = Date.now() - 20 * 60000;
/* a tab that came through the photo-first journey: the mug painted, answered and added (hs-journey.js handOver,
   then the first gift page's answers). journey: false is a buyer with no journey in this tab. */
async function open(items, {size = {width: 390, height: 844}, journey = true, photo = true, age = 0, queue = ['mug'], reduced = false, memory = null, pagecfg = {}} = {}) {
  page = {html: await cartPage(items, pagecfg), items};
  const ctx = await browser.newContext({viewport: size, isMobile: size.width < 900, hasTouch: size.width < 900, reducedMotion: reduced ? 'reduce' : 'no-preference'});
  const tab = await ctx.newPage();
  const errors = [], offsite = [];
  tab.on('pageerror', e => errors.push(e.message));
  await tab.route(u => !u.href.startsWith(base) && !/^(data|blob):/.test(u.href), r => { offsite.push(r.request().url()); return r.abort(); });
  await tab.route(/n8n\.cloud/, r => r.abort());
  await tab.addInitScript(([t, journey, photo, age, queue, URLS, GIFTS, memory]) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    if (memory) sessionStorage.setItem('hs-more', JSON.stringify(memory));
    if (!journey) return;
    sessionStorage.setItem('hs-artwork-choices-v1', JSON.stringify({version: 1, style: 'collage', tone: 'warm'}));
    sessionStorage.setItem('hs2-review', JSON.stringify({dog: 'Mowgli', person: 'Sam', hs3_lines: {home: 'a', spot: 'b', together: 'c', meaning: 'd'}, hs3_copy_owner: 'generated', hs3_photo_t: photo ? t : 0,
      hs3_art_profile: null, hs3_energy: '', hs3_art_choices: {style: 'collage', tone: 'warm'}, hs_brief_input: {breed: '', pronoun: 'they', archetype: '', likeness: true},
      hs_journey: {t: Date.now() - 60000 - age, mode: 'photo-first', gift: queue[0], tone: 'warm', style: 'collage', queue: queue.map(g => ({gift: g, url: URLS[g]})), gifts: GIFTS, notes: {}, answered: true, compose: {url: '', ai: false}}}));
    sessionStorage.setItem('hs-journey', JSON.stringify({dog: 'Mowgli', breed: 'Border Collie', pro: 'he', rel: 'named', person: 'Sam', home: 'door', spot: 'couch', together: 'walk', meaning: 'best', tone: 'warm', noteDone: true, gifts: Object.fromEntries(queue.map(g => [g, {on: true, variant: null}]))}));
  }, [T0, journey, photo, age, queue, URLS, GIFTS, memory]);
  if (photo && journey) {
    await tab.goto(base + '/robots.txt').catch(() => {});
    await tab.evaluate(t => fetch('/__photo.jpg').then(r => r.blob()).then(b => new Promise((resolve, reject) => {
      const f = new File([b], 'dog.jpg', {type: 'image/jpeg'}); const o = indexedDB.open('hs2', 1);
      o.onupgradeneeded = () => o.result.createObjectStore('files');
      o.onerror = () => reject(o.error);
      o.onsuccess = () => { const tx = o.result.transaction('files', 'readwrite'); tx.objectStore('files').put({file: f, t}, 'headshot'); tx.oncomplete = () => { o.result.close(); resolve(); }; };
    })), T0);
  }
  return {tab, ctx, errors, offsite};
}
const goCart = tab => tab.goto(base + '/cart');
const shown = (tab, timeout = 5000) => tab.waitForFunction(() => { const d = document.querySelector('[data-hs-more]'); return d && !d.hidden && d.classList.contains('is-in'); }, null, {timeout});
// the slide lands at 560 ms, and taps are ignored for 450 ms after that (a tap meant for the page)
const landed = tab => tab.waitForTimeout(1100);
const view = tab => tab.evaluate(() => {
  const d = document.querySelector('[data-hs-more]');
  const cards = [...d.querySelectorAll('[data-hs-more-card]')].map(li => ({gift: li.getAttribute('data-hs-more-card'), save: li.querySelector('[data-hs-more-save]').textContent, go: li.querySelector('[data-hs-more-go]').textContent,
    price: li.querySelector('[data-hs-more-price]').textContent, tag: li.querySelector('.hs-more__tag').textContent, alt: li.querySelector('img').alt, variant: (li.querySelector('select') || {}).value || ''}));
  const t = s => (d.querySelector(s) || {}).textContent || '';
  return {pill: t('[data-hs-more-pill]'), title: t('[data-hs-more-title]'), sub: t('[data-hs-more-sub]'), xmas: t('[data-hs-more-xmas]'), foot: t('[data-hs-more-foot]'), cards};
});
const state = tab => tab.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-review') || '{}'));
const copyOK = text => { assert.doesNotMatch(text, /!|—/, 'no exclamation marks or em dashes: ' + text); assert.doesNotMatch(text, /colour|favour/i); };

test('one gift, fresh journey: it bounces in from the left by itself, offers the blanket then the portrait with the real saving, and its button extends the journey: the blanket page paints once and asks nothing', async () => {
  const {tab, ctx, errors, offsite} = await open(CARTS.one());
  try {
    const t0 = Date.now();
    await goCart(tab);
    await shown(tab, 5000);
    assert.ok(Date.now() - t0 < 5000, 'early, not late');
    const v = await view(tab);
    assert.equal(v.pill, 'Second gift: 15% off both');
    assert.equal(v.title, 'Paint one more from the same photo');
    assert.equal(v.sub, 'Mowgli, in the same style. Nothing to answer again. Your mug stays in your cart.');
    assert.equal(v.xmas, 'Order by December 4 for Christmas delivery to a US address.');
    assert.equal(v.foot, 'The saving shows in your cart and at checkout. No code needed.');
    assert.deepEqual(v.cards.map(c => c.gift), ['blanket', 'print'], 'only the gifts not in the cart; the blanket leads for a mug cart');
    assert.equal(v.cards[0].save, 'You save $26.10 on the two.');
    assert.equal(v.cards[0].go, 'Paint the blanket');
    assert.equal(v.cards[1].variant, '58300000000006', 'the portrait is offered framed first for a mug cart');
    assert.equal(v.cards[1].save, 'You save $24.60 on the two.');
    assert.ok(v.cards.every(c => c.tag === 'Example' && /^Example: /.test(c.alt)), 'the home photos, each tagged Example');
    [v.pill, v.title, v.sub, v.xmas, v.foot, ...v.cards.flatMap(c => [c.save, c.go])].forEach(copyOK);
    // the portrait's frame changes the saving in place, and nothing in the card changes size
    const box = () => tab.evaluate(() => { const r = document.querySelector('[data-hs-more-card="print"]').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
    const before = await box();
    await tab.selectOption('[data-hs-more-card="print"] select', '58300000000009');
    assert.equal(await tab.textContent('[data-hs-more-card="print"] [data-hs-more-save]'), 'You save $15.60 on the two.');
    assert.equal(await tab.textContent('[data-hs-more-card="print"] [data-hs-more-price]'), '$59');
    assert.deepEqual(await box(), before, 'the card keeps its size');
    await landed(tab);
    await tab.screenshot({path: path.join(shots, '390-one-gift.png')});
    const t = (await state(tab)).hs_journey.t;
    await Promise.all([tab.waitForURL(/personality-blanket/, {timeout: 8000}), tab.click('[data-hs-more-card="blanket"] [data-hs-more-go]')]);
    assert.equal(new URL(tab.url()).pathname + new URL(tab.url()).search, '/products/your-dogs-personality-blanket?journey=1&variant=58300000000010');
    const j = (await state(tab)).hs_journey;
    assert.deepEqual(j.queue.map(q => q.gift), ['mug', 'blanket'], 'added at the end of the journey');
    assert.equal(j.queue[1].from, 'cart_more');
    assert.equal(j.t, t, 'the journey keeps its time, so no earlier page paints again');
    // the gift page: journey mode, painted once, nothing asked, the second of two
    await tab.waitForSelector('[data-hs-jm][data-phase="studio"]', {timeout: 15000});
    assert.equal(await tab.textContent('[data-hs-jm-title]'), 'Now the blanket');
    assert.match(await tab.textContent('[data-hs-jm-step]'), /gift 2 of 2/);
    await tab.waitForTimeout(9000);
    assert.equal(await tab.evaluate(() => window.__painted), 1, 'it paints exactly once');
    assert.equal(await tab.evaluate(() => /ask=/.test(location.hash)), false, 'nothing is asked');
    // the order says it came from the drawer (a hidden property, never shown at checkout)
    assert.equal(await tab.evaluate(() => (document.querySelector('#hs2-product-form [name="properties[_hs_from]"]') || {}).value), 'cart_more');
    assert.deepEqual(errors, []); assert.deepEqual(offsite.filter(u => /n8n/.test(u)), []);
  } finally { await ctx.close(); }
});

test('back with the blanket: it opens once more for the third gift, at $46.60 on all three with the portrait unframed', async () => {
  const {tab, ctx, errors} = await open(CARTS.two(), {queue: ['mug', 'blanket'], memory: {shown: 1, took: true}});
  try {
    await goCart(tab);
    await shown(tab);
    const v = await view(tab);
    assert.equal(v.pill, 'Third gift: 20% off all three');
    assert.equal(v.sub, 'Mowgli, in the same style. Nothing to answer again. Your mug and blanket stay in your cart.');
    assert.deepEqual(v.cards.map(c => c.gift), ['print']);
    assert.equal(v.cards[0].save, 'You save $58.60 on all three.', 'framed first, for a mug cart');
    await tab.selectOption('[data-hs-more-card="print"] select', '58300000000009');
    assert.equal(await tab.textContent('[data-hs-more-card="print"] [data-hs-more-save]'), 'You save $46.60 on all three.');
    await landed(tab);
    await tab.screenshot({path: path.join(shots, '390-two-gifts.png')});
    // the opener is the bundle line, in its own place
    assert.match(await tab.textContent('[data-hs-more-open]'), /^You are saving \$26\.10 on 2 gifts\./);
    // its events reach Shopify's customer events through hs2's track()
    const names = await tab.evaluate(() => window.__events.map(e => e[0]));
    assert.ok(names.includes('hs2_more_open'), names.join(','));
    // a gift already queued earlier (painted, then taken out of the cart) goes to the end, so the page after it is the cart
    const queue = await tab.evaluate(() => {
      const j = window.__hs2api.state.hs_journey;
      j.queue.push({gift: 'print', url: '/products/your-dogs-portrait?journey=1'});
      j.queue.unshift(j.queue.splice(1, 1)[0]);
      const ok = window.__hs2api.journeyMore('blanket', 58300000000010, '/products/your-dogs-personality-blanket?journey=1&variant=58300000000010');
      return {ok, gifts: JSON.parse(sessionStorage.getItem('hs2-review')).hs_journey.queue.map(q => q.gift)};
    });
    assert.deepEqual(queue, {ok: true, gifts: ['mug', 'print', 'blanket']});
    assert.equal(await tab.evaluate(() => window.__hs2api.journeyMore('blanket', 'x', '/products/a?journey=1')), false, 'a bad variant is refused');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('three gifts in the cart: no opener and no drawer; with the bundle switch off, neither', async () => {
  for (const [items, cfg] of [[CARTS.three(), {}], [CARTS.one(), {pagecfg: {live: false}}]]) {
    const {tab, ctx, errors} = await open(items, cfg);
    try {
      await goCart(tab);
      await tab.waitForFunction(() => document.querySelector('.cart-totals__tax-note[data-hs-note]'));
      await tab.waitForTimeout(3500);
      assert.equal(await tab.evaluate(() => !!document.querySelector('[data-hs-more-open]')), false, 'no opener');
      assert.equal(await tab.evaluate(() => { const d = document.querySelector('[data-hs-more]'); return !!d && !d.hidden; }), false, 'no drawer');
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  }
});

test('no fresh journey: its link starts the home journey with the gift ticked and the cart\'s gifts unticked', async () => {
  for (const [label, cfg] of [['no journey', {journey: false}], ['a journey over 6 hours old', {age: 7 * 36e5}]]) {
    const {tab, ctx, errors} = await open(CARTS.one(), cfg);
    try {
      await goCart(tab);
      await shown(tab);
      const v = await view(tab);
      assert.equal(v.title, 'Add another gift', label);
      assert.equal(v.sub, "Start from your dog's photo, then it paints. Your mug stays in your cart.", label);
      assert.equal(v.cards[0].go, 'Start with the photo', label);
      await landed(tab);
      await Promise.all([tab.waitForURL(/step=photo/, {timeout: 8000}), tab.click('[data-hs-more-card="blanket"] [data-hs-more-go]')]);
      assert.equal(new URL(tab.url()).search, '?step=photo&gift=blanket&variant=58300000000010&have=mug', label);
    } finally { await ctx.close(); }
    assert.deepEqual(errors, [], label);
  }
});

test('the start link unticks what is in the cart, even when an earlier journey in this tab ticked it', async () => {
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
  const tab = await ctx.newPage();
  await tab.route(u => !u.href.startsWith(base) && !/^(data|blob):/.test(u.href), r => r.abort());
  await tab.addInitScript(() => { if (!sessionStorage.getItem('hs-journey')) sessionStorage.setItem('hs-journey', JSON.stringify({gifts: {mug: {on: true, variant: null}}, hasPhoto: true, photoT: Date.now(), noteDone: true, style: 'collage', tone: 'warm'})); });
  try {
    await tab.goto(base + '/?step=photo&gift=blanket&variant=58300000000010&have=mug');
    await tab.waitForFunction(() => /"blanket"/.test(sessionStorage.getItem('hs-journey') || ''));
    const gifts = await tab.evaluate(() => JSON.parse(sessionStorage.getItem('hs-journey')).gifts);
    assert.deepEqual(Object.keys(gifts).filter(g => gifts[g].on), ['blanket'], 'only the blanket paints');
    assert.equal(gifts.blanket.variant, 58300000000010);
  } finally { await ctx.close(); }
});

test('at 375x667, a tap outside on Remove closes the drawer and never removes the gift; Escape closes it; it never reopens by itself; the opener opens it with focus in the title', async () => {
  const {tab, ctx, errors} = await open(CARTS.one(), {size: {width: 375, height: 667}});
  try {
    await goCart(tab);
    await tab.evaluate(() => { window.__removed = 0; document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.cart-items__remove, [name="minus"], [name="plus"]')) window.__removed++; }); });
    await shown(tab);
    await landed(tab);
    const remove = await tab.evaluate(() => { const b = document.querySelector('.cart-items__remove') || document.querySelector('[name="minus"]'); const r = b.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2, drawer: document.querySelector('[data-hs-more]').getBoundingClientRect().right}; });
    // the strip the drawer leaves uncovered on a phone
    const x = Math.max(remove.x, remove.drawer + 8);
    // one tap, as a finger gives it
    await tab.touchscreen.tap(x, remove.y);
    await tab.waitForTimeout(400);
    assert.equal(await tab.evaluate(() => document.querySelector('[data-hs-more]').hidden), true, 'the tap closed it');
    assert.equal(await tab.evaluate(() => window.__removed), 0, 'and landed on nothing');
    assert.equal(await tab.evaluate(() => document.querySelectorAll('.cart-items__table-row[data-key]').length), 1, 'the gift is still in the cart');
    assert.deepEqual(posts.filter(p => /cart\/(change|update)/.test(p)), [], 'no change request');
    // the opener: the bundle line, as a button, in its own box
    await tab.click('[data-hs-more-open]');
    await shown(tab);
    assert.equal(await tab.evaluate(() => document.activeElement && document.activeElement.id), 'hs-more-title');
    assert.equal(await tab.evaluate(() => document.querySelector('main').inert), true, 'the page behind is inert while it is open');
    await landed(tab);
    await tab.keyboard.press('Escape');
    await tab.waitForTimeout(300);
    assert.equal(await tab.evaluate(() => document.querySelector('[data-hs-more]').hidden), true, 'Escape closes it');
    assert.equal(await tab.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-hs-more-open')), true, 'focus goes back to the opener');
    assert.equal(await tab.evaluate(() => document.querySelector('main').inert), false);
    await tab.reload();
    await tab.waitForFunction(() => document.querySelector('[data-hs-more-open]'));
    await tab.waitForTimeout(3500);
    assert.equal(await tab.evaluate(() => { const d = document.querySelector('[data-hs-more]'); return !!d && !d.hidden; }), false, 'closed once, it never opens by itself again');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('paying is never blocked: the drawer\'s Check out presses the page\'s own; a pending quantity change holds the auto-open and both buttons; Back from the page cache re-enables it', async () => {
  const {tab, ctx, errors} = await open(CARTS.one());
  try {
    await goCart(tab);
    await tab.evaluate(() => { window.__paid = 0; document.querySelector('.cart-page__summary [name="checkout"]').addEventListener('click', e => { e.preventDefault(); window.__paid++; }); });
    await shown(tab);
    await landed(tab);
    await tab.click('[data-hs-more-pay]');
    assert.equal(await tab.evaluate(() => window.__paid), 1, 'the page\'s own Check out, so its gate applies');
    // a quantity change waiting to be confirmed
    await tab.evaluate(() => sessionStorage.setItem('heartside.quantity.pending.v1', '{"phase":"sent"}'));
    await tab.click('[data-hs-more-open]');
    await shown(tab);
    await tab.waitForTimeout(800);
    const held = await tab.evaluate(() => ({pay: document.querySelector('[data-hs-more-pay]').disabled, go: [...document.querySelectorAll('[data-hs-more-go]')].every(b => b.disabled), note: document.querySelector('[data-hs-more-note]').textContent}));
    assert.deepEqual(held, {pay: true, go: true, note: 'Finish the change in your cart first.'});
    await tab.keyboard.press('Escape');
    await tab.evaluate(() => sessionStorage.removeItem('heartside.quantity.pending.v1'));
    // Back from a gift page, restored from the page cache: the buttons work again
    await tab.evaluate(() => { document.querySelectorAll('[data-hs-more-go]').forEach(b => { b.disabled = true; }); window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true})); });
    await tab.click('[data-hs-more-open]');
    await shown(tab);
    assert.equal(await tab.evaluate(() => [...document.querySelectorAll('[data-hs-more-go]')].some(b => b.disabled)), false);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
  // and a cart opened with a change pending never opens the drawer by itself
  const second = await open(CARTS.one());
  try {
    await second.tab.addInitScript(() => sessionStorage.setItem('heartside.quantity.pending.v1', '{"phase":"sent"}'));
    await goCart(second.tab);
    await second.tab.waitForTimeout(4000);
    assert.equal(await second.tab.evaluate(() => { const d = document.querySelector('[data-hs-more]'); return !!d && !d.hidden; }), false);
  } finally { await second.ctx.close(); }
});

for (const size of [{width: 320, height: 568}, {width: 375, height: 667}, {width: 390, height: 844}, {width: 430, height: 932}, {width: 1280, height: 800}]) {
  test(`${size.width}x${size.height}: it fits, the page never scrolls sideways, the opener moves nothing, and the bounce shows no gap at the left edge`, async () => {
    // today's cart, the same lines, without the drawer: where Check out sits
    const plain = await open(CARTS.one(), {size, pagecfg: {drawer: false}});
    let baseline;
    try {
      await goCart(plain.tab);
      await plain.tab.waitForFunction(() => getComputedStyle(document.querySelector('.cart-totals__tax-note'), '::before').content.includes('second gift'));
      await plain.tab.waitForTimeout(300);
      baseline = await plain.tab.evaluate(() => Math.round(document.querySelector('.cart-page__summary [name="checkout"]').getBoundingClientRect().top));
    } finally { await plain.ctx.close(); }
    const {tab, ctx, errors} = await open(CARTS.one(), {size});
    try {
      await goCart(tab);
      // the left edge during the slide: sampled every frame
      await tab.evaluate(() => { window.__lefts = []; const f = () => { const p = document.querySelector('[data-hs-more-panel]'); if (p && !document.querySelector('[data-hs-more]').hidden) window.__lefts.push(p.getBoundingClientRect().left); if (window.__lefts.length < 80) requestAnimationFrame(f); }; requestAnimationFrame(f); });
      await shown(tab);
      await tab.waitForTimeout(900);
      const r = await tab.evaluate(() => {
        const d = document.querySelector('[data-hs-more]').getBoundingClientRect(), pay = document.querySelector('[data-hs-more-pay]').getBoundingClientRect();
        const page = document.querySelector('.cart-page__summary [name="checkout"]').getBoundingClientRect();
        const outside = [...document.querySelectorAll('[data-hs-more-panel] *')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > d.right + 1 || b.left < d.left - 1); }).map(e => e.className);
        return {right: d.right, bottom: d.bottom, payBottom: pay.bottom, w: innerWidth, h: innerHeight, scroll: document.documentElement.scrollWidth, outside, checkout: Math.round(page.top), pageCheckoutLeft: page.left, lefts: window.__lefts};
      });
      assert.ok(r.right <= r.w, 'inside the screen');
      assert.ok(r.payBottom <= r.h + 1, 'its Check out is on screen');
      assert.deepEqual(r.outside, [], 'nothing runs past the drawer');
      assert.ok(r.scroll <= r.w, `no sideways scroll (${r.scroll} > ${r.w})`);
      assert.ok(r.lefts.length > 5 && Math.max(...r.lefts) <= 0.5, `the panel never leaves the left edge (max ${Math.max(...r.lefts)})`);
      assert.ok(r.checkout <= baseline, `Check out has not moved down (${r.checkout} vs ${baseline})`);
      if (size.width >= 900) assert.ok(r.pageCheckoutLeft >= r.right, 'on the desktop the page\'s Check out stays uncovered');
      await tab.screenshot({path: path.join(shots, `${size.width}-open.png`)});
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}

test('reduced motion: it fades in, with no slide and no bounce', async () => {
  const {tab, ctx, errors} = await open(CARTS.one(), {reduced: true});
  try {
    await goCart(tab);
    await tab.evaluate(() => { window.__tf = []; const f = () => { const p = document.querySelector('[data-hs-more-panel]'); if (p && !document.querySelector('[data-hs-more]').hidden) window.__tf.push([getComputedStyle(p).transform, getComputedStyle(p).animationName]); if (window.__tf.length < 30) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await shown(tab);
    await tab.waitForTimeout(500);
    const frames = await tab.evaluate(() => window.__tf);
    assert.ok(frames.length > 3);
    assert.ok(frames.every(([t]) => t === 'none'), 'no transform at any frame');
    assert.equal(frames[0][1], 'hs-more-fade');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});
