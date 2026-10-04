// Serve tools/preview/out and screenshot it at phone and desktop widths, then
// exercise the name preview (type, pick a face, turn it over, share-as-image).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, 'out');
const shots = path.join(here, 'out', 'shots');
fs.mkdirSync(shots, { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(4173);

const exe = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_PATH].find((p) => p && fs.existsSync(p) && fs.statSync(p).isFile());
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const errors = [];
async function page(width, height, name) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, acceptDownloads: true });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  pg.on('console', (m) => { if (m.type() === 'error') errors.push(`${name} console: ${m.text()}`); });
  pg.on('response', (r) => { if (r.status() >= 400) errors.push(`${name} ${r.status()}: ${r.url()}`); });
  await pg.goto('http://localhost:4173/');
  await pg.evaluate(() => document.fonts.ready);
  // scroll the page once so lazy images load and reveals fire, then back to the top
  await pg.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await pg.evaluate(() => Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  await pg.evaluate(() => document.querySelectorAll('[data-hs-reveal]').forEach((e) => e.classList.add('is-in')));
  await pg.waitForTimeout(900);
  console.log(`${name} sticky bar at top of page (should be false):`, await pg.locator('[data-hs-sticky]').evaluate((e) => e.classList.contains('is-on')));
  await pg.screenshot({ path: path.join(shots, `${name}-full.png`), fullPage: true });
  await pg.screenshot({ path: path.join(shots, `${name}-fold.png`) });
  return { ctx, pg };
}

const mobile = await page(390, 844, 'phone');
const desktop = await page(1440, 900, 'desktop');

// Interaction: type a name, pick the pug, screenshot; turn it over, screenshot
for (const [label, { pg }] of [['phone', mobile], ['desktop', desktop]]) {
  const maker = pg.locator('[data-hs-maker]');
  await maker.scrollIntoViewIfNeeded();
  await pg.fill('[data-hs-name-in]', 'Gerald');
  await pg.locator('.hs-chip', { hasText: 'Pug' }).click();
  await pg.waitForTimeout(500);
  await maker.screenshot({ path: path.join(shots, `${label}-maker-gerald.png`) });
  await pg.click('[data-hs-flip]');
  await pg.waitForTimeout(1100);
  await pg.locator('.hs-maker__stage').screenshot({ path: path.join(shots, `${label}-maker-flipped.png`) });
  await pg.click('[data-hs-flip]');
  await pg.fill('[data-hs-name-in]', 'Sir Waffleton');
  await pg.waitForTimeout(300);
  await pg.locator('.hs-orn').screenshot({ path: path.join(shots, `${label}-maker-longname.png`) });
  const cta = await pg.locator('[data-hs-cta]').evaluate((a) => [a.textContent.trim(), a.getAttribute('href')]);
  console.log(`${label} CTA:`, cta);
}

// Share-as-image: desktop Chromium has no file sharing, so it should download a PNG
const [download] = await Promise.all([
  desktop.pg.waitForEvent('download', { timeout: 8000 }).catch(() => null),
  desktop.pg.click('[data-hs-share]'),
]);
if (download) { await download.saveAs(path.join(shots, 'shared-image.png')); console.log('share: downloaded', await download.suggestedFilename()); }
else console.log('share: no download fired');

// Sticky bar on phone: scroll past the hero and the maker
await mobile.pg.evaluate(() => window.scrollTo(0, document.querySelector('#shopify-section-steps').offsetTop));
await mobile.pg.waitForTimeout(700);
console.log('sticky bar on after scroll:', await mobile.pg.locator('[data-hs-sticky]').evaluate((e) => e.classList.contains('is-on')));
await mobile.pg.screenshot({ path: path.join(shots, 'phone-sticky.png') });

// Overflow check: nothing wider than the viewport
for (const [label, { pg }] of [['phone', mobile], ['desktop', desktop]]) {
  const over = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(`${label} horizontal overflow: ${over}px`);
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
await browser.close();
server.close();
