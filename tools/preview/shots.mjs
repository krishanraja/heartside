// Serve tools/preview/out, screenshot every page at phone and desktop widths, and
// exercise the v2 behaviour: the live dog name, the HR-26 chips, the read-aloud
// toggle, the link that carries answers to the product page, the story card and
// the sticky button.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, 'out');
const shots = path.join(root, 'shots');
fs.mkdirSync(shots, { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(4173);

const exe = ['/opt/pw-browsers/chromium'].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const errors = [];
const log = (...a) => console.log(...a);

async function open(width, height, name, url = 'http://localhost:4173/') {
  const ctx = await browser.newContext({ viewport: { width, height }, acceptDownloads: true });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  pg.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`${name} ${r.status()}: ${r.url()}`); });
  await pg.goto(url);
  await pg.evaluate(() => document.fonts.ready);
  return { ctx, pg };
}
async function fullShot(pg, file) {
  await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
  await pg.evaluate(() => Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  await pg.waitForTimeout(600);
  await pg.screenshot({ path: path.join(shots, file), fullPage: true });
}

// 1. Homepage, as first seen
for (const [w, h, name] of [[390, 844, 'phone'], [1440, 900, 'desktop']]) {
  const { pg } = await open(w, h, name);
  await pg.screenshot({ path: path.join(shots, `${name}-home-first-screen.png`) });
  await fullShot(pg, `${name}-home-full.png`);
  const over = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  log(`${name} horizontal overflow: ${over}px`);
}

// 2. Interactions on desktop
const { pg } = await open(1440, 900, 'interact');
await pg.fill('[data-hs2-input="dog"]', 'Gerald');
const h1 = await pg.locator('h1').innerText();
const badge = await pg.locator('.hs2-badge__name').innerText();
const stamp = await pg.locator('.hs2-hero .hs2-stamp').innerText();
log('after typing Gerald -> h1:', JSON.stringify(h1), '| badge:', badge, '| stamp:', stamp);
await pg.locator('#review').scrollIntoViewIfNeeded();
await pg.fill('[data-hs2-input="person"]', 'Priya');
await pg.fill('[data-hs2-input="cupboard"]', '2,019');
await pg.click('[data-hs2-chip="improvement"][data-value="The vacuum"]');
await pg.click('[data-hs2-chip="incident"][data-value="The couch"]');
await pg.click('[data-hs2-chip="enemy"][data-value="Squirrels"]');
await pg.click('[data-hs2-voice]');
await pg.waitForTimeout(200);
log('poster improvement:', await pg.locator('.hs2-poster [data-hs2="improvementLine"]').innerText());
log('poster incident:', await pg.locator('.hs2-poster [data-hs2="incidentLine"]').innerText());
log('poster enemy:', await pg.locator('.hs2-poster [data-hs2="enemyLine"]').innerText());
log('voice button:', await pg.locator('[data-hs2-voice]').innerText());
log('memo to:', (await pg.locator('.hs2-management__memo').innerText()).split('\n')[0]);
await pg.locator('#review').screenshot({ path: path.join(shots, 'desktop-review-gerald.png') });
await pg.locator('.hs2-management').screenshot({ path: path.join(shots, 'desktop-management-gerald.png') });
const [download] = await Promise.all([
  pg.waitForEvent('download', { timeout: 8000 }).catch(() => null),
  pg.click('[data-hs2-story]'),
]);
if (download) { await download.saveAs(path.join(shots, 'story-card.png')); log('story card:', await download.suggestedFilename()); } else log('story card: no download');
await pg.evaluate(() => window.scrollTo(0, document.querySelector('#review').offsetTop + 200));
await pg.waitForTimeout(700);
log('sticky on while the builder is on screen (should be false):', await pg.locator('[data-hs2-sticky]').evaluate((e) => e.classList.contains('is-on')));
await pg.evaluate(() => window.scrollTo(0, document.querySelector('#benefits').offsetTop));
await pg.waitForTimeout(700);
log('sticky on at benefits (should be true):', await pg.locator('[data-hs2-sticky]').evaluate((e) => e.classList.contains('is-on')), '|', await pg.locator('[data-hs2-sticky] a').innerText());

// 3. The approve link carries the answers to the poster product page
await pg.evaluate(() => { const a = document.querySelector('[data-hs2-carry]'); a.setAttribute('data-hs2-base', 'product-review.html'); a.setAttribute('href', 'product-review.html'); });
await pg.fill('[data-hs2-input="dog"]', 'Gerald'); // re-render links
const href = await pg.locator('.hs2-buy [data-hs2-carry]').getAttribute('href');
log('approve link:', href);
await pg.goto('http://localhost:4173/' + href);
await pg.evaluate(() => document.fonts.ready);
await pg.waitForTimeout(300);
log('product page answers visible:', await pg.locator('[data-hs2-answers]').isVisible(), '| poster dog:', await pg.locator('.hs2-poster .hs2-paw [data-hs2="dog"]').innerText());
log('hidden properties:', JSON.stringify(await pg.evaluate(() => [...document.querySelectorAll('[data-hs2-prop]')].map((i) => [i.name, i.value]))));
await fullShot(pg, 'desktop-product-review.png');

// 4. Pillow product page on phone (no images yet: placeholder tag)
const pillow = await open(390, 844, 'pillow', 'http://localhost:4173/product-pillow.html');
await fullShot(pillow.pg, 'phone-product-pillow.png');
await pillow.pg.selectOption('[data-hs2-variant]', '11');
log('pillow price after picking 10″:', await pillow.pg.locator('[data-hs2-price]').innerText());

log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
await browser.close();
server.close();
