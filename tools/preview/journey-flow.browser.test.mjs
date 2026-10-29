// The rebuilt journey (29 Oct; sections/hs-journey.liquid, assets/hs-journey.js), walked on a phone
// against the rendered theme with the note writer stubbed. Krish's rules, from the failed phone batch:
// every screen does one thing, nothing is asked twice, taps not typing, the tone visibly changes the
// words without moving the page, and the painting never starts on the mug (it sits under the margin
// floor; "the UI always recommends the mug 10 times out of 10"). Screens go to out/journey-flow/.
// It is previewed at /?view=journey (templates/index.journey.json) until it replaces the homepage.
//   cd tools/preview && node render.mjs && cd ../.. && node --test tools/preview/journey-flow.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out'), shots = path.join(out, 'journey-flow');
fs.mkdirSync(shots, {recursive: true});
const PHOTO = path.join(here, '../../assets/photos/pug-autumn-leaves.jpg');
const PAGE_FOR = {'your-dogs-illustrated-mug': 'product-mug-native.html', 'your-dogs-portrait': 'product-portrait-native.html', 'your-dogs-personality-blanket': 'product-blanket-native.html'};
const NOTES = {
  sentimental: {voice: 'A quiet, devoted friend.', lines: {home: 'I wait by the door until you come home.', spot: 'Your side of the couch stays warm with me.', together: 'Our walks are the best part of my day.', meaning: 'On the hard days, I stay right next to you.'}},
  warm: {voice: 'A loyal friend with a small smile.', lines: {home: "I'm at the door because I keep count.", spot: 'I save the couch for you, and I guard it well.', together: 'Our walk is the part of my day I never skip.', meaning: "On hard days, I'm the one who stays by you."}},
  hilarious: {voice: 'A deadpan roommate who takes every habit seriously.', lines: {home: 'I take your arrivals very seriously, so I wait.', spot: "I keep your spot warm because the couch can't be trusted.", together: 'Our walk is the best part of my day, and I will testify.', meaning: 'Hard days are my specialty, so I stay close.'}}
};
let server, base, browser;
before(async () => {
  // offline CI runs the tests before its render step, so the page is rendered here when it is missing
  if (!fs.existsSync(path.join(out, 'index-journey.html'))) execFileSync(process.execPath, ['render.mjs'], {cwd: here, stdio: 'ignore'});
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let f = path.join(out, decodeURIComponent(u.pathname));
    if (u.pathname === '/') f = path.join(out, 'index-journey.html');
    if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
    else if (u.pathname.startsWith('/products/')) f = path.join(out, PAGE_FOR[u.pathname.split('/')[2]] || 'missing');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
    res.writeHead(200, {'Content-Type': type}); fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => { await browser.close(); server.close(); });

async function open({width = 390, height = 844, gift} = {}) {
  const ctx = await browser.newContext({viewport: {width, height}, hasTouch: true, isMobile: true});
  const page = await ctx.newPage();
  const calls = [], errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route((url) => !url.href.startsWith(base) && !/n8n/i.test(url.href) && !/^(data|blob):/.test(url.href), (r) => r.abort());
  await page.route(/n8n/i, async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({status: 204, headers: {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type'}});
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.warm) return route.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: '{"warm":true}'});
    calls.push(body);
    await new Promise((r) => setTimeout(r, 150));
    const n = NOTES[body.note_tone];
    // the writer still picks the mug for walks and coffee; the journey must not paint it first
    return route.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify({...n, recommended_gift: gift || 'mug', reason: '', flags: [], source: 'ai'})});
  });
  return {ctx, page, calls, errors};
}
const pick = (page, group, v) => page.locator(`[data-hsj-pick="${group}"][data-v="${v}"]`).click();

test('the journey: one job per screen, taps not typing, a tone that changes the words in place, and the painting starts on the best-fit gift, never the mug', async () => {
  const {ctx, page, calls, errors} = await open();
  try {
    await page.goto(`${base}/`);
    // 1. the hook: one example, one button
    assert.equal(await page.locator('.hsj-h1').innerText(), 'Your dog loves you too.');
    assert.equal(await page.locator('[data-hsj-screen="hook"] .hsj-btn').count(), 1, 'one primary button');
    assert.match(await page.locator('.hsj-example').innerText(), /Example/i);
    const btn = await page.locator('[data-hsj-go]').boundingBox();
    assert.ok(btn.y + btn.height <= 844, 'the button is in the first phone screen');
    await page.screenshot({path: path.join(shots, '1-hook.png')});

    // 2. about: the name is the only thing typed; every other answer is a tap, one group after another
    await page.locator('[data-hsj-go]').click();
    await page.waitForURL(/step=about/);
    assert.equal(await page.locator('[data-hsj-group]').count(), 0, 'nothing before the name');
    await page.locator('[data-hsj-name]').fill('mowgli');
    await pick(page, 'breed', 'Labrador Retriever');
    await pick(page, 'pro', 'he');
    await pick(page, 'rel', 'partner');
    assert.equal(await page.locator('[data-hsj-next]').isDisabled(), true, 'not until the dog is described');
    await pick(page, 'home', 'door'); await pick(page, 'spot', 'anywhere'); await pick(page, 'together', 'walk'); await pick(page, 'meaning', 'hard');
    await pick(page, 'toy', 'a tennis ball'); await pick(page, 'accessory', 'a bandana');
    const typed = await page.locator('[data-hsj-screen="about"] input:not([type="file"])').count();
    assert.equal(typed, 1, 'one typed field: the name');
    assert.equal(await page.locator('[data-hsj-next]').innerText(), 'Show me Mowgli');
    await page.screenshot({path: path.join(shots, '2-about.png'), fullPage: true});

    // 3. profile: the words in Mowgli's voice, the tone beside them, the look; nothing painted
    await page.locator('[data-hsj-next]').click();
    await page.waitForURL(/step=profile/);
    await page.waitForFunction(() => /hard days, I stay right next to you|hard days, I'm the one/.test(document.querySelector('[data-hsj-note]').innerText));
    const box = async () => (await page.locator('[data-hsj-note]').boundingBox());
    const warm = await box();
    assert.match(await page.locator('[data-hsj-note]').innerText(), /On hard days, I'm the one who stays by you\.[\s\S]*Love, Mowgli/);
    await page.screenshot({path: path.join(shots, '3-profile-warm.png'), fullPage: true});
    await page.locator('[data-hsj-tone="hilarious"]').click();
    await page.waitForFunction(() => /my specialty/.test(document.querySelector('[data-hsj-note]').innerText));
    const funny = await box();
    assert.deepEqual([funny.y, funny.height], [warm.y, warm.height], 'the tone changes the words, never the layout');
    assert.match(await page.locator('.hsj-print').innerText(), /Hard days are my specialty/, 'the printed line follows the tone');
    await page.screenshot({path: path.join(shots, '3-profile-hilarious.png'), fullPage: true});
    // back to a tone already written: no second call
    const before = calls.length;
    await page.locator('[data-hsj-tone="warm"]').click();
    await page.waitForTimeout(500);
    assert.equal(calls.length, before, 'each tone is written once');
    assert.deepEqual(calls.map((c) => c.note_tone), ['warm', 'hilarious']);
    assert.ok(calls.every((c) => c.dog.name === 'Mowgli' && c.dog.breed === 'Labrador Retriever'), 'the writer gets the breed');
    assert.equal(await page.locator('[data-hsj-style]').count(), 6, 'six styles');
    assert.equal(await page.locator('[data-hsj-style] img').count(), 2, 'only approved example paintings are shown');
    await page.locator('[data-hsj-style="collage"]').click();
    await page.locator('[data-hsj-tone="hilarious"]').click();

    // reload and Back keep the step and the answers
    await page.reload();
    await page.waitForSelector('[data-hsj-screen="profile"]');
    assert.equal(await page.locator('[data-hsj-tone="hilarious"]').getAttribute('aria-pressed'), 'true');

    // 4. the photo: one big target, then the painting starts on the best-fit gift
    await page.locator('[data-hsj-next]').click();
    await page.waitForURL(/step=photo/);
    const drop = await page.locator('[data-hsj-drop]').boundingBox();
    assert.ok(drop.height >= 200 && drop.width >= 300, 'one big tappable target');
    assert.equal(await page.locator('[data-hsj-drop] input[type="file"]').count(), 1, 'the target is the photo picker');
    await page.screenshot({path: path.join(shots, '4-photo.png'), fullPage: true});
    await page.evaluate(() => { window.HSPhotoQuality = {check: () => Promise.resolve({verdict: 'ok', reasons: []})}; });
    await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
    await page.waitForURL(/\/products\/your-dogs-portrait\?.*journey=1/, {timeout: 10000});
    const bridge = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-review')));
    assert.equal(bridge.hs_journey.gift, 'print', 'a walker who sleeps nowhere near paints the portrait first, never the mug the writer picked');
    assert.deepEqual(bridge.hs3_art_choices, {style: 'collage', tone: 'hilarious'});
    assert.equal(bridge.hs3_lines.meaning, 'Hard days are my specialty, so I stay close.');
    assert.equal(bridge.dog, 'Mowgli');
    assert.ok(bridge.hs3_photo_t > 0, 'the photo is saved for the gift');
    assert.ok((bridge.hs3_art_profile.facts || []).some((f) => /tennis ball/.test(f.text)), 'the toy reaches the painting');
    assert.deepEqual(errors.filter((e) => !/HSPhotoQuality|detector/i.test(e)), []);
  } finally { await ctx.close(); }
});

test('a couch or movie-night dog paints the blanket first; nothing paints the mug first', async () => {
  const {ctx, page} = await open({gift: 'mug'});
  try {
    await page.goto(`${base}/?step=about`);
    await page.waitForSelector('[data-hsj-name]');
    await page.locator('[data-hsj-name]').fill('Pip');
    for (const [g, v] of [['breed', 'Pug'], ['pro', 'she'], ['rel', 'mom'], ['home', 'spin'], ['spot', 'feet'], ['together', 'movie'], ['meaning', 'best']]) await pick(page, g, v);
    await page.locator('[data-hsj-next]').click();
    await page.waitForFunction(() => /Love, Pip/.test(document.querySelector('[data-hsj-note]').innerText));
    await page.locator('[data-hsj-next]').click();
    await page.evaluate(() => { window.HSPhotoQuality = {check: () => Promise.resolve({verdict: 'ok', reasons: []})}; });
    await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
    await page.waitForURL(/\/products\/your-dogs-personality-blanket\?.*journey=1/, {timeout: 10000});
  } finally { await ctx.close(); }
});

test('a deep link to a later step without answers lands on the first unanswered screen, and a rejected photo stays put', async () => {
  const {ctx, page} = await open();
  try {
    await page.goto(`${base}/?step=photo`);
    await page.waitForURL(/step=about/);
    assert.equal(await page.locator('[data-hsj-screen="about"]').count(), 1);
    await page.locator('[data-hsj-name]').fill('Kuku');
    for (const [g, v] of [['breed', 'Mixed'], ['pro', 'she'], ['rel', 'self'], ['home', 'cool'], ['spot', 'bed'], ['together', 'car'], ['meaning', 'boss']]) await pick(page, g, v);
    await page.locator('[data-hsj-next]').click();
    await page.locator('[data-hsj-next]').click();
    await page.waitForURL(/step=photo/);
    await page.evaluate(() => { window.HSPhotoQuality = {check: () => Promise.resolve({verdict: 'reject', overridable: true, reasons: [{code: 'no_dog', message: "I couldn't find a dog in this photo."}]})}; });
    await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
    await page.waitForFunction(() => /couldn't find a dog/.test(document.querySelector('[data-hsj-photo-note]').textContent));
    assert.match(page.url(), /step=photo/, 'a refused photo paints nothing');
    assert.equal(await page.locator('[data-hsj-override]').isVisible(), true, 'the buyer can say it is their dog');
    await page.locator('[data-hsj-override]').click();
    await page.waitForURL(/\/products\/your-dogs-portrait\?.*journey=1/, {timeout: 10000});
  } finally { await ctx.close(); }
});
