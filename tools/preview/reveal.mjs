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
      const flat = (s) => s.replace(/\s*\n\s*/g, ' ');
      ok(flat(note[0]) === 'I wait by the door for you, weekends too.' && note[0].includes('\n'), `${label}: mug line 1 keeps the complete sentence and even break (${JSON.stringify(note[0])})`);
      ok(flat(note[1]) === 'I took your side of the bed to keep it warm.' && note[1].includes('\n'), `${label}: the bed line keeps the complete sentence and even break`);
      ok(flat(note[2]) === "You're my best friend, and I'm yours." && note[2].includes('\n'), `${label}: mug line 3 keeps the complete sentence and even break`);
      // the mug is drawn wrapped on the photo (layout and fonts: mockup-gate.mjs), never the flat fallback
      await page.waitForFunction(() => document.querySelectorAll('canvas[data-hs3-mug].is-drawn').length === 2, null, { timeout: 8000 }).catch(() => {});
      const drawn = await page.evaluate(() => {
        const m = document.querySelector('.hs3-mugs'), c = document.querySelector('canvas[data-hs3-mug="note"]');
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let ink = 0; for (let i = 0; i < d.length; i += 4) if ((d[i] + d[i + 1] + d[i + 2]) / 3 < 120) ink++;
        return { both: document.querySelectorAll('canvas[data-hs3-mug].is-drawn').length, flat: m.classList.contains('is-flat'), ink, label: c.getAttribute('aria-label') };
      });
      ok(drawn.both === 2 && !drawn.flat && drawn.ink > 2000, `${label}: both faces drawn wrapped on the mug photo (${drawn.ink} ink pixels on the note)`);
      ok(drawn.label.includes('Love, ' + dog) && drawn.label.includes(flat(note[1])), `${label}: the drawn note is labelled for screen readers`);
      const said = await page.evaluate(() => ({ top: document.querySelector('.hs3-top .hs3-label').textContent, bubble: document.querySelector('.hs3-says--reveal .hs3-bubble').textContent }));
      ok(said.top === 'The Morning Mug' && !/walk|coffee/i.test(said.bubble), `${label}: after "Naps", the mug tab says "${said.top}" and "${said.bubble}"`);
      const handed = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-review') || '{}').hs3_mug_lines || {});
      ok(handed.home === note[0] && handed.spot === note[1] && handed.meaning === note[2], `${label}: the chat hands the broken lines to the product page`);
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
      ok(under, `${label}: ${g} paw centered under the signature`);
    }
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${label}: ${g} has no sideways scroll at ${width}px`);
  }
  ok(!errors.length, `${label}: no script errors ${errors.join(' ')}`);
  await ctx.close();
}
// the first screen's example mug: the real-photo mug, drawn, turning (never the old drawn mug)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.route(/n8n\.cloud/, (r) => r.fulfill({ status: 503, body: '' }));
  await page.goto(`${base}/index-gifts.html`);
  await page.waitForFunction(() => document.querySelectorAll('canvas[data-hs3-heromug].is-drawn').length === 2, null, { timeout: 10000 }).catch(() => {});
  ok(await page.locator('canvas[data-hs3-heromug].is-drawn').count() === 2 && await page.locator('.hs3-hero .hs3-photo').count() === 0, 'home: the example mug is the real-photo mug, both faces drawn, no circle photo');
  await page.screenshot({ path: path.join(shots, 'home-dog.png') });
  await page.waitForTimeout(3500);
  ok(await page.locator('[data-hs3-hero-mug] .hs3-mugs').getAttribute('data-side') === 'note', 'home: the example mug turns to the note');
  await page.screenshot({ path: path.join(shots, 'home-note.png') });
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
