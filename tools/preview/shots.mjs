// Serve tools/preview/out, screenshot every page at phone and desktop widths, and
// exercise the v2 behaviour: the live dog name, the HR-26 chips and evidence
// photos, the read-aloud toggle, the attached headshot, the four story cards with
// caption and link, the link that carries answers to the product page, the
// Teeinblue bridge (against a stand-in built like Teeinblue's real markup) and the
// sticky button.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, 'out');
const shots = path.join(root, 'shots');
fs.mkdirSync(shots, { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
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
  const ctx = await browser.newContext({ viewport: { width, height }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  pg.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`${name} ${r.status()}: ${r.url()}`); });
  await pg.goto(url);
  await pg.evaluate(() => document.fonts.ready);
  return { ctx, pg };
}
async function fullShot(pg, file) {
  await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
  // lazy images inside hidden boxes never load, so only wait for the ones on the page
  await pg.evaluate(() => Promise.all([...document.images].filter((i) => i.getClientRects().length).map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
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
log('step shown first:', await pg.locator('[data-hs2-step-no]').innerText(), '| poster scale:', await pg.locator('[data-hs2-poster-box]').evaluate((e) => getComputedStyle(e).getPropertyValue('--hs2-scale')));
await pg.fill('[data-hs2-input="person"]', 'Priya');
await pg.fill('[data-hs2-input="cupboard"]', '2,019');
await pg.click('[data-hs2-step-next]');
await pg.click('[data-hs2-chip="improvement"][data-value="The vacuum"]');
await pg.waitForTimeout(900);
log('a chip moves the form on by itself -> step', await pg.locator('[data-hs2-step-no]').innerText());
await pg.click('[data-hs2-chip="incident"][data-value="The couch"]');
await pg.waitForTimeout(900);
await pg.click('[data-hs2-chip="enemy"][data-value="Squirrels"]');
await pg.waitForTimeout(900);
log('after three chips -> step', await pg.locator('[data-hs2-step-no]').innerText(), '| prints line:', await pg.locator('[data-hs2-step="4"] .hs2-step__prints span:last-child').innerText());
await pg.click('[data-hs2-voice]');
await pg.waitForTimeout(200);
log('poster improvement:', await pg.locator('.hs2-poster [data-hs2="improvementLine"]').innerText());
log('poster incident:', await pg.locator('.hs2-poster [data-hs2="incidentLine"]').innerText());
log('poster enemy:', await pg.locator('.hs2-poster [data-hs2="enemyLine"]').innerText());
log('voice button:', await pg.locator('[data-hs2-voice]').innerText());
log('memo to:', (await pg.locator('.hs2-management__memo').innerText()).split('\n')[0]);
log('evidence photos:', JSON.stringify(await pg.evaluate(() => [...document.querySelectorAll('[data-hs2-exhibit]')].map((f) => [f.getAttribute('data-hs2-exhibit'), f.querySelector('img').getAttribute('data-key'), f.querySelector('figcaption').textContent]))));
await pg.setInputFiles('[data-hs2-photo-in]', path.join(here, '..', '..', 'assets', 'v2', 'team-02.jpg'));
await pg.waitForTimeout(300);
log('headshot attached -> poster photo is local:', await pg.locator('.hs2-poster [data-hs2-photo]').evaluate((i) => i.src.startsWith('blob:')), '| stand-in note hidden:', await pg.locator('[data-hs2-nudge]').isHidden());
await pg.locator('#review').screenshot({ path: path.join(shots, 'desktop-review-gerald.png') });
await pg.locator('.hs2-management').screenshot({ path: path.join(shots, 'desktop-management-gerald.png') });
await pg.locator('.hs2-leak').scrollIntoViewIfNeeded();
for (const t of ['rating', 'incident', 'threat', 'memo']) {
  await pg.click(`[data-hs2-leak="${t}"]`);
  await pg.waitForTimeout(400);
  const [download] = await Promise.all([
    pg.waitForEvent('download', { timeout: 8000 }).catch(() => null),
    pg.click('[data-hs2-story]'),
  ]);
  if (download) { await download.saveAs(path.join(shots, `story-card-${t}.png`)); log(`story card ${t}:`, download.suggestedFilename()); } else log(`story card ${t}: no download`);
}
await pg.click('[data-hs2-leak-step="1"]', { force: true }); // the phone floats, so Playwright never sees it still
log('tap right on the phone wraps to:', await pg.locator('[data-hs2-leak][aria-checked="true"]').getAttribute('data-hs2-leak'));
await pg.click('[data-hs2-caption]');
log('caption copied:', await pg.evaluate(() => navigator.clipboard.readText()));
await pg.click('[data-hs2-link]');
log('link copied:', await pg.evaluate(() => navigator.clipboard.readText()), '|', await pg.locator('[data-hs2-story-status]').innerText());
await pg.locator('.hs2-leak').screenshot({ path: path.join(shots, 'desktop-leak-gerald.png') });
await pg.evaluate(() => window.scrollTo(0, document.querySelector('#review').offsetTop + 200));
await pg.waitForTimeout(700);
log('sticky on while the builder is on screen (should be false):', await pg.locator('[data-hs2-sticky]').evaluate((e) => e.classList.contains('is-on')));
await pg.evaluate(() => window.scrollTo(0, document.querySelector('#benefits').offsetTop));
await pg.waitForTimeout(700);
log('sticky on at benefits (should be true):', await pg.locator('[data-hs2-sticky]').evaluate((e) => e.classList.contains('is-on')), '|', await pg.locator('[data-hs2-sticky] a').innerText());

// urgency: real dates only
log('memo countdown:', await pg.locator('[data-hs2-countdown="memo"]').first().innerText(), '| sticky:', await pg.locator('[data-hs2-countdown="sub"]').innerText());
log('closure clock:', await pg.locator('[data-hs2-clock-label]').innerText(), await pg.locator('.hs2-closure__digits').innerText().then((t) => t.replace(/\s+/g, ' ')));

// 3. The approve link carries the answers to the poster product page; the stamp lands first
await pg.evaluate(() => { const a = document.querySelector('[data-hs2-approve]'); a.setAttribute('data-hs2-base', 'product-review.html'); a.setAttribute('href', 'product-review.html'); });
await pg.fill('[data-hs2-input="dog"]', 'Gerald'); // re-render links
const href = await pg.locator('[data-hs2-approve]').getAttribute('href');
log('approve link:', href);
await pg.evaluate(() => window.scrollTo(0, document.querySelector('#review').offsetTop));
await pg.click('[data-hs2-step-go="5"]');
await Promise.all([pg.waitForURL(/product-review/, { timeout: 5000 }), pg.click('[data-hs2-approve]')]);
log('approve stamped the poster, then opened:', pg.url().split('/').pop().split('?')[0]);
await pg.goto('http://localhost:4173/' + href);
await pg.evaluate(() => document.fonts.ready);
await pg.waitForTimeout(300);
log('product page answers visible:', await pg.locator('[data-hs2-answers]').isVisible(), '| poster dog:', await pg.locator('.hs2-poster .hs2-paw [data-hs2="dog"]').innerText());
log('hidden properties:', JSON.stringify(await pg.evaluate(() => [...document.querySelectorAll('[data-hs2-prop]')].map((i) => [i.name, i.value]))));
await fullShot(pg, 'desktop-product-review.png');

// 3b. The Teeinblue bridge. A stand-in personalizer with Teeinblue's real markup
// (.tee-field, .tee-field__heading, input.tee__input--text named layer-<id>, a select
// per dropdown, a photo field) and its API (getCurrentCustomization), arriving late
// the way Teeinblue does. Labels are the ones in docs/TEEINBLUE-SETUP.md.
const tib = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const tp = await tib.newPage();
tp.on('pageerror', (e) => errors.push(`teeinblue: ${e.message}`));
await tp.addInitScript(() => {
  const data = {};
  window.__tibFiles = [];
  window.teeinblueCampaign = { productId: '9001' };
  window.teeinblue = Object.assign(window.teeinblue || {}, {
    getCurrentCustomization: () => ({ ...data }),
    refillCustomizationData: () => {},
  });
  const field = (id, label, control) => `<div class="tee-field tee-field--${id}" id="tee-field--${id}"><div class="tee-field__header"><div class="tee-field__heading"><span>${label}</span><span class="tee-asterisk">*</span></div></div><div class="tee-field__input">${control}</div></div>`;
  const text = (id) => `<input class="tee__input tee__input--text" type="text" name="${id}" id="${id}">`;
  const select = (id, opts) => `<select class="tee-field__select" name="${id}" id="${id}"><option disabled value="null">Choose an option</option>${opts.map((o, i) => `<option value="opt-${id}-${i}">${o}</option>`).join('')}</select>`;
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
    const box = document.createElement('div');
    box.className = 'tee-customization-form';
    box.innerHTML = [
      field('layer-11', "Who is your manager? (Your dog's name)", text('layer-11')),
      field('layer-12', 'Employee name (you)', text('layer-12')),
      field('layer-13', 'Times you opened the treat cupboard', text('layer-13')),
      field('layer-14', 'Area for improvement', select('layer-14', ['Leaving', 'The vacuum', 'Bath time', 'Sharing food', 'Your phone'])),
      field('layer-15', 'Open incident report', select('layer-15', ['The sock', 'The sandwich', 'The remote', 'Rolled in it', 'The couch'])),
      field('layer-16', 'Known enemy of the company', select('layer-16', ['The mailman', 'Squirrels', 'The vacuum', 'The cat', 'My reflection'])),
      `<div class="tee-field tee-field--photo tee-field--layer-17"><div class="tee-field__heading"><span>Attach your dog's headshot</span></div><input type="file" id="tee-photo-layer-17" accept="image/*"></div>`,
    ].join('');
    // like Teeinblue's Vue form: state follows input and change events
    box.addEventListener('input', (e) => { if (e.target.name) data[e.target.name] = e.target.value; });
    box.addEventListener('change', (e) => {
      if (e.target.type === 'file') { window.__tibFiles.push(e.target.files[0] && e.target.files[0].name); data['layer-17-origin'] = 'uploaded'; return; }
      if (e.target.name) data[e.target.name] = e.target.value;
    });
    const anchor = document.querySelector('[data-hs2-answers]');
    anchor.after(box);
    document.dispatchEvent(new Event('teeinblue-event-component-injected'));
  }, 700));
});
// arrive from the homepage with answers in the link, and a headshot already attached there
await tp.goto('http://localhost:4173/');
await tp.setInputFiles('[data-hs2-photo-in]', path.join(here, '..', '..', 'assets', 'v2', 'team-02.jpg'));
await tp.waitForTimeout(400);
await tp.goto('http://localhost:4173/' + href);
await tp.waitForTimeout(2200);
log('teeinblue record after the bridge:', JSON.stringify(await tp.evaluate(() => window.teeinblue.getCurrentCustomization())));
log('teeinblue fields show:', JSON.stringify(await tp.evaluate(() => [...document.querySelectorAll('.tee-field input[type=text], .tee-field select')].map((i) => i.tagName === 'SELECT' ? i.options[i.selectedIndex].text : i.value))));
log('answers card says:', await tp.locator('[data-hs2-bridge-status]').innerText(), '| headshot button visible:', await tp.locator('[data-hs2-handoff]').isVisible());
await tp.locator('.hs2-product__info').screenshot({ path: path.join(shots, 'desktop-product-teeinblue-bridge.png') });
await tp.click('[data-hs2-handoff-btn]');
await tp.waitForTimeout(200);
log('headshot handed to the personalizer:', JSON.stringify(await tp.evaluate(() => window.__tibFiles)), '|', await tp.locator('[data-hs2-bridge-status]').innerText());
await tp.fill('#layer-11', 'Gerald Jr');
await tp.waitForTimeout(200);
log('shopper edits the dog in the personalizer -> order property:', await tp.locator('[data-hs2-prop="dog"]').inputValue(), '| card:', await tp.locator('[data-hs2-answers] [data-hs2="dog"]').innerText());
await tib.close();

// 4. Pillow product page on phone (no images yet: placeholder tag)
const pillow = await open(390, 844, 'pillow', 'http://localhost:4173/product-pillow.html');
await fullShot(pillow.pg, 'phone-product-pillow.png');
await pillow.pg.selectOption('[data-hs2-variant]', '11');
log('pillow price after picking 10″:', await pillow.pg.locator('[data-hs2-price]').innerText());

// 5. The launch offer only shows inside its dates (here previewed as 25 October)
const offer = await open(1440, 900, 'offer', 'http://localhost:4173/?hs2_now=2026-10-25');
log('on 25 October the read-aloud button says:', await offer.pg.locator('[data-hs2-voice]').innerText());
const before = await open(1440, 900, 'no-offer', 'http://localhost:4173/?hs2_now=2026-10-05');
log('on 5 October it says:', await before.pg.locator('[data-hs2-voice]').innerText());

// 6. Inside Instagram's in-app browser, the story card opens to press and hold (no download)
const ig = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0 (iPhone15,3; iOS 18_0; en_US)' });
const igp = await ig.newPage();
igp.on('pageerror', (e) => errors.push(`instagram: ${e.message}`));
await igp.goto('http://localhost:4173/');
await igp.locator('.hs2-leak').scrollIntoViewIfNeeded();
await igp.click('[data-hs2-story]');
await igp.waitForSelector('.hs2-cardview img', { timeout: 6000 }).catch(() => null);
log('in-app browser flagged:', await igp.evaluate(() => document.documentElement.classList.contains('hs2-inapp')), '| card opens to save:', await igp.locator('.hs2-cardview img').count() === 1);
await igp.screenshot({ path: path.join(shots, 'phone-instagram-story-card.png') });
await ig.close();

// 7. The ad landing page: no store menu, Approve lands on the buy box on the same page
const land = await open(390, 844, 'landing', 'http://localhost:4173/product-landing.html');
log('landing: store header hidden:', await land.pg.locator('.header-section').isHidden(), '| buy box id:', await land.pg.locator('#buy').count());
await land.pg.evaluate(() => window.scrollTo(0, document.querySelector('#review').offsetTop));
await land.pg.click('[data-hs2-step-go="5"]');
await land.pg.click('[data-hs2-approve]');
await land.pg.waitForTimeout(1600);
log('landing approve scrolled to the buy box:', await land.pg.evaluate(() => Math.abs(document.querySelector('#buy').getBoundingClientRect().top) < 120));
await land.pg.screenshot({ path: path.join(shots, 'phone-landing-first-screen.png') });

log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
await browser.close();
server.close();
