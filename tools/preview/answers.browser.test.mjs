// The Answers pages (Krish, 3 Nov 2026: "Make this a delightful user experience, and not just an infinite scroll
// sprawling everywhere"). An article is an answer card: the question, the whole short answer and the pinned
// button on the first screen, the details as chapters opened one at a time with every word in the page. The
// library is a question picker, Christmas first.
//   cd tools/preview && node render.mjs && cd ../.. && node --test tools/preview/answers.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out');
const ARTICLE = 'answers-last-day-to-order-a-personalized-dog-gift-for-christmas.html';
let server, base, browser;
before(async () => {
  if (!fs.existsSync(path.join(out, ARTICLE))) execFileSync(process.execPath, ['render.mjs'], {cwd: here, stdio: 'ignore'});
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let f = path.join(out, decodeURIComponent(u.pathname));
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

async function open(file, {width = 360, height = 740, js = true} = {}) {
  const phone = width < 720;
  const ctx = await browser.newContext({viewport: {width, height}, hasTouch: phone, isMobile: phone, javaScriptEnabled: js});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route((url) => !url.href.startsWith(base) && !/^(data|blob):/.test(url.href), (r) => r.abort());
  await page.goto(`${base}/${file}`, {waitUntil: 'load'});
  await page.waitForTimeout(300);
  return {ctx, page, errors};
}

for (const [width, height] of [[320, 568], [360, 640], [360, 740], [390, 844]]) {
  test(`${width}x${height}: the whole short answer and the pinned button on the first screen, the page short`, async () => {
    const {ctx, page, errors} = await open(ARTICLE, {width, height});
    const dock = await page.locator('.hs-answer__dock').boundingBox();
    const short = await page.locator('.hs-answer__short').boundingBox();
    assert.ok(short.y + short.height <= dock.y + 2, `the short answer ends at ${Math.round(short.y + short.height)}, the button starts at ${Math.round(dock.y)}`);
    // on the smallest phones the button sits in the page under the answer; everywhere else it is pinned on screen
    if (height > 600) assert.ok(dock.y + dock.height <= height + 1, 'the button is on screen');
    await page.evaluate(() => document.querySelectorAll('.hs-answer__ch').forEach((d) => { d.open = false; }));
    const screens = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight);
    assert.ok(screens <= (height < 700 ? 3.2 : 2.6), `closed, the article is ${screens.toFixed(2)} screens`);
    assert.equal(await page.evaluate(() => innerWidth), width, 'nothing pushes the page wider than the phone');
    const clipped = await page.evaluate(() => [...document.querySelectorAll('main *')].filter((el) => {
      if (!el.offsetParent || el.getBoundingClientRect().width <= 2 || ![...el.childNodes].some((n) => n.nodeType === 3 && n.data.trim())) return false;
      const c = getComputedStyle(el);
      return c.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 1;
    }).map((el) => el.className));
    assert.deepEqual(clipped, []);
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('the details are chapters: every word in the page, one open at a time', async () => {
  const html = fs.readFileSync(path.join(out, ARTICLE), 'utf8');
  const drafts = JSON.parse(fs.readFileSync(path.join(here, 'fixtures', 'answers-drafts-2026-11-03.json'), 'utf8'));
  const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const body = text(drafts[0].body).replace(/^.*?(?=Order by December 4 for Christmas delivery to a US address\. The strip)/, '');
  assert.ok(text(html).includes(body.slice(0, 200)), 'the chapters are in the server HTML');
  const {ctx, page} = await open(ARTICLE);
  const chapters = page.locator('.hs-answer__ch');
  assert.ok(await chapters.count() >= 3);
  assert.equal(await page.locator('.hs-answer__ch[open]').count(), 1, 'the first chapter opens with the page');
  await chapters.nth(2).locator('summary').click();
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.hs-answer__ch[open]').count(), 1, 'opening another closes the first');
  assert.equal(await chapters.nth(2).getAttribute('open'), '');
  await ctx.close();
});

test('the article keeps its structured data, and the FAQ answer is the short answer', async () => {
  const html = fs.readFileSync(path.join(out, ARTICLE), 'utf8');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const graph = blocks.flatMap((b) => b['@graph'] || [b]);
  const faq = graph.find((n) => n['@type'] === 'FAQPage');
  assert.ok(faq, 'FAQPage is present');
  assert.match(faq.mainEntity[0].acceptedAnswer.text, /^Order by December 4 for Christmas delivery to a US address\./);
});

test('the library: Christmas first, every question on "All", every card there without JavaScript', async () => {
  const {ctx, page} = await open('answers.html');
  assert.equal(await page.locator('[data-hs-lib-chip="christmas"]').getAttribute('aria-pressed'), 'true');
  const shown = () => page.$$eval('.hs-lib__item', (ls) => ls.filter((l) => !l.hidden).map((l) => l.getAttribute('data-tags')));
  const xmas = await shown();
  assert.ok(xmas.length >= 4 && xmas.every((t) => t.split(' ').includes('christmas')), 'Christmas shows only its questions');
  await page.click('[data-hs-lib-chip="all"]');
  assert.equal((await shown()).length, 6);
  await ctx.close();
  const plain = await open('answers.html', {js: false});
  assert.equal(await plain.page.locator('.hs-lib__item:visible').count(), 6, 'no JavaScript: every question shows');
  assert.equal(await plain.page.locator('[data-hs-lib-chips]').isVisible(), false, 'and the chips that need it stay out of the way');
  await plain.ctx.close();
});
