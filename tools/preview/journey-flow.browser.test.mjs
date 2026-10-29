// The rebuilt journey (29 Oct; sections/hs-journey.liquid, assets/hs-journey.js), walked on a phone
// against the rendered theme with the note writer stubbed. Krish's rules: one question per screen, no
// scrolling, nothing typed but the dog's name and the recipient's name, nothing asked twice, four tones
// that change the words without moving the page, and the painting never starts on the mug ("the UI
// always recommends the mug 10 times out of 10"). Screens go to out/journey-flow/.
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
  hilarious: {voice: 'A deadpan roommate who takes every habit seriously.', lines: {home: 'I take your arrivals very seriously, so I wait.', spot: "I keep your spot warm because the couch can't be trusted.", together: 'Our walk is the best part of my day, and I will testify.', meaning: 'Hard days are my specialty, so I stay close.'}},
  over_the_top: {voice: 'A smug star.', lines: {home: 'I wait at the door like a star waiting for a very slow driver.', spot: 'You may sit on whatever part of the couch I leave you.', together: 'I take you on walks because you would never find the outside alone.', meaning: 'I let you live here, and I love you.'}}
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
// the phones that matter, smallest to largest (29 Oct, Krish: "Guaranteed no scroll on every device"):
// iPhone SE 1st gen, small Android (Krish's Edge phone), iPhone SE 2/3, iPhone 12 to 15, Pixel, Pro Max
const SIZES = [{width: 320, height: 568}, {width: 360, height: 640}, {width: 375, height: 667}, {width: 390, height: 844}, {width: 412, height: 915}, {width: 430, height: 932},
  // and a desktop window (Krish, 29 Oct: "this should feel like a premium desktop site on desktop")
  {width: 1440, height: 900}];
// every screen fits the phone: nothing below the fold (Krish, 29 Oct: "It must be a no-scroll experience")
async function noScroll(page, where) {
  const {sh, ih} = await page.evaluate(() => ({sh: document.documentElement.scrollHeight, ih: window.innerHeight}));
  assert.ok(sh <= ih + 1, `${where} scrolls: ${sh} > ${ih}`);
}
// answers every question screen in order, checking each one is one question with nothing to type but the names
async function answer(page, a, shot) {
  await page.waitForURL(/step=name/);
  const step = async (id) => { await page.waitForURL(new RegExp('step=' + id)); await page.waitForSelector(`[data-hsj-screen="${id}"]`); if (shot) { await noScroll(page, id); await page.screenshot({path: path.join(shots, shot + '-' + id + '.png')}); } };
  await step('name');
  await page.locator('[data-hsj-name]').fill(a.name);
  await page.locator('[data-hsj-next]').click();
  await step('breed'); await pick(page, 'breed', a.breed);
  await step('pro'); await pick(page, 'pro', a.pro);
  await step('person');
  if (a.person) { await page.locator('[data-hsj-person]').fill(a.person); await page.locator('[data-hsj-next]').click(); } else await pick(page, 'self', 'self');
  for (const id of ['home', 'spot', 'together', 'meaning']) { await step(id); await pick(page, id, a[id]); }
  await step('toy');
  for (const t of a.toys || []) await pick(page, 'toy', t);
  await page.locator('[data-hsj-next]').click();
  await step('wears'); await pick(page, 'wears', a.wears || '');
  await page.waitForURL(/step=words/);
}

for (const size of SIZES) test(`the journey at ${size.width}x${size.height}: one question per screen, no scrolling, two names typed, four tones in place, the best-fit gift first`, async () => {
  const {ctx, page, calls, errors} = await open(size);
  const tag = size.width + '';
  try {
    await page.goto(`${base}/`);
    // the hook: one example, one button
    assert.equal(await page.locator('.hsj-h1').innerText(), 'Your dog loves you too.');
    assert.equal(await page.locator('[data-hsj-screen="hook"] .hsj-btn').count(), 1, 'one primary button');
    const btn = await page.locator('[data-hsj-go]').boundingBox();
    assert.ok(btn.y + btn.height <= size.height, 'the button is in the first phone screen');
    // the whole first screen fits, not just the button: nothing below the fold, nothing clipped
    await noScroll(page, 'hook');
    const hookBottom = await page.evaluate(() => Math.max(...[...document.querySelectorAll('[data-hsj-screen="hook"] *')].filter((e) => e.getClientRects().length && getComputedStyle(e).display !== 'none').map((e) => e.getBoundingClientRect().bottom)));
    assert.ok(hookBottom <= size.height, `the first screen ends at ${hookBottom}px of ${size.height}`);
    await page.screenshot({path: path.join(shots, tag + '-0-hook.png')});
    await page.locator('[data-hsj-go]').click();
    await answer(page, {name: 'mowgli', breed: 'Labrador Retriever', pro: 'he', person: 'sam', home: 'door', spot: 'anywhere', together: 'walk', meaning: 'hard', toys: ['a tennis ball', 'a big stick'], wears: 'a bandana'}, tag);

    // the words: the four tones change the note in a box that never moves
    await page.waitForFunction(() => /hard days, I'm the one/.test(document.querySelector('[data-hsj-note]').innerText));
    await noScroll(page, 'words');
    const box = async () => (await page.locator('[data-hsj-note]').boundingBox());
    const warm = await box();
    assert.match(await page.locator('[data-hsj-note]').innerText(), /On hard days, I'm the one who stays by you\.[\s\S]*Love, Mowgli/);
    assert.equal(await page.locator('[data-hsj-tone]').count(), 4, 'four settings');
    await page.screenshot({path: path.join(shots, tag + '-words-warm.png')});
    for (const [tone, text] of [['hilarious', /my specialty/], ['over_the_top', /I let you live here/]]) {
      await page.locator(`[data-hsj-tone="${tone}"]`).click();
      await page.waitForFunction((re) => new RegExp(re).test(document.querySelector('[data-hsj-note]').innerText), text.source);
      const b = await box();
      assert.deepEqual([b.y, b.height], [warm.y, warm.height], 'the tone changes the words, never the layout');
      await noScroll(page, 'words ' + tone);
      await page.screenshot({path: path.join(shots, tag + '-words-' + tone + '.png')});
    }
    const before = calls.length;
    await page.locator('[data-hsj-tone="warm"]').click();
    await page.waitForTimeout(500);
    assert.equal(calls.length, before, 'each tone is written once');
    assert.deepEqual(calls.map((c) => c.note_tone), ['warm', 'hilarious', 'over_the_top']);
    const c = calls[0];
    assert.equal(c.dog.name, 'Mowgli'); assert.equal(c.dog.breed, 'Labrador Retriever');
    assert.deepEqual(c.recipient, {name: 'Sam', relation: 'named'}, 'the recipient is the name typed');
    assert.equal(c.answers.find((x) => x.id === 'together').label, 'walks', 'each tap reaches the writer as words');
    assert.equal(c.answers.find((x) => x.id === 'toy').typed, 'a tennis ball and a big stick', 'two toys');
    assert.equal(c.answers.find((x) => x.id === 'wears').typed, 'a bandana');
    await page.locator('[data-hsj-tone="hilarious"]').click();

    // the look: six styles and the painting brief, on one screen
    await page.locator('[data-hsj-next]').click();
    await page.waitForURL(/step=look/);
    await noScroll(page, 'look');
    assert.equal(await page.locator('[data-hsj-style]').count(), 6, 'six styles');
    assert.match(await page.locator('[data-hsj-brief]').innerText(), /^We paint a Labrador Retriever in his bandana, out on a walk, with a stick far too big for him/);
    await page.locator('[data-hsj-style="collage"]').click();
    await page.screenshot({path: path.join(shots, tag + '-look.png')});

    // reload keeps the step and the answers; Back goes one screen back
    await page.reload();
    await page.waitForSelector('[data-hsj-screen="look"]');
    assert.equal(await page.locator('[data-hsj-style="collage"]').getAttribute('aria-pressed'), 'true');

    // the photo: one big target, then the painting starts on the best-fit gift
    await page.locator('[data-hsj-next]').click();
    await page.waitForURL(/step=photo/);
    await noScroll(page, 'photo');
    const drop = await page.locator('[data-hsj-drop]').boundingBox();
    assert.ok(drop.height >= 200 && drop.width >= Math.min(size.width - 40, 400), 'one big tappable target, the width of a phone screen');
    await page.screenshot({path: path.join(shots, tag + '-photo.png')});
    await page.evaluate(() => { window.HSPhotoQuality = {check: () => Promise.resolve({verdict: 'ok', reasons: []})}; });
    await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
    await page.waitForURL(/\/products\/your-dogs-portrait\?.*journey=1/, {timeout: 10000});
    const bridge = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-review')));
    assert.equal(bridge.hs_journey.gift, 'print', 'a walker who sleeps nowhere near paints the portrait first, never the mug the writer picked');
    assert.deepEqual(bridge.hs3_art_choices, {style: 'collage', tone: 'hilarious'});
    assert.equal(bridge.hs3_lines.meaning, 'Hard days are my specialty, so I stay close.');
    assert.equal(bridge.dog, 'Mowgli'); assert.equal(bridge.person, 'Sam');
    assert.ok(bridge.hs3_photo_t > 0, 'the photo is saved for the gift');
    assert.ok((bridge.hs3_art_profile.facts || []).some((f) => /tennis ball and a big stick/.test(f.text)), 'both toys reach the painting');
    assert.ok((bridge.hs3_art_profile.facts || []).some((f) => /bandana/.test(f.text)), 'what the dog wears reaches the painting');
    assert.deepEqual(errors.filter((e) => !/HSPhotoQuality|detector/i.test(e)), []);
  } finally { await ctx.close(); }
});

test('a dog that sleeps near them paints the blanket first, a boss the portrait; nothing paints the mug first', async () => {
  for (const [a, page_] of [[{name: 'Pip', breed: 'Pug', pro: 'she', person: 'Mom', home: 'spin', spot: 'feet', together: 'movie', meaning: 'best'}, /your-dogs-personality-blanket/],
    [{name: 'Kuku', breed: 'Mixed', pro: 'she', home: 'cool', spot: 'bed', together: 'car', meaning: 'boss'}, /your-dogs-portrait/]]) {
    const {ctx, page} = await open({gift: 'mug'});
    try {
      await page.goto(`${base}/?step=name`);
      await answer(page, a);
      await page.waitForFunction((n) => new RegExp('Love, ' + n).test(document.querySelector('[data-hsj-note]').innerText), a.name);
      await page.locator('[data-hsj-next]').click();
      await page.locator('[data-hsj-next]').click();
      await page.evaluate(() => { window.HSPhotoQuality = {check: () => Promise.resolve({verdict: 'ok', reasons: []})}; });
      await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
      await page.waitForURL(page_, {timeout: 10000});
    } finally { await ctx.close(); }
  }
});

test('a deep link past the answers lands on the first open question, Back steps one screen, and a rejected photo stays put', async () => {
  const {ctx, page, calls} = await open();
  try {
    await page.goto(`${base}/?step=photo`);
    await page.waitForURL(/step=name/);
    await page.locator('[data-hsj-name]').fill('Kuku');
    await page.locator('[data-hsj-name]').press('Enter');
    await page.waitForURL(/step=breed/);
    await page.locator('[data-hsj-back]').click();
    await page.waitForURL(/step=name/);
    assert.equal(await page.locator('[data-hsj-name]').inputValue(), 'Kuku', 'Back keeps the answer');
    await page.goto(`${base}/?step=name`);
    await answer(page, {name: 'Kuku', breed: 'Mixed', pro: 'she', home: 'cool', spot: 'bed', together: 'car', meaning: 'boss'});
    assert.equal(calls[0].recipient.relation, 'self');
    await page.locator('[data-hsj-next]').click();
    await page.locator('[data-hsj-next]').click();
    await page.waitForURL(/step=photo/);
    await page.evaluate(() => { window.HSPhotoQuality = {check: () => Promise.resolve({verdict: 'reject', overridable: true, reasons: [{code: 'no_dog', message: "I couldn't find a dog in this photo."}]})}; });
    await page.locator('[data-hsj-file]').setInputFiles(PHOTO);
    await page.waitForFunction(() => /couldn't find a dog/.test(document.querySelector('[data-hsj-photo-note]').textContent));
    assert.match(page.url(), /step=photo/, 'a refused photo paints nothing');
    await page.locator('[data-hsj-override]').click();
    await page.waitForURL(/\/products\/your-dogs-portrait\?.*journey=1/, {timeout: 10000});
  } finally { await ctx.close(); }
});
