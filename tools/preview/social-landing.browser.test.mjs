// The social landing (sections/hs-social.liquid, templates/product.social.json, assets/hs-attribution.js), on
// phones, from the rendered theme: the hook from ?hook=, the real product and its price, the promise, one button
// into the journey at the photo with the gift ticked, every utm_* carried on, and the utm_* written to the cart's
// attributes once. No review, rating or Example badge. Screens go to out/social-landing/.
//   cd tools/preview && node render.mjs && cd ../.. && node --test tools/preview/social-landing.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out'), shots = path.join(out, 'social-landing');
fs.mkdirSync(shots, {recursive: true});
const PAGES = {mug: 'product-mug-social.html', print: 'product-portrait-social.html', blanket: 'product-blanket-social.html'};
const HANDLE = {mug: 'your-dogs-illustrated-mug', print: 'your-dogs-portrait', blanket: 'your-dogs-personality-blanket'};

let server, base, browser, updates = [];
before(async () => {
  if (!fs.existsSync(path.join(out, PAGES.mug))) execFileSync(process.execPath, ['render.mjs'], {cwd: here, stdio: 'ignore'});
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/cart/update.js') {
      let body = ''; req.on('data', (c) => { body += c; });
      req.on('end', () => { updates.push(JSON.parse(body || '{}')); res.writeHead(200, {'Content-Type': 'application/json'}); res.end('{}'); });
      return;
    }
    let f = path.join(out, decodeURIComponent(u.pathname));
    if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.svg') ? 'image/svg+xml' : f.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
    res.writeHead(200, {'Content-Type': type});
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => { await browser.close(); server.close(); });

async function open(file, query = '', {width = 375, height = 667} = {}) {
  const ctx = await browser.newContext({viewport: {width, height}, hasTouch: true, isMobile: true});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route((url) => !url.href.startsWith(base) && !/^(data|blob):/.test(url.href), (r) => r.abort());
  await page.goto(`${base}/${file}${query}`);
  await page.evaluate(() => document.fonts.ready);
  return {ctx, page, errors};
}
const UTM = '?utm_source=instagram&utm_medium=social&utm_campaign=sprint-16nov&utm_content=reel-04&hook=roast';

for (const gift of ['mug', 'print', 'blanket']) test(`${gift}: the hook, the real product and price, one button into the photo with the gift ticked, utm_* carried`, async () => {
  updates = [];
  const {ctx, page, errors} = await open(PAGES[gift], UTM);
  try {
    const v = await page.evaluate(() => {
      const t = (s) => (document.querySelector(s) || {}).textContent || '';
      const btn = document.querySelector('[data-hsl-go]');
      return {h1: t('[data-hsl-h1]').replace(/\s+/g, ' ').trim(), line: t('[data-hsl-line]'), lead: t('.hsl__lead'), name: t('.hsl__name'), price: t('.hsl__price'),
        href: btn.getAttribute('href'), pic: !!document.querySelector('.hsl__pic img'), text: document.querySelector('[data-hsl]').innerText,
        carry: [...document.querySelectorAll('.hsl__also a')].map((a) => a.getAttribute('href'))};
    });
    assert.equal(v.h1, 'Your dog has reviewed your performance.', '?hook=roast picks the roast headline');
    assert.match(v.line, /^Pick Roast/);
    assert.equal(v.lead, 'See your dog painted, free, before you buy.');
    assert.ok(v.pic, 'the product photo from Shopify');
    assert.match(v.price, gift === 'print' ? /^\$59 unframed, \$119 framed$/ : gift === 'mug' ? /^\$45$/ : /^\$129$/);
    const href = new URL(v.href, base);
    assert.equal(href.searchParams.get('gift'), gift === 'print' ? 'portrait' : gift, 'the gift is ticked on arrival');
    assert.equal(href.searchParams.get('step'), 'photo', 'straight to the photo, past the homepage hook');
    for (const [k, val] of [['utm_source', 'instagram'], ['utm_medium', 'social'], ['utm_campaign', 'sprint-16nov'], ['utm_content', 'reel-04'], ['hook', 'roast']]) assert.equal(href.searchParams.get(k), val, k + ' carried on');
    assert.equal(v.carry.length, 2, 'the other two gifts');
    assert.ok(v.carry.every((h) => /view=social/.test(h) && /utm_source=instagram/.test(h) && /hook=roast/.test(h)), 'their links keep the view, the hook and the utm_*');
    // nothing a buyer could read as a review, a rating, a count or an Example badge; and the house rules
    assert.doesNotMatch(v.text, /\bExample\b|★|review(s|ed)? by|\d+ (happy )?customers|rating/i);
    assert.doesNotMatch(v.text, /!|—|your dog has notes/i);
    assert.match(v.text, /Free US shipping/);
    assert.match(v.text, /Order by December 4 for Christmas delivery to a US address\./);
    // the button is pinned at the bottom of the first screen
    const box = await page.locator('[data-hsl-go]').boundingBox();
    assert.ok(box && box.y + box.height <= 667 + 0.5 && box.y + box.height >= 667 - 48, 'the button sits at the bottom of the screen');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 375, 'nothing pushes the page wider than the phone');
    // the utm_* reach the cart once, with the page and the hook
    await page.waitForFunction(() => sessionStorage.getItem('hs-attribution'), null, {timeout: 5000});
    assert.equal(updates.length, 1);
    const a = updates[0].attributes;
    assert.deepEqual({s: a.utm_source, m: a.utm_medium, c: a.utm_campaign, ct: a.utm_content, t: a.utm_term}, {s: 'instagram', m: 'social', c: 'sprint-16nov', ct: 'reel-04', t: ''}, 'a key the visit lacks is cleared');
    assert.equal(a.hs_landing, `/${PAGES[gift]}?hook=roast`);
    assert.match(a.hs_landed, /^\d{4}-\d{2}-\d{2}$/);
    await page.reload();
    await page.waitForTimeout(400);
    assert.equal(updates.length, 1, 'a reload does not write again');
    await page.screenshot({path: path.join(shots, `${gift}-375x667-roast.png`)});
    await page.screenshot({path: path.join(shots, `${gift}-375x667-roast-full.png`), fullPage: true});
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('no hook, or an unknown one: the first block, the lead line; no utm_*, no cart write', async () => {
  updates = [];
  for (const q of ['', '?hook=nope']) {
    const {ctx, page, errors} = await open(PAGES.mug, q, {width: 375, height: 812});
    try {
      assert.equal((await page.locator('[data-hsl-h1]').textContent()).replace(/\s+/g, ' ').trim(), 'Your dog loves you too.');
      const href = new URL(await page.locator('[data-hsl-go]').getAttribute('href'), base);
      assert.equal(href.searchParams.get('utm_source'), null);
      if (!q) await page.screenshot({path: path.join(shots, 'mug-375x812-default.png')});
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  }
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(updates.length, 0, 'an untagged visit leaves the cart alone');
});

test('the christmas hook, and the bundle line only while the memo strip says the discount exists', async () => {
  const {ctx, page} = await open(PAGES.blanket, '?hook=christmas');
  try {
    assert.equal((await page.locator('[data-hsl-h1]').textContent()).replace(/\s+/g, ' ').trim(), "This year, the dog's buying.");
    const live = await page.evaluate(() => !!document.querySelector('[data-hs-bundle-live]'));
    assert.equal(await page.locator('[data-hsl-bundle]').isVisible(), live);
    await page.screenshot({path: path.join(shots, 'blanket-375x667-christmas.png')});
  } finally { await ctx.close(); }
});

// the button's address, followed: the journey opens at the photo, the gift is already ticked on the gifts screen
// (no tap), Start painting is ready, and the homepage writes the same utm_* to the cart (hs-journey.liquid)
test('the button lands on the photo, and the gifts screen has the gift ticked with nothing to tap', async () => {
  updates = [];
  const {ctx, page, errors} = await open(PAGES.blanket, '?utm_source=tiktok&utm_medium=social&utm_campaign=sprint-16nov&hook=file', {width: 375, height: 812});
  try {
    await page.locator('[data-hsl-go]').click();
    await page.waitForURL(/step=photo/);
    await page.waitForSelector('[data-hsj-screen="photo"]');
    assert.match(page.url(), /gift=blanket/);
    assert.match(page.url(), /utm_source=tiktok/);
    await page.evaluate(() => { window.HSPhotoQuality = {check: () => Promise.resolve({verdict: 'ok', reasons: []})}; });
    await page.locator('[data-hsj-file]').setInputFiles(path.join(here, '../../assets/photos/pug-autumn-leaves.jpg'));
    await page.waitForURL(/step=look/);
    await page.locator('[data-hsj-next]').click();
    await page.waitForURL(/step=tone/);
    await page.locator('[data-hsj-next]').click();
    await page.waitForURL(/step=spot/);
    await page.locator('[data-hsj-pick="spot"][data-v="couch"]').click();
    await page.waitForURL(/step=gifts/);
    assert.equal(await page.locator('[data-hsj-gift="blanket"]').getAttribute('aria-pressed'), 'true', 'the gift from the landing is ticked');
    assert.equal(await page.locator('[data-hsj-start]').isDisabled(), false, 'Start painting is one tap away');
    await page.waitForTimeout(400);
    assert.equal(updates.length, 1, 'the same campaign is written once, from the landing');
    assert.match(updates[0].attributes.hs_landing, /social\.html\?hook=file$/, 'so the order keeps the page and hook the post opened');
    // the gift page keeps the campaign in its address (16 Nov live walk: it was dropped here)
    const queue = await page.evaluate(() => { const st = JSON.parse(sessionStorage.getItem('hs2-review') || '{}'); return st.hs_journey && st.hs_journey.queue; });
    if (queue) assert.ok(queue.every((x) => /utm_source=tiktok/.test(x.url) && /utm_campaign=sprint-16nov/.test(x.url)), 'gift page addresses carry the utm_*');
    await page.locator('[data-hsj-start]').click();
    await page.waitForURL(/\/products\/your-dogs-personality-blanket\?/, {timeout: 10000}).catch(() => {});
    const url = page.url();
    if (/\/products\//.test(url)) { assert.match(url, /utm_source=tiktok/); assert.match(url, /utm_campaign=sprint-16nov/); assert.match(url, /journey=1/); }
    else assert.fail('Start painting did not open the gift page: ' + url);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('every product handle the landing links to is a real gift', () => {
  const html = fs.readFileSync(path.join(out, PAGES.mug), 'utf8');
  for (const h of [HANDLE.print, HANDLE.blanket]) assert.match(html, new RegExp(`/products/${h}\\?view=social`));
});
