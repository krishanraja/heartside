// The phone homepage (Krish, 3 Nov 2026): two screens at most, the button pinned to the bottom in the
// logo heart's pink and pulsing, the Christmas offer as a visual offer, the six sets as the hero, every
// strip card the same height, and no line that leaves one word on its own.
//   cd tools/preview && node render.mjs && cd ../.. && node --test tools/preview/homepage-phone.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out'), shots = path.join(out, 'homepage-phone');
fs.mkdirSync(shots, {recursive: true});
let server, base, browser;
before(async () => {
  if (!fs.existsSync(path.join(out, 'index.html'))) execFileSync(process.execPath, ['render.mjs'], {cwd: here, stdio: 'ignore'});
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let f = u.pathname === '/' ? path.join(out, 'index.html') : path.join(out, decodeURIComponent(u.pathname));
    if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream';
    res.writeHead(200, {'Content-Type': type}); fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => { await browser.close(); server.close(); });

// live settles the memo strip the way the store has it: the last order date set and the bundle switch on
async function open({width, height, motion = 'no-preference', live = true}) {
  const ctx = await browser.newContext({viewport: {width, height}, hasTouch: true, isMobile: true, reducedMotion: motion});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  if (live) {
    await page.route(base + '/', async (r) => {
      const res = await r.fetch();
      const body = (await res.text()).replace('data-hs2-memo', 'data-hs2-memo data-hs-bundle-live').replace('data-deadline=""', 'data-deadline="2026-12-10"');
      await r.fulfill({response: res, body});
    });
  }
  await page.route((url) => !url.href.startsWith(base) && !/^(data|blob):/.test(url.href), (r) => r.abort());
  await page.goto(base + '/', {waitUntil: 'load'});
  await page.waitForTimeout(400);
  return {ctx, page, errors};
}

// 320x568 is the smallest phone the journey supports; it may run a little longer
const PHONES = [[320, 568, 2.45], [360, 640, 2.2], [360, 780, 2.0], [390, 844, 2.0]];

for (const [width, height, most] of PHONES) {
  test(`${width}x${height}: two screens at most, the button pinned in pink the whole way down`, async () => {
    const {ctx, page, errors} = await open({width, height});
    assert.equal(await page.evaluate(() => window.innerWidth), width, 'nothing pushes the page wider than the phone');
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    assert.ok(total <= most * height, `the page is ${(total / height).toFixed(2)} screens, at most ${most}`);
    const btn = page.locator('.hsj-hook [data-hsj-go="name"]');
    for (const y of [0, total / 2, total]) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await page.waitForTimeout(80);
      const box = await btn.boundingBox();
      assert.ok(box && box.y >= 0 && box.y + box.height <= height + 0.5, `the button is on screen at scroll ${Math.round(y)}`);
      assert.ok(box.y + box.height >= height - 48, `the button sits at the bottom at scroll ${Math.round(y)}`);
    }
    // the footer's last line clears the pinned button at the end of the page
    const foot = await page.locator('.hs-footer__company').boundingBox();
    const dock = await page.locator('.hsj-dock--pin').boundingBox();
    assert.ok(foot.y + foot.height <= dock.y + 24, 'the company line is not under the button');
    // the first screen holds the offer, the hero and the prices above the button
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(80);
    for (const sel of ['.hsj-offer', '.hsj-hook .hss--hero .hss-row--sets', '.hsj-price']) {
      const b = await page.locator(sel).boundingBox();
      assert.ok(b.y + b.height <= dock.y + 12, `${sel} is on the first screen, above the button`);
    }
    await page.screenshot({path: path.join(shots, `${width}x${height}.png`)});
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('the button: heart pink with an ink label that reads, pulsing, still for reduced motion, and it starts the journey', async () => {
  const {ctx, page} = await open({width: 360, height: 780});
  const css = await page.$eval('.hsj-hook [data-hsj-go="name"]', (a) => { const c = getComputedStyle(a); return {bg: c.backgroundColor, fg: c.color, anim: c.animationName, pos: getComputedStyle(a.parentElement).position}; });
  assert.equal(css.bg, 'rgb(231, 161, 191)', 'the logo heart pink');
  assert.equal(css.pos, 'fixed');
  assert.equal(css.anim, 'hs-heart-pulse');
  const lum = (rgb) => { const [r, g, b] = rgb.match(/\d+/g).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const [hi, lo] = [lum(css.bg), lum(css.fg)].sort((a, b) => b - a);
  assert.ok((hi + 0.05) / (lo + 0.05) >= 4.5, 'the label reads at 4.5:1 or better');
  await page.click('.hsj-hook [data-hsj-go="name"]');
  await page.waitForTimeout(200);
  assert.match(page.url(), /[?&]step=name/);
  assert.equal(await page.locator('.hsj-dock--pin').isVisible(), false, 'the pinned button goes with the first screen');
  await ctx.close();
  const still = await open({width: 360, height: 780, motion: 'reduce'});
  assert.equal(await still.page.$eval('.hsj-hook [data-hsj-go="name"]', (a) => getComputedStyle(a).animationName), 'none');
  await still.ctx.close();
});

test('the Christmas offer shows the countdown and the saving only when the store has them', async () => {
  const on = await open({width: 360, height: 780});
  assert.equal(await on.page.locator('.hsj-offer__badge').innerText(), 'CHRISTMAS OFFER');
  assert.match(await on.page.locator('.hsj-offer__count').innerText(), /^(\d+ days left|Last day)$/);
  assert.equal(await on.page.locator('[data-hsj-offer-bundle]').isVisible(), true);
  await on.ctx.close();
  const off = await open({width: 320, height: 568, live: false});
  assert.equal(await off.page.locator('[data-hsj-offer-bundle]').isVisible(), false, 'no saving until the discount exists');
  // with no date set, the countdown runs to Christmas morning, a longer line that must still fit
  assert.match(await off.page.locator('.hsj-offer__count').innerText(), /Christmas morning/);
  assert.equal(await off.page.evaluate(() => window.innerWidth), 320, 'the longer countdown still fits a 320 phone');
  await off.ctx.close();
});

test('every card in the strip is the same height', async () => {
  const {ctx, page} = await open({width: 360, height: 780});
  await page.locator('[data-hss-strip]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const hs = await page.$$eval('[data-hss-strip-track] > li', (ls) => ls.map((l) => l.getBoundingClientRect().height));
  assert.ok(hs.length >= 19);
  assert.ok(Math.max(...hs) - Math.min(...hs) <= 1, `strip card heights ${Math.min(...hs)} to ${Math.max(...hs)}`);
  await ctx.close();
});

test('no line on the phone homepage leaves one word on its own', async () => {
  for (const [width, height] of PHONES) {
    const {ctx, page} = await open({width, height});
    const lone = await page.evaluate(() => {
      const sel = '.hsj-eyebrow, .hsj-h1, .hsj-offer p, .hsj-price, .hss-h3, .hss-credit summary, .hs-footer__company, .hss--hero figcaption';
      const bad = [];
      for (const el of document.querySelectorAll(sel)) {
        if (!el.offsetParent) continue;
        const words = [];
        const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n; (n = walk.nextNode());) {
          const re = /\S+/g;
          for (let m; (m = re.exec(n.data));) {
            const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
            const rect = r.getClientRects()[0];
            if (rect && rect.width) words.push({w: m[0], top: Math.round(rect.top)});
          }
        }
        const lines = [...new Set(words.map((x) => x.top))];
        if (lines.length > 1 && words.filter((x) => x.top === lines[lines.length - 1]).length === 1) bad.push(el.className + ': ' + el.textContent.trim());
      }
      return bad;
    });
    assert.deepEqual(lone, [], `${width}x${height}`);
    await ctx.close();
  }
});
