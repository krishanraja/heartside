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
let server, base, browser, cart = [];
before(async () => {
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/cart.js') { res.writeHead(200, {'Content-Type': 'application/json'}); return res.end(JSON.stringify({items: cart})); }
    let f = path.join(out, decodeURIComponent(u.pathname));
    if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
    else if (u.pathname.startsWith('/products/')) f = path.join(out, PAGE_FOR[u.pathname.split('/')[2]] || 'missing');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'});
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
    // count every file handed to Teeinblue's photo field
    window.__sends = 0;
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
    if (sessionStorage.getItem('hs2-review')) return;
    sessionStorage.setItem('hs-artwork-choices-v1', JSON.stringify({version: 1, style: 'collage', tone: 'hilarious'}));
    sessionStorage.setItem('hs2-review', JSON.stringify({
      dog: 'Mowgli', person: 'Sam', hs3_lines: {home: 'a', spot: 'b', together: 'c', meaning: 'You let me live here.'}, hs3_copy_owner: 'generated', hs3_photo_t: photo ? t : 0,
      hs3_art_profile: {version: 1, facts: [{source: 'spot', text: "Rests at their person's feet."}]}, hs3_art_choices: {style: 'collage', tone: 'hilarious'},
      hs_brief_input: {breed: 'Border Collie', pronoun: 'he', home: 'toy', spot: 'couch', together: 'walk', toys: 'a tennis ball and a big stick', accessory: '', noToy: false},
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
  a.querySelector('[data-hs-art-result]').src = '/assets/hs-example-pug-warm-portrait.webp';
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
    // v11: the stated walk keeps the joke, and the named toys join the scene
    assert.match(brief['Tone direction'], /^One visual joke anyone gets at a glance: the dog leading the morning walk like the grand marshal of a parade\..*Also in the scene: the dog with his tennis ball and big stick\./);
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

for (const size of PHONES) test(`${size.width}x${size.height}: the painting on every gift, the bundle, one tick, one button, and the extras queued`, async () => {
  const {page, ctx, errors} = await open(size);
  try {
    await page.goto(base + GIFTS.print.url);
    await page.waitForSelector('[data-hs-jm]:not([hidden])');
    await paintDone(page);
    await page.waitForSelector('[data-hs-jm-choose]:not([hidden])', {timeout: 5000});
    const first = await page.evaluate(() => ({
      title: document.querySelector('[data-hs-jm-title]').textContent,
      tiles: [...document.querySelectorAll('.hs-jm-tile')].map(t => [t.getAttribute('data-hs-jm-gift'), t.querySelector('.hs-jm-tile__tag').textContent, t.getAttribute('aria-pressed')]),
      bundle: document.querySelector('[data-hs-jm-bundle]').textContent, tick: document.querySelector('[data-hs-jm-tick-text]').textContent,
      add: document.querySelector('[data-hs-jm-add]').disabled,
    }));
    assert.equal(first.title, 'Mowgli on every gift');
    assert.deepEqual(first.tiles, [['print', 'Ready', 'true'], ['mug', 'Preview', 'false'], ['blanket', 'Preview', 'false']]);
    assert.match(first.bundle, /15%.*20%/);
    assert.equal(first.tick, 'Yes, this is Mowgli');
    assert.equal(first.add, true, 'no add before the tick');
    assert.ok(await fits(page), 'the gifts screen fits without scrolling');
    await page.screenshot({path: path.join(shots, size.width + '-gifts.png')});
    // the painted gift cannot be dropped; a tap picks an extra and the total follows
    await page.dispatchEvent('[data-hs-jm-gift=print]', 'click'); // aria-disabled: a real tap is refused too
    await page.click('[data-hs-jm-gift=blanket]');
    const picked = await page.evaluate(() => ({on: [...document.querySelectorAll('.hs-jm-tile.is-on')].map(t => t.getAttribute('data-hs-jm-gift')), btn: document.querySelector('[data-hs-jm-add]').textContent, bundle: document.querySelector('[data-hs-jm-bundle]').textContent}));
    assert.deepEqual(picked.on, ['print', 'blanket']);
    assert.match(picked.btn, /^Add 2 gifts · \$\d+/);
    assert.match(picked.bundle, /^Two gifts: 15% off/);
    // the option pills drive Teeinblue's own radios
    const pill = page.locator('.hs-jm-pill:not(.is-on)').first();
    if (await pill.count()) {
      const label = (await pill.textContent()).trim();
      await pill.click(); await page.waitForTimeout(300);
      assert.equal(await page.evaluate(l => [...document.querySelectorAll('#buy .tee-option input[type=radio]:checked')].some(r => { const lab = r.id && document.querySelector(`label[for="${r.id}"]`); return (lab ? lab.textContent : r.value).trim() === l; }), label), true, 'the pill picked the radio');
    }
    // the tick is hs2's own approval box; the add clicks Teeinblue's own button
    // hs2's own refusal while a painting is still saving is covered by its tests; the stand-in painting
    // here is never really saved, so the box is a plain one that hs2's own checks cannot clear
    await page.evaluate(() => {
      const a = document.querySelector('[data-hs2-artwork-accept]'), b = a.cloneNode();
      let on = false;
      Object.defineProperty(b, 'checked', {get: () => on, set: v => { if (v) on = true; }});
      a.replaceWith(b);
    });
    await page.check('[data-hs-jm-tick]');
    assert.equal(await page.evaluate(() => document.querySelector('[data-hs2-artwork-accept]').checked), true);
    assert.equal(await page.isDisabled('[data-hs-jm-add]'), false);
    // Teeinblue's own add button, which hs2's add guard runs (add-guard.browser.test.mjs covers that)
    await page.evaluate(() => { window.__atc = 0; document.querySelector('#buy #teeAtcButton').click = () => { window.__atc++; }; });
    cart = [];
    await page.click('[data-hs-jm-add]');
    await page.waitForFunction(() => window.__atc === 1);
    const q = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-queue') || '[]'));
    assert.deepEqual(q.map(x => x.url), ['/products/your-dogs-portrait?journey=1', '/products/your-dogs-personality-blanket?journey=1'], 'the extra is queued, in journey mode');
    // once the gift is in the cart, the blanket's page is next
    cart = [{handle: 'your-dogs-portrait'}];
    await page.waitForURL(/your-dogs-personality-blanket\?journey=1/, {timeout: 8000});
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
