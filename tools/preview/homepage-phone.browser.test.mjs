// The phone homepage (Krish, 3 Nov 2026): two screens at most, the button pinned to the bottom in the
// logo heart's pink and pulsing, the six sets filling 70 to 80% of the first screen, one Christmas offer
// (the strip) and never a second, every strip card the same height, no line that leaves one word on its
// own; on desktop the photo-to-gift slider sits beside the carousel.
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
      const body = (await res.text()).replace('data-hs2-memo', 'data-hs2-memo data-hs-bundle-live').replace('data-deadline=""', 'data-deadline="2026-12-10"')
        .replace(/(class="hs2-memo__deal">Free US shipping)/, '$1<span aria-hidden="true"> · </span>15% off 2 gifts, 20% off 3');
      await r.fulfill({response: res, body});
    });
  }
  await page.route((url) => !url.href.startsWith(base) && !/^(data|blob):/.test(url.href), (r) => r.abort());
  await page.goto(base + '/', {waitUntil: 'load'});
  await page.waitForTimeout(400);
  return {ctx, page, errors};
}

// 320x568 is the smallest phone the journey supports; it may run a little longer
const PHONES = [[320, 568, 2.6], [360, 640, 2.4], [390, 664, 2.4], [360, 740, 2.2], [390, 844, 2.1]];

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
    // the carousel is the first screen: full width, 68% of its height or more, starting under the header
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(80);
    const hero = await page.locator('.hsj-hook .hss--hero .hss-row--sets').boundingBox();
    // 68% or more where the dock leaves room; on a short screen it fills everything between the header and the dock
    assert.ok(hero.height >= Math.min(0.68 * height, height - 240), `the carousel is ${Math.round(hero.height / height * 100)}% of the screen`);
    assert.equal(Math.round(hero.width), width, 'the carousel runs edge to edge');
    assert.ok(hero.y < height * 0.25, 'the carousel starts in the top quarter');
    const words = await page.locator('.hsj-hook__words .hsj-h1').boundingBox();
    assert.ok(words.y >= hero.y && words.y + words.height <= hero.y + hero.height, 'the headline sits on the picture');
    // the pinned button never covers the headline, the dog's name, the ticks or the pause (3 Nov: it did on 360 x 640)
    for (const sel of ['.hsj-hook__words .hsj-h1', '.hsj-hook .hss--hero li:first-child figcaption', '.hsj-hook .hss--hero .hss-ctl']) {
      const b = await page.locator(sel).first().boundingBox();
      assert.ok(b && b.y + b.height <= dock.y + 2, `${sel} ends above the pinned button (${Math.round(b.y + b.height)} vs ${Math.round(dock.y)})`);
    }
    const price = await page.locator('.hsj-dock--pin .hsj-price').boundingBox();
    assert.ok(price && price.y >= dock.y && price.y + price.height <= height, 'the prices ride with the pinned button');
    // no text is cut short by its box (Krish, 3 Nov: "Ensure text is never truncated.")
    const clipped = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((el) => {
      if (!el.offsetParent || el.getBoundingClientRect().width <= 2 || !el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.data.trim())) return false;
      const c = getComputedStyle(el);
      return c.overflow !== 'visible' && c.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 1;
    }).map((el) => el.className + ': ' + el.textContent.trim().slice(0, 40)));
    assert.deepEqual(clipped, []);
    // one offer: the strip; no second card, and the footer drops its own shipping line
    assert.equal(await page.locator('.hsj-offer').count(), 0);
    assert.equal(await page.locator('.hs-strip--offer').count(), 1);
    assert.equal(await page.locator('.hs-footer__line').isVisible(), false);
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

test('the strip is the one Christmas offer: countdown, free shipping, and the saving only when the store has it', async () => {
  const on = await open({width: 360, height: 780});
  assert.match(await on.page.locator('.hs-strip--offer .hs2-memo__top').innerText(), /^CHRISTMAS OFFER(?: · )?(\d+ DAYS LEFT|LAST DAY)$/);
  assert.match(await on.page.locator('.hs-strip--offer .hs2-memo__deal').innerText(), /^Free US shipping · 15% off 2 gifts, 20% off 3$/);
  assert.equal(await on.page.evaluate(() => window.innerWidth), 360, 'the deal line fits a 360 phone');
  await on.ctx.close();
  const off = await open({width: 320, height: 568, live: false});
  assert.equal(await off.page.locator('.hs-strip--offer .hs2-memo__deal').innerText(), 'Free US shipping', 'no saving until the discount exists');
  // with no date set, the countdown runs to Christmas morning, a longer line that must still fit
  assert.match(await off.page.locator('.hs-strip--offer .hs2-memo__top').innerText(), /CHRISTMAS MORNING/);
  assert.equal(await off.page.evaluate(() => window.innerWidth), 320, 'the longer countdown still fits a 320 phone');
  await off.ctx.close();
});

test('desktop: the photo-to-gift slider sits in the carousel\'s section, under the button', async () => {
  const ctx = await browser.newContext({viewport: {width: 1440, height: 900}});
  const page = await ctx.newPage();
  await page.route((url) => !url.href.startsWith(base) && !/^(data|blob):/.test(url.href), (r) => r.abort());
  await page.goto(base + '/', {waitUntil: 'load'});
  // measure once the slider and the reel have taken their running layout
  await page.waitForSelector('.hsj-hook .hss-flow.is-live');
  await page.waitForTimeout(400);
  const hero = await page.locator('.hsj-hook .hss--hero').boundingBox();
  const btn = await page.locator('.hsj-hook [data-hsj-go="name"]').boundingBox();
  const flow = await page.locator('.hsj-hook [data-hss-stage]').boundingBox();
  assert.ok(flow.x + flow.width < hero.x, 'the slider is left of the carousel');
  assert.ok(flow.y > btn.y + btn.height, 'the slider is under the button');
  assert.ok(flow.y + flow.height <= hero.y + hero.height + 120, 'no big gap: the slider ends near the carousel');
  await page.click('[data-hss-step="2"]');
  assert.equal(await page.locator('[data-hss-range]').inputValue(), '2');
  await ctx.close();
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
      const sel = '.hsj-h1, .hs-strip--offer p, .hsj-price, .hss-h3, .hs-footer__company, .hss--hero figcaption';
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
