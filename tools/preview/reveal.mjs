// Screenshots of the four reveal tabs at phone size, with and without a photo, so every
// preview is checked on the real product photo before anyone sees it (Krish, 14 Oct).
// Run after render.mjs:   cd tools/preview && node reveal.mjs [photo]   (screens go to out/reveal/)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out');
const shots = path.join(out, 'reveal');
fs.mkdirSync(shots, { recursive: true });
const photo = process.argv[2] || path.join(here, '..', '..', 'shopify', 'assets', 'hs-photo-bed-1200.webp');
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) failures++; };

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let f = path.join(out, decodeURIComponent(u.pathname));
  if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', path.basename(u.pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  const type = f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : f.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

async function run(label, { withPhoto, dog = 'Biscotti', rec = 'Linda', width = 390, height = 844 }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route(/n8n\.cloud/, (r) => r.fulfill({ status: 503, body: '' }));
  await page.goto(`${base}/index-gifts.html`);
  await page.locator('[data-hs3-start]').first().click();
  await page.fill('#hs3-dog', dog);
  if (withPhoto) await page.setInputFiles('[data-hs3-file]', photo);
  await page.locator('[data-hs3="next"]').click();
  await page.fill('#hs3-rec', rec);
  await page.locator('[data-hs3="next"]').click();
  const chip = (t) => page.locator('[data-hs3="chip"]', { hasText: t }).first().click();
  await chip('Waits at the door'); await chip('Even weekends');
  await chip('side of the bed'); await chip('Naps'); await chip('best friend');
  await page.locator('[data-hs3="next"]').click();
  await page.evaluate(() => document.fonts.ready);
  for (const g of ['mug', 'blanket', 'print', 'ornament']) {
    await page.locator(`[data-hs3="tab"][data-v="${g}"]`).click();
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(shots, `${label}-${g}.png`) });
    if (g === 'mug') {
      const note = await page.locator('.hs3-mugface__line').allInnerTexts();
      ok(note[0] === 'Waits at the door for\nyou, weekends too.', `${label}: mug line 1 breaks evenly (${JSON.stringify(note[0])})`);
      ok(note[1] === 'Steals your side of the bed.', `${label}: "Steals your side of the bed." stays one row`);
      ok(note[2] === 'Your best friend,\nno contest.', `${label}: mug line 3 breaks evenly`);
      const sign = await page.locator('.hs3-mugface__sign').evaluate((el) => { const p = el.querySelector('svg').getBoundingClientRect(), t = el.querySelector('span').getBoundingClientRect(); return { pawLeft: p.right <= t.left + 1, font: getComputedStyle(el).fontFamily }; });
      ok(sign.pawLeft && /Fraunces/.test(sign.font), `${label}: paw left of "Love, ${dog}", in Fraunces`);
      const fit = await page.locator('.hs3-mugface__sign span').evaluate((el) => el.offsetWidth / el.closest('.hs3-mugface').offsetWidth);
      ok(fit <= 0.465, `${label}: the signature fits its print box (${(fit * 100).toFixed(1)}% of the photo, box 46.4%)`);
      const lineFont = await page.locator('.hs3-mugface__line').first().evaluate((el) => getComputedStyle(el).fontFamily);
      ok(/Fraunces/.test(lineFont) && !/Courier/.test(lineFont), `${label}: the note is in Fraunces`);
      const handed = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-review') || '{}').hs3_mug_lines || {});
      ok(handed.home === 'Waits at the door for\nyou, weekends too.' && handed.spot === 'Steals your side of the bed.', `${label}: the chat hands the broken lines to the product page`);
      await page.locator('[data-hs3="turn"]').click();
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(shots, `${label}-mug-turned.png`) });
      await page.locator('.hs3-mugs').screenshot({ path: path.join(shots, `${label}-mug-turned-closeup.png`) });
      ok(await page.locator('.hs3-mugs').getAttribute('data-side') === 'dog', `${label}: "Turn the mug" shows the dog's face`);
      if (withPhoto) ok(await page.locator('.hs3-mugface--dog img[data-hs3-photo]').count() === 1, `${label}: the buyer's photo is on the dog face`);
      else ok(await page.locator('.hs3-mugface__nodog').count() === 1, `${label}: no photo yet shows a paw, never a stranger's dog`);
      await page.locator('[data-hs3="turn"]').click();
      await page.waitForTimeout(150);
      await page.locator('.hs3-mugs').screenshot({ path: path.join(shots, `${label}-mug-closeup.png`) });
    } else {
      const under = await page.locator('.hs3-stage .hs3-sign').evaluate((el) => { const p = el.querySelector('svg').getBoundingClientRect(), r = el.getBoundingClientRect(); return p.top >= r.top + r.height / 2 - 2 && Math.abs((p.left + p.right) / 2 - (r.left + r.right) / 2) < 2; });
      ok(under, `${label}: ${g} paw centred under the signature`);
    }
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${label}: ${g} has no sideways scroll at ${width}px`);
  }
  ok(!errors.length, `${label}: no script errors ${errors.join(' ')}`);
  await ctx.close();
}
// with motion: the mug opens on the dog, turns to the note, then the lines ink one by one
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.route(/n8n\.cloud/, (r) => r.fulfill({ status: 503, body: '' }));
  await page.goto(`${base}/index-gifts.html`);
  await page.locator('[data-hs3-start]').first().click();
  await page.fill('#hs3-dog', 'Biscotti');
  await page.setInputFiles('[data-hs3-file]', photo);
  await page.locator('[data-hs3="next"]').click();
  await page.fill('#hs3-rec', 'Linda');
  await page.locator('[data-hs3="next"]').click();
  const chip = (t) => page.locator('[data-hs3="chip"]', { hasText: t }).first().click();
  await chip('Waits at the door'); await page.waitForTimeout(1500); await chip('Even weekends');
  await chip('side of the bed'); await chip('Coffee'); await chip('best friend');
  await page.locator('[data-hs3="next"]').click();
  await page.waitForTimeout(400);
  ok(await page.locator('.hs3-mugs').getAttribute('data-side') === 'dog', 'motion: the mug opens on the dog');
  await page.screenshot({ path: path.join(shots, 'motion-0-dog.png') });
  await page.waitForTimeout(1300);
  ok(await page.locator('.hs3-mugs').getAttribute('data-side') === 'note', 'motion: then turns to the note');
  await page.waitForTimeout(2600);
  ok(await page.locator('.hs3-mugface__line.hs3-ink').count() === 3, 'motion: all three lines ink');
  await page.screenshot({ path: path.join(shots, 'motion-1-note.png') });
  await ctx.close();
}
await run('photo', { withPhoto: true });
await run('nophoto', { withPhoto: false });
await run('long-name-360', { withPhoto: true, dog: 'Bartholomew Jr', width: 360, height: 740 });
await browser.close();
server.close();
console.log(failures ? `${failures} FAILED` : 'all passed');
process.exit(failures ? 1 : 0);
