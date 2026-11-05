// The journey, photo first (Krish, 4 Nov, after a real purchase: "one step at a time, non-duplicative, in the
// right order, and then the user purchases"; "'What style of design do you want?' is what the whole of this
// app experience should look like"; the painting screen "for a few seconds, which then can fade into the next
// steps of all the user inputs"). Walked on phones against the rendered theme, the note writer and Teeinblue
// stubbed, from the first screen to the cart:
//   the photo, the style, the gifts with each colour chosen once, "Start painting"; on the first gift's page the
//   painter starts at once, the studio shows, the questions follow while it paints, then the painting on the
//   product, one tick, one add; the next gift paints the same photo and asks nothing; then the cart.
// Screens go to out/journey-flow/.
//   cd tools/preview && node render.mjs && cd ../.. && node --test tools/preview/journey-flow.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out'), shots = path.join(out, 'journey-flow');
fs.mkdirSync(shots, {recursive: true});
const PHOTO = path.join(here, '../../assets/photos/pug-autumn-leaves.jpg');
const PAGE_FOR = {'your-dogs-illustrated-mug': 'product-mug-native.html', 'your-dogs-portrait': 'product-portrait-native.html', 'your-dogs-personality-blanket': 'product-blanket-native.html'};
const NOTES = {
  sentimental: {voice: 'A quiet, devoted friend.', lines: {home: 'I wait by the door until you come home.', spot: 'Your side of the couch stays warm with me.', together: 'Our walks are the best part of my day.', meaning: 'On the hard days, I stay right next to you.'}},
  warm: {voice: 'A loyal friend with a small smile.', lines: {home: "I'm at the door because I keep count.", spot: 'I save the couch for you, and I guard it well.', together: 'Our walk is the part of my day I never skip.', meaning: "On hard days, I'm the one who stays by you."}},
  hilarious: {voice: 'A deadpan roommate.', lines: {home: 'I take your arrivals very seriously, so I wait.', spot: "I keep your spot warm because the couch can't be trusted.", together: 'Our walk is the best part of my day, and I will testify.', meaning: 'Hard days are my specialty, so I stay close.'}},
  over_the_top: {voice: 'A smug star.', lines: {home: 'I wait at the door like a star waiting for a very slow driver.', spot: 'You may sit on whatever part of the couch I leave you.', together: 'I take you on walks because you would never find the outside alone.', meaning: 'I let you live here, and I love you.'}}
};
// Teeinblue on each gift page: its hidden painting fields, a count of every photo handed to it, and its add
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
  if (!fs.existsSync(path.join(out, 'index-journey.html'))) execFileSync(process.execPath, ['render.mjs'], {cwd: here, stdio: 'ignore'});
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/cart.js') { res.writeHead(200, {'Content-Type': 'application/json'}); return res.end(JSON.stringify({items: cart})); }
    if (u.pathname === '/__add') { cart.push({handle: u.searchParams.get('h')}); res.writeHead(200); return res.end('ok'); }
    if (u.pathname === '/cart') { res.writeHead(200, {'Content-Type': 'text/html'}); return res.end('<!doctype html><title>Cart</title><h1>Cart</h1>'); }
    let f = path.join(out, decodeURIComponent(u.pathname));
    if (u.pathname === '/') f = path.join(out, 'index-journey.html');
    if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
    else if (u.pathname.startsWith('/products/')) f = path.join(out, PAGE_FOR[u.pathname.split('/')[2]] || 'missing');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
    res.writeHead(200, {'Content-Type': type});
    if (u.pathname.startsWith('/products/')) return res.end(fs.readFileSync(f, 'utf8').replace('<head>', '<head>' + STANDIN));
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => { await browser.close(); server.close(); });

async function open({width = 390, height = 844} = {}) {
  const ctx = await browser.newContext({viewport: {width, height}, hasTouch: true, isMobile: width < 900});
  const page = await ctx.newPage();
  const calls = [], errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route((url) => !url.href.startsWith(base) && !/n8n/i.test(url.href) && !/^(data|blob):/.test(url.href), (r) => r.abort());
  await page.route(/n8n/i, async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({status: 204, headers: {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type'}});
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.warm) return route.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: '{"warm":true}'});
    calls.push(body);
    await new Promise((r) => setTimeout(r, 150));
    return route.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify({...NOTES[body.note_tone], recommended_gift: 'mug', reason: '', flags: [], source: 'ai'})});
  });
  return {ctx, page, calls, errors};
}
const pick = (page, group, v) => page.locator(`[data-hsj-pick="${group}"][data-v="${v}"]`).click();
const SIZES = [{width: 320, height: 568}, {width: 360, height: 640}, {width: 375, height: 667}, {width: 390, height: 844}, {width: 412, height: 915}, {width: 430, height: 932}, {width: 1440, height: 900}];
async function noScroll(page, where) {
  const {sh, ih} = await page.evaluate(() => ({sh: document.documentElement.scrollHeight, ih: window.innerHeight}));
  assert.ok(sh <= ih + 1, `${where} scrolls: ${sh} > ${ih}`);
}
// a painting Teeinblue has finished and saved, on whatever gift page is open
const paintDone = page => page.evaluate(() => {
  const a = document.querySelector('[data-hs-art]');
  a.setAttribute = function (k, v) { return Element.prototype.setAttribute.call(this, k, k === 'data-state' ? 'done' : v); };
  a.setAttribute('data-state', 'done');
  a.querySelector('[data-hs-art-result]').src = '/assets/hs-ex-style-screenprint.webp';
});
// the tick is hs2's own approval box, which wants Teeinblue's real saved painting; the stand-in takes the tick,
// and Teeinblue's own add button adds this page's gift to the stand-in cart
const ready = page => page.evaluate(() => {
  const a = document.querySelector('[data-hs2-artwork-accept]'), b = a.cloneNode(); let on = false;
  Object.defineProperty(b, 'checked', {get: () => on, set: v => { on = !!v; }}); a.replaceWith(b);
  document.querySelector('#buy #teeAtcButton').click = () => { fetch('/__add?h=' + location.pathname.split('/')[2]); };
});
// the top of each frame and the dock stay put: nothing above the button moves while the dog talks or the painting lands
const frameBox = page => page.evaluate(() => { const f = document.querySelector('[data-hs-jm-frame]'), d = f && f.querySelector('.hsj-dock'); return d ? Math.round(d.getBoundingClientRect().top) : -1; });

// the home page: photo, style, gifts, each colour chosen once, then the first gift's page
async function home(page, size, shot) {
  await page.goto(`${base}/`);
  await page.locator('[data-hsj-go]').first().click();
  await page.waitForURL(/step=photo/);
  await page.waitForSelector('[data-hsj-screen="photo"]');
  if (size.width < 900) await noScroll(page, 'photo');
  if (shot) await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, shot + '-1-photo.png')});
  await page.evaluate(() => { window.HSPhotoQuality = {check: () => Promise.resolve({verdict: 'ok', reasons: []})}; });
  await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
  await page.waitForURL(/step=look/);
  await page.waitForSelector('[data-hsj-screen="look"]');
  if (size.width < 900) await noScroll(page, 'look');
  await page.locator('[data-hsj-style="painterly"]').click();
  assert.equal(await page.locator('[data-hsj-style="painterly"]').getAttribute('aria-pressed'), 'true');
  if (shot) await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, shot + '-2-look.png')});
  await page.locator('[data-hsj-next]').click();
  await page.waitForURL(/step=gifts/);
  await page.waitForSelector('[data-hsj-screen="gifts"]');
  assert.equal(await page.locator('[data-hsj-start]').isDisabled(), true, 'nothing paints before a gift is chosen');
  // the portrait, framed in white, and the mug, dark green: each choice made here, once
  await page.locator('[data-hsj-gift="print"]').click();
  const printOpts = await page.locator('[data-hsj-gift-card="print"] [data-hsj-variant]').allTextContents();
  assert.deepEqual(printOpts.map(t => t.trim()).sort(), ['Black frame, $119', 'Red Oak frame, $119', 'Unframed, $59', 'White frame, $119']);
  await page.locator('[data-hsj-gift-card="print"] [data-hsj-variant]', {hasText: 'White frame'}).click();
  await page.locator('[data-hsj-gift="mug"]').click();
  await page.locator('[data-hsj-gift-card="mug"] [aria-label="Dark Green"]').click();
  assert.equal(await page.locator('[data-hsj-gift-card="mug"] .hsj-gift__opt-name b').textContent(), 'Dark Green');
  assert.match(await page.locator('[data-hsj-offer]').textContent(), /save 15% on these 2/);
  assert.match(await page.locator('.hsj-when').textContent(), /Order by December 10 for Christmas delivery to a US address/);
  if (shot) await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, shot + '-3-gifts.png'), fullPage: false});
  await page.locator('[data-hsj-start]').click();
  await page.waitForURL(/\/products\/your-dogs-portrait\?.*journey=1/);
}

for (const size of SIZES) test(`photo first at ${size.width}x${size.height}: photo, style, gifts once, then it paints while the questions run, then the painting, one add per gift, the cart`, async () => {
  cart = [];
  const {ctx, page, calls, errors} = await open(size);
  const shot = size.width + 'x' + size.height;
  try {
    await home(page, size, shot);
    // the hand-over carries only what paints the picture, and the painter is asked for the dog in the photo
    const hand = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-review')));
    assert.equal(hand.hs_journey.mode, 'photo-first');
    assert.deepEqual(hand.hs_journey.queue.map(q => q.gift), ['print', 'mug'], 'the portrait paints first, then the mug');
    assert.match(hand.hs_journey.queue[0].url, /variant=/);
    assert.equal(hand.hs3_art_choices.style, 'painterly');
    assert.equal(hand.hs_brief_input.likeness, true);
    await page.waitForFunction(() => window.__sends > 0, null, {timeout: 15000});
    await page.waitForSelector('[data-hs-jm]:not([hidden]) [data-hs-jm-frame]:not([hidden]) [data-hs-jm-paint] [data-hs-art]');
    assert.equal(await page.locator('[data-hs-jm-title]').textContent(), 'Painting your dog');
    const brief = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-brief]')].map(i => [i.getAttribute('data-brief'), i.value])));
    assert.match(brief['Tone direction'], /^A true likeness of this exact dog/);
    assert.match(brief['Style direction'], /painterly|painting/i);
    if (size.width < 900) await noScroll(page, 'the studio');
    await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, shot + '-4-studio.png')});
    // a few seconds of the studio, then the questions, in the same frame, with the painting badge
    await page.waitForFunction(() => /ask=name/.test(location.hash), null, {timeout: 12000});
    await page.waitForSelector('[data-hsj-screen="name"] [data-hsj-paint]');
    if (size.width < 900) await noScroll(page, 'the first question');
    await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, shot + '-5-name.png')});
    await page.locator('[data-hsj-name]').fill('Pickles');
    await page.locator('[data-hsj-next]').click();
    await pick(page, 'breed', 'Pug'); await pick(page, 'pro', 'she');
    await page.waitForSelector('[data-hsj-screen="person"]');
    await page.locator('[data-hsj-person]').fill('Mom');
    await page.locator('[data-hsj-next]').click();
    for (const [id, v] of [['home', 'door'], ['spot', 'couch'], ['together', 'naps'], ['meaning', 'best']]) { await page.waitForSelector(`[data-hsj-screen="${id}"]`); if (size.width < 900) await noScroll(page, id); await pick(page, id, v); }
    await page.waitForSelector('[data-hsj-screen="words"]');
    for (let i = 0; i < 50 && !calls.length; i++) await page.waitForTimeout(100);
    await page.locator('[data-hsj-tone="hilarious"]').click();
    await page.waitForFunction(() => /arrivals very seriously/.test(document.querySelector('[data-hsj-note]').textContent), null, {timeout: 8000});
    if (size.width < 900) await noScroll(page, 'the note');
    await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, shot + '-6-note.png')});
    // the painting is not back yet: the studio again, in the same frame, then the painting on the product
    await page.locator('[data-hsj-next]').click();
    await page.waitForSelector('[data-hs-jm][data-phase="wait"]');
    assert.equal(await page.locator('[data-hs-jm-title]').textContent(), 'Almost there');
    const dockWaiting = await frameBox(page);
    await paintDone(page);
    await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 8000});
    assert.equal(await page.locator('[data-hs-jm-title]').textContent(), 'Pickles on the portrait');
    assert.equal(await frameBox(page), dockWaiting, 'the dock does not move when the painting lands');
    assert.equal(await page.locator('[data-hs-jm-tick-text]').textContent(), 'Yes, this is Pickles');
    assert.equal(await page.locator('[data-hs-jm-add]').isDisabled(), true, 'the add waits for the tick');
    if (size.width < 900) await noScroll(page, 'the reveal');
    await page.waitForTimeout(300); await page.screenshot({path: path.join(shots, shot + '-7-reveal.png')});
    // the order carries the note and the names before it is added
    const order = await page.evaluate(() => ({dog: window.__hs2api.state.dog, person: window.__hs2api.state.person, lines: window.__hs2api.state.hs3_lines, tone: window.__hs2api.state.hs_journey.tone}));
    assert.equal(order.dog, 'Pickles'); assert.equal(order.person, 'Mom');
    assert.match(order.lines.home, /arrivals very seriously/); assert.equal(order.tone, 'hilarious');
    await ready(page);
    await page.locator('[data-hs-jm-tick]').check();
    assert.match(await page.locator('[data-hs-jm-add]').textContent(), /Add it, then paint the mug/);
    await page.locator('[data-hs-jm-add]').click();
    // the mug: its own page paints the same photo, in the same style, and asks nothing
    await page.waitForURL(/\/products\/your-dogs-illustrated-mug\?.*journey=1/, {timeout: 20000});
    assert.deepEqual(cart.map(c => c.handle), ['your-dogs-portrait']);
    await page.waitForFunction(() => window.__sends > 0, null, {timeout: 15000});
    await page.waitForSelector('[data-hs-jm][data-phase="studio"]');
    assert.equal(await page.locator('[data-hs-jm-title]').textContent(), 'Now the mug');
    await page.waitForTimeout(7000);
    assert.equal(await page.evaluate(() => /ask=/.test(location.hash)), false, 'no question is asked again');
    await paintDone(page);
    await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 8000});
    assert.equal(await page.locator('[data-hs-jm-title]').textContent(), 'Pickles on the mug');
    assert.equal(await page.evaluate(() => document.querySelectorAll('[data-hsj-variant], .hs-jm-dot, .hs-jm-pill').length), 0, 'no colour is asked again');
    await ready(page);
    await page.locator('[data-hs-jm-tick]').check();
    assert.match(await page.locator('[data-hs-jm-add]').textContent(), /^Add to cart/);
    await page.locator('[data-hs-jm-add]').click();
    await page.waitForURL(/\/cart$/, {timeout: 20000});
    assert.deepEqual(cart.map(c => c.handle), ['your-dogs-portrait', 'your-dogs-illustrated-mug'], 'two gifts, each added once');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('a deep link past the photo lands on the photo, Back steps one screen, and a refused photo stays put', async () => {
  const {ctx, page} = await open();
  try {
    await page.goto(`${base}/?step=gifts`);
    await page.waitForURL(/step=photo/);
    await page.evaluate(() => { window.HSPhotoQuality = {check: () => Promise.resolve({verdict: 'reject', overridable: true, reasons: [{code: 'no_dog', message: "I couldn't find a dog in this photo."}]})}; });
    await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
    await page.waitForFunction(() => /couldn't find a dog/.test(document.querySelector('[data-hsj-photo-note]').textContent));
    assert.match(page.url(), /step=photo/, 'a refused photo goes nowhere');
    await page.locator('[data-hsj-override]').click();
    await page.waitForURL(/step=look/);
    await page.locator('[data-hsj-next]').click();
    await page.waitForURL(/step=gifts/);
    await page.locator('[data-hsj-back]').click();
    await page.waitForURL(/step=look/);
    await page.locator('[data-hsj-next]').click();
    await page.waitForURL(/step=gifts/);
    await page.locator('[data-hsj-gift="blanket"]').click();
    assert.equal(await page.locator('[data-hsj-gift-card="blanket"] [data-hsj-variant]').count(), 0, 'the blanket has nothing to choose');
    await page.locator('[data-hsj-gift="blanket"]').click();
    assert.equal(await page.locator('[data-hsj-start]').isDisabled(), true, 'unticking the only gift stops the start');
  } finally { await ctx.close(); }
});

test('a buyer from a gift page finds that gift already chosen', async () => {
  const {ctx, page} = await open();
  try {
    await page.goto(`${base}/?step=photo&gift=blanket`);
    await page.evaluate(() => { window.HSPhotoQuality = {check: () => Promise.resolve({verdict: 'ok', reasons: []})}; });
    await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
    await page.waitForURL(/step=look/);
    await page.locator('[data-hsj-next]').click();
    await page.waitForSelector('[data-hsj-screen="gifts"]');
    assert.equal(await page.locator('[data-hsj-gift="blanket"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-hsj-start]').isDisabled(), false);
  } finally { await ctx.close(); }
});
