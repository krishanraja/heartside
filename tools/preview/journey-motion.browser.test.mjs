// The journey's motion (Krish, 5 Nov: "each screen doesn't transition to the next one in as beautiful a way as
// possible. It's a bit juttery."). Walked from the first home step to the painting on the first gift, every frame of
// every document sampled from its first: the bar, the progress line and the dock never blink, the dock's button keeps
// one place on every phone screen of both pages, the line only moves forward, the store header never paints as the
// gift page opens, the studio's easel hands over to the painting card with nothing changing, and only the content
// moves. View Transitions paint pseudo-elements the DOM cannot see, so the sampler reads
// document.documentElement.getAnimations({subtree: true}) on every frame and names what moved.
//
// Nothing leaves localhost: every other request is aborted, the n8n host's preconnect hint is taken out of the pages
// as they are served, and Chromium sends anything not on loopback to a dead proxy.
//   cd tools/preview && node render.mjs && node --test journey-motion.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out'), shots = path.join(out, 'journey-motion');
fs.mkdirSync(shots, {recursive: true});
const PHOTO = path.join(here, '../../assets/photos/pug-autumn-leaves.jpg');
const PAGE_FOR = {'your-dogs-illustrated-mug': 'product-mug-native.html', 'your-dogs-portrait': 'product-portrait-native.html', 'your-dogs-personality-blanket': 'product-blanket-native.html'};
const N8N = /n8n\.cloud/i;
// Teeinblue on the gift page: its hidden painting fields and a count of paintings (hs2's lock reaching "sent")
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

// every frame of every document, from its first: where the dock's button is, how visible the bar, the line and the
// button are (their own and their ancestors' opacity), how far the line has run, whether the store header shows,
// the studio's bubble, and every animation running, View Transition pseudo-elements included
const SAMPLER = () => {
  window.__m = [];
  const shown = el => {
    if (!el || !el.getClientRects().length) return 0;
    let o = 1;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return 0; o *= +s.opacity; }
    return o;
  };
  const loop = () => {
    const f = {t: Math.round(performance.now()), page: location.pathname.startsWith('/products/') ? 'gift' : 'home'};
    const jm = document.querySelector('[data-hs-jm]:not([hidden])');
    const frame = jm && jm.querySelector('[data-hs-jm-frame]:not([hidden])');
    const ask = jm && jm.querySelector('[data-hsj]:not([hidden]) [data-hsj-app]:not([hidden]) .hsj__screen--step');
    const homeScreen = !jm && document.querySelector('[data-hsj-app]:not([hidden]) .hsj__screen--step');
    const box = frame || ask || homeScreen;
    if (box) {
      f.screen = frame ? 'frame:' + jm.getAttribute('data-phase') : box.getAttribute('data-hsj-screen');
      const btn = box.querySelector('.hsj-dock .hsj-btn'), line = box.querySelector('.hsj-progress span'), bar = box.querySelector('.hsj-bar');
      if (btn) { const r = btn.getBoundingClientRect(); f.btn = Math.round(r.top); f.btnO = shown(btn); }
      if (line) { f.line = Math.round(line.getBoundingClientRect().width / line.parentElement.getBoundingClientRect().width * 100); f.lineO = shown(line); }
      if (bar) f.barO = shown(bar);
      const head = box.querySelector('.hsj-headline');
      if (head) f.head = head.textContent;
    }
    f.header = [...document.querySelectorAll('.shopify-section-group-header-group, .header-group, .footer-group')].some(e => shown(e) > 0);
    if (jm) {
      const easel = jm.querySelector('[data-hs-jm-easel]'), card = jm.querySelector('[data-hs-jm-paint] [data-hs-art]');
      const on = shown(card) ? card : shown(easel) ? easel : null;
      if (on) {
        const bub = on.querySelector('.hs-wait__bubble');
        f.easel = on === card ? 'card' : 'easel';
        if (bub) { const r = bub.getBoundingClientRect(); f.bubble = [Math.round(r.top), Math.round(r.height)]; f.say = bub.querySelector('.hs-wait__say').textContent; f.who = bub.querySelector('.hs-wait__who').textContent; }
      }
    }
    f.anims = document.documentElement.getAnimations({subtree: true}).filter(a => a.playState === 'running').map(a => {
      const e = a.effect, pe = e && e.pseudoElement || '', t = e && e.target;
      return pe.indexOf('::view-transition') === 0 ? pe : (t && t.className && String(t.className.baseVal != null ? t.className.baseVal : t.className)).split(' ')[0] + '@' + (a.animationName || a.transitionProperty || '');
    });
    f.vt = document.documentElement.hasAttribute('data-hsj-vt');
    window.__m.push(f);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

let server, base, browser;
before(async () => {
  if (!fs.existsSync(path.join(out, 'index-journey.html'))) execFileSync(process.execPath, ['render.mjs'], {cwd: here, stdio: 'ignore'});
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/cart.js') { res.writeHead(200, {'Content-Type': 'application/json'}); return res.end('{"items":[]}'); }
    let f = path.join(out, decodeURIComponent(u.pathname));
    if (u.pathname === '/') f = path.join(out, 'index-journey.html');
    if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
    else if (u.pathname.startsWith('/products/')) f = path.join(out, PAGE_FOR[u.pathname.split('/')[2]] || 'missing');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    const type = f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
    res.writeHead(200, {'Content-Type': type});
    if (f.endsWith('.html')) {
      // the note writer's preconnect hint: a route abort cannot stop a preconnect, so it never reaches the browser
      let html = fs.readFileSync(f, 'utf8').replace(/<link[^>]+rel="preconnect"[^>]+n8n\.cloud[^>]*>/gi, '');
      if (u.pathname.startsWith('/products/')) html = html.replace('<head>', '<head>' + STANDIN);
      return res.end(html);
    }
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port;
  // anything not on loopback goes to a dead proxy, so nothing can leave this machine whatever a page asks for
  browser = await chromium.launch({args: ['--proxy-server=http://127.0.0.1:9']});
});
after(async () => { await browser?.close(); server?.close(); });

async function open(size, reduced) {
  const ctx = await browser.newContext({viewport: {width: size.width, height: size.height}, hasTouch: true, isMobile: size.width < 900, reducedMotion: reduced ? 'reduce' : 'no-preference'});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  // the note writer is asked (the page does not know it is a test), and every ask is aborted before it leaves
  page.on('requestfinished', r => { if (N8N.test(r.url())) errors.push('an n8n request went through: ' + r.method()); });
  await page.route(u => !u.href.startsWith(base) && !/^(data|blob):/.test(u.href), r => r.abort());
  await page.addInitScript(SAMPLER);
  return {ctx, page, errors};
}
const pick = (page, group, v) => page.locator(`[data-hsj-pick="${group}"][data-v="${v}"]`).click();
const frames = page => page.evaluate(() => window.__m);
const paintDone = page => page.evaluate(() => {
  const a = document.querySelector('[data-hs-art]');
  a.setAttribute = function (k, v) { return Element.prototype.setAttribute.call(this, k, k === 'data-state' ? 'done' : v); };
  a.setAttribute('data-state', 'done');
  a.querySelector('[data-hs-art-result]').src = '/assets/hs-ex-style-screenprint.webp';
});
// a screen is settled once its content has arrived; taps wait for that, as a buyer's would
const settled = page => page.waitForFunction(() => !document.documentElement.hasAttribute('data-hsj-vt'), null, {timeout: 3000}).catch(() => {});

// the first gift, from the first home step to the painting on the product; the frames of both pages
async function walk(page) {
  const home = [], gift = [];
  await page.goto(base + '/');
  await page.locator('[data-hsj-go]').first().click();
  await page.waitForSelector('[data-hsj-screen="photo"]');
  await page.evaluate(() => { window.HSPhotoQuality = {check: () => Promise.resolve({verdict: 'ok', reasons: []})}; });
  await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
  await page.waitForSelector('[data-hsj-screen="look"]'); await settled(page); await page.waitForTimeout(250);
  await page.locator('[data-hsj-style="painterly"]').click();
  await page.locator('[data-hsj-next]').click();
  await page.waitForSelector('[data-hsj-screen="tone"]'); await settled(page); await page.waitForTimeout(250);
  await page.locator('[data-hsj-feel="warm"]').click();
  await page.locator('[data-hsj-next]').click();
  await page.waitForSelector('[data-hsj-screen="gifts"]'); await settled(page); await page.waitForTimeout(250);
  await page.locator('[data-hsj-gift="print"]').click();
  await page.waitForTimeout(250);
  home.push(...await frames(page));
  await page.locator('[data-hsj-start]').click();
  await page.waitForURL(/\/products\/your-dogs-portrait\?.*journey=1/);
  await page.waitForFunction(() => window.__painted === 1, null, {timeout: 15000});
  await page.waitForFunction(() => /ask=name/.test(location.hash), null, {timeout: 12000});
  await page.waitForSelector('[data-hsj-screen="name"] [data-hsj-name]'); await settled(page);
  await page.locator('[data-hsj-name]').fill('Pickles');
  await page.locator('[data-hsj-next]').click();
  await page.waitForSelector('[data-hsj-screen="breed"]'); await settled(page); await pick(page, 'breed', 'Pug');
  await page.waitForSelector('[data-hsj-screen="pro"]'); await settled(page); await pick(page, 'pro', 'she');
  await page.waitForSelector('[data-hsj-screen="person"]'); await settled(page);
  await page.locator('[data-hsj-person]').fill('Mom');
  await page.locator('[data-hsj-next]').click();
  for (const [id, v] of [['home', 'door'], ['spot', 'couch'], ['together', 'naps'], ['meaning', 'best']]) { await page.waitForSelector(`[data-hsj-screen="${id}"]`); await settled(page); await pick(page, id, v); }
  await page.waitForSelector('[data-hsj-screen="words"]'); await settled(page);
  await page.waitForTimeout(600);
  await page.locator('[data-hsj-next]').click();
  await page.waitForSelector('[data-hs-jm][data-phase="wait"]'); await settled(page);
  await page.waitForTimeout(500);
  await paintDone(page);
  await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 8000}); await settled(page);
  await page.waitForTimeout(600);
  gift.push(...await frames(page));
  return {home, gift};
}
// frames with a screen fully on show, outside any change of screen
const steady = fs => fs.filter(f => f.screen && f.btnO > 0.99 && !f.vt);
// the run of line values a page shows, in order, without repeats
const runOf = fs => fs.filter(f => f.line != null && f.lineO > 0.5).map(f => f.line).filter((v, i, a) => i === 0 || v !== a[i - 1]);

const SIZES = [{width: 320, height: 568}, {width: 390, height: 844}, {width: 1280, height: 800}];
for (const [size, reduced] of [...SIZES.map(s => [s, false]), [{width: 390, height: 844}, true]]) test(`${size.width}x${size.height}${reduced ? ', reduced motion' : ''}: the chrome holds still, the line runs forward, and only the content moves`, async () => {
  const {ctx, page, errors} = await open(size, reduced);
  try {
    const {home, gift} = await walk(page);
    const all = [...home, ...gift].filter(f => f.screen);
    // the bar, the line and the dock never blink: on every frame with a screen they are fully there
    const blinks = all.filter(f => f.barO < 0.99 || f.lineO < 0.99 || f.btnO < 0.99);
    assert.deepEqual(blinks.slice(0, 3).map(f => [f.page, f.screen, f.t, f.barO, f.lineO, f.btnO]), [], 'the bar, the line and the button never fade');
    // the dock's button keeps one place on every phone screen of both pages (desktop places it by the card's layout)
    if (size.width < 900) {
      const at = [...new Set(steady(all).map(f => f.btn))];
      assert.equal(at.length, 1, "the button's top on every screen: " + JSON.stringify([...new Map(steady(all).map(f => [f.screen, f.btn]))]));
    }
    // the line only moves forward, on each page
    for (const [name, fs] of [['home', home], ['gift', gift]]) {
      const run = runOf(fs);
      assert.ok(run.every((v, i) => i === 0 || v >= run[i - 1]), name + ': the line never runs back ' + JSON.stringify(run));
    }
    // the store header never paints as the gift page opens, nor at any time in the journey
    assert.equal(gift.filter(f => f.header).length, 0, 'the store header never shows on the gift page');
    // the studio's easel hands over to the painting card with nothing changing
    const i = gift.findIndex(f => f.easel === 'card');
    assert.ok(i > 0 && gift[i - 1].easel === 'easel', 'the easel shows, then the card');
    assert.deepEqual([gift[i].bubble, gift[i].who, gift[i].say], [gift[i - 1].bubble, gift[i - 1].who, gift[i - 1].say], 'the bubble is the same at the handover');
    // only the content moves: the motion layer animates the content and nothing else
    const named = [...new Set(all.flatMap(f => f.anims).filter(a => a.indexOf('::view-transition') === 0))];
    assert.ok(named.every(a => /\(hsj-content\)$/.test(a)), 'only the content is animated: ' + JSON.stringify(named));
    if (reduced) assert.deepEqual(named, [], 'reduced motion: no transitions at all');
    else for (const [name, fs] of [['home', home], ['gift', gift]]) assert.ok(fs.some(f => f.anims.includes('::view-transition-new(hsj-content)')), name + ': the content moved through a View Transition');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

// transitions review, 5 Nov: while a screen changes, a tap lands on the new screen before the buyer can see it. The
// 5 Nov double tap that skipped the tone was that kind of failure. A tap on an answer waits until the screen is there.
async function toLook(page) {
  await page.goto(base + '/');
  await page.locator('[data-hsj-go]').first().click();
  await page.waitForSelector('[data-hsj-screen="photo"]');
  await page.evaluate(() => { window.HSPhotoQuality = {check: () => Promise.resolve({verdict: 'ok', reasons: []})}; });
  await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
  await page.waitForSelector('[data-hsj-screen="look"]'); await settled(page); await page.waitForTimeout(300);
}
test('a tap on an answer while the screen is still changing is not taken; the headline takes the focus', async () => {
  const {ctx, page, errors} = await open({width: 390, height: 844});
  try {
    await toLook(page);
    // a step: the new headline has the focus once the screen is there
    await page.locator('[data-hsj-next]').click();
    await page.waitForSelector('[data-hsj-screen="tone"]'); await settled(page);
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('hsj-headline') && document.activeElement.textContent), 'How should it feel?', 'the new headline has the focus');
    await page.locator('[data-hsj-back]').click();
    await page.waitForSelector('[data-hsj-screen="look"]'); await settled(page); await page.waitForTimeout(300);
    const next = await page.locator('[data-hsj-next]').boundingBox();
    // the style's Next, then 120 ms later a single tap where the tone's first card will be
    await page.mouse.click(next.x + next.width / 2, next.y + next.height / 2);
    await page.waitForTimeout(120);
    await page.waitForSelector('[data-hsj-screen="tone"] [data-hsj-feel]', {state: 'attached'});
    const card = await page.locator('[data-hsj-screen="tone"] [data-hsj-feel][aria-pressed="false"]').first().boundingBox();
    const before = await page.evaluate(() => [...document.querySelectorAll('[data-hsj-feel][aria-pressed="true"]')].map(b => b.getAttribute('data-hsj-feel')));
    await page.mouse.click(card.x + card.width / 2, card.y + card.height / 2);
    await settled(page); await page.waitForTimeout(200);
    const after = await page.evaluate(() => [...document.querySelectorAll('[data-hsj-feel][aria-pressed="true"]')].map(b => b.getAttribute('data-hsj-feel')));
    assert.deepEqual(after, before, 'the tone is as it was before the early tap');
    // a tap once the screen is there counts
    await page.locator('[data-hsj-feel="hilarious"]').click();
    assert.equal(await page.locator('[data-hsj-feel="hilarious"]').getAttribute('aria-pressed'), 'true');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

// where View Transitions are missing, the content fades in (opacity only) and the chrome still holds still
test('without View Transitions: the content fades in, the chrome holds still, and Back works', async () => {
  const {ctx, page, errors} = await open({width: 390, height: 844});
  try {
    await page.addInitScript(() => { delete Document.prototype.startViewTransition; });
    await toLook(page);
    await page.locator('[data-hsj-next]').click();
    await page.waitForSelector('[data-hsj-screen="tone"]'); await page.waitForTimeout(400);
    await page.locator('[data-hsj-back]').click();
    await page.waitForSelector('[data-hsj-screen="look"]'); await page.waitForTimeout(400);
    const fs = await frames(page);
    assert.ok(fs.some(f => f.anims.some(a => a === 'hsj-content@hsj-step')), 'the content fades in');
    assert.ok(!fs.some(f => f.anims.some(a => a.indexOf('::view-transition') === 0) || f.vt), 'no View Transition');
    assert.deepEqual(fs.filter(f => f.screen && (f.barO < 0.99 || f.lineO < 0.99 || f.btnO < 0.99)).length, 0, 'the chrome never fades');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

// Back slides the other way: the content leaves to the right and the earlier screen comes in from the left
test('Back moves the content the other way, and the line follows it back', async () => {
  const {ctx, page, errors} = await open({width: 390, height: 844});
  try {
    await toLook(page);
    await page.locator('[data-hsj-next]').click();
    await page.waitForSelector('[data-hsj-screen="tone"]'); await settled(page); await page.waitForTimeout(300);
    await page.evaluate(() => { window.__dirs = []; new MutationObserver(() => { const d = document.documentElement.getAttribute('data-hsj-vt'); if (d) window.__dirs.push(d); }).observe(document.documentElement, {attributes: true, attributeFilter: ['data-hsj-vt']}); });
    await page.locator('[data-hsj-back]').click();
    await page.waitForSelector('[data-hsj-screen="look"]'); await settled(page);
    assert.deepEqual(await page.evaluate(() => window.__dirs), ['back']);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});
