// The homepage showcase in motion (Krish, 31 Oct: "it looks so intense to just have all the pictures
// visible at once"). The six sets show one at a time and fade on by themselves; styles, gifts and moods
// drift by in one row that a flick runs faster. Both pause on their button, and with reduced motion
// neither moves. Screens go to out/showcase/.
//   cd tools/preview && node render.mjs && cd ../.. && node --test tools/preview/showcase.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out'), shots = path.join(out, 'showcase');
fs.mkdirSync(shots, {recursive: true});
let server, base, browser;
before(async () => {
  if (!fs.existsSync(path.join(out, 'index.html'))) execFileSync(process.execPath, ['render.mjs'], {cwd: here, stdio: 'ignore'});
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let f = u.pathname === '/' ? path.join(out, 'index.html') : path.join(out, decodeURIComponent(u.pathname));
    if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : 'application/octet-stream';
    res.writeHead(200, {'Content-Type': type}); fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => { await browser.close(); server.close(); });

async function open({width = 390, height = 844, motion = 'no-preference'} = {}) {
  const phone = width < 720;
  const ctx = await browser.newContext({viewport: {width, height}, hasTouch: phone, isMobile: phone, reducedMotion: motion});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route((url) => !url.href.startsWith(base) && !/^(data|blob):/.test(url.href), (r) => r.abort());
  await page.goto(base + '/', {waitUntil: 'load'});
  return {ctx, page, errors};
}
const onSet = (page) => page.$$eval('[data-hss-reel-track] > li', (ls) => ls.map((l) => getComputedStyle(l).opacity === '1' && l.classList.contains('is-on')));
const stripX = (page) => page.$eval('[data-hss-strip-track]', (t) => new DOMMatrix(getComputedStyle(t).transform).m41);

for (const size of [{width: 390, height: 844}, {width: 1440, height: 900}]) {
  test(`one set at a time, fading on by itself, and a strip that drifts (${size.width} px)`, async () => {
    const {ctx, page, errors} = await open(size);
    await page.locator('[data-hss-reel]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    let on = await onSet(page);
    assert.equal(on.length, 6, 'six sets');
    assert.equal(on.filter(Boolean).length, 1, 'one set shows at a time');
    const first = on.indexOf(true);
    await page.screenshot({path: path.join(shots, `reel-${size.width}.png`)});
    await page.waitForTimeout(2600);
    on = await onSet(page);
    assert.notEqual(on.indexOf(true), first, 'the reel moves on by itself');

    // a swipe skips at once
    const box = await page.locator('[data-hss-reel-track]').boundingBox();
    const before = (await onSet(page)).indexOf(true);
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, {steps: 6});
    await page.mouse.up();
    await page.waitForTimeout(600);
    assert.notEqual((await onSet(page)).indexOf(true), before, 'a swipe skips');
    assert.equal(await page.locator('.hss-zoom').count(), 0, 'a swipe does not open the large view');

    // the strip drifts, and pauses on its button
    const strip = page.locator('[data-hss-strip]');
    await strip.scrollIntoViewIfNeeded();
    await page.mouse.move(2, 2); // the pointer off the strip, so hover does not pause it
    const x0 = await stripX(page);
    await page.waitForTimeout(1200);
    const x1 = await stripX(page);
    assert.ok(x1 < x0 - 10, `the strip drifts left (${x0} -> ${x1})`);
    await page.screenshot({path: path.join(shots, `strip-${size.width}.png`)});
    await strip.locator('[data-hss-pause]').click();
    await page.mouse.move(2, 2);
    const p0 = await stripX(page);
    await page.waitForTimeout(800);
    assert.ok(Math.abs((await stripX(page)) - p0) < 1, 'the pause button stops it');
    assert.equal(await strip.locator('[data-hss-pause]').getAttribute('aria-pressed'), 'true');

    // a hard flick throws it much further than the drift would
    const sb = await page.locator('[data-hss-strip-view]').boundingBox();
    const f0 = await stripX(page);
    await page.mouse.move(sb.x + sb.width * 0.8, sb.y + sb.height / 2);
    await page.mouse.down();
    await page.mouse.move(sb.x + sb.width * 0.3, sb.y + sb.height / 2, {steps: 4});
    await page.mouse.up();
    await page.waitForTimeout(700);
    assert.ok((await stripX(page)) < f0 - sb.width * 0.5 - 40, 'a flick keeps it going past the drag');

    // copies for the loop are hidden from the screen reader, and every original keeps its alt
    assert.equal(await page.locator('[data-hss-strip-track] > li:not([data-hss-copy])').count(), 19);
    assert.equal(await page.locator('[data-hss-copy]:not([aria-hidden="true"])').count(), 0);
    const alts = await page.$$eval('[data-hss-strip-track] > li:not([data-hss-copy]) img', (is) => is.map((i) => i.alt));
    assert.ok(alts.every((a) => a.startsWith('Example')));
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('with reduced motion nothing moves and every picture stays in a swipe row', async () => {
  const {ctx, page, errors} = await open({motion: 'reduce'});
  assert.equal(await page.locator('[data-hss-reel].is-live').count(), 0);
  assert.equal(await page.locator('[data-hss-strip].is-live').count(), 0);
  assert.equal(await page.locator('[data-hss-copy]').count(), 0);
  assert.equal(await page.locator('[data-hss-reel-ctl]').isHidden(), true);
  const x0 = await stripX(page);
  await page.waitForTimeout(800);
  assert.equal(await stripX(page), x0);
  assert.deepEqual(errors, []);
  await ctx.close();
});
