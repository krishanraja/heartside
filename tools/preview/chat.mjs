// v3 gift chat (sections/hs3-chat.liquid, assets/hs3.js), driven on a phone-sized page, against
// spec section 11. Run after render.mjs:   cd tools/preview && node chat.mjs
// The n8n webhooks are stubbed here (AI answers, a slow answer and a refusal), so the test
// never spends a call; the live webhooks have their own check in n8n/README.md.
// Each check prints ok or FAIL; the run exits 1 on any FAIL. Screens go to out/chat/.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out');
const shots = path.join(out, 'chat');
fs.mkdirSync(shots, { recursive: true });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) failures++; };

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let f = path.join(out, decodeURIComponent(u.pathname));
  if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', path.basename(u.pathname));
  else if (u.pathname.startsWith('/products/')) f = path.join(out, 'product-gift.html');
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  const type = f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : f.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const BANNED = /—|\belevate|\bunleash|must-have|game-changer|fur baby|annual review|area for improvement|known enemy|HR\b/i;

async function session(name, { ai = 'ok', width = 390, height = 844 } = {}) {
  const mode = ai;
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 350.0' });
  const page = await ctx.newPage();
  const events = [], errors = [], calls = [], warms = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => { window.Shopify = { analytics: { publish: (n, d) => { (window.__ev = window.__ev || []).push([n, d]); } } }; });
  await page.route(/krishraja10101\.app\.n8n\.cloud/, async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST' } });
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.warm) { warms.push(route.request().url()); return route.fulfill({ status: 200, contentType: 'application/json', body: '{"warm":true}' }); }
    calls.push(body);
    if (ai === 'fail') return route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"origin"}' });
    if (ai === 'slow') { await new Promise((r) => setTimeout(r, 4000)); return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }).catch(() => {}); }
    if (route.request().url().includes('compose')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lines: { home: body.note_tone === 'hilarious' ? 'I guard the window like it owes me rent.' : 'Watches the window for you from 5pm.', spot: body.current_lines.spot, together: body.current_lines.together, meaning: body.current_lines.meaning }, alternates: {}, recommended_gift: body.note_tone === 'hilarious' ? 'blanket' : (body.answers.some((a) => a.typed) ? 'mug' : body.default_gift), reason: 'The window watch starts at 5pm. So Kuku gets a spot in your mug.', sources: {}, flags: [] }) });
    }
    if (/passed away/.test(body.typed_text)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reaction: "I didn't quite catch that one. Try again, or pick one of these?", line: '', follow_up: null, flags: ['grief'] }) });
    const fu = body.step === 'home' ? { question: 'From 5pm sharp? Every day?', chips: ['Every single day', 'Weekdays', 'Even weekends'], lines: [null, 'Watches for you from 5pm on weekdays.', 'Watches for you from 5pm, weekends too.'], replies: [null, 'Keeps office hours. Smart dog.', 'Weekends too. Very loyal.'] } : null;
    if (mode === 'delay') await new Promise((r) => setTimeout(r, 1200));
    const line = body.step === 'home_follow' ? 'Watches the window for you from 5pm, daily.' : 'Watches the window for you from 5pm.';
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reaction: 'The window watch. Very serious work.', line, follow_up: fu, flags: [] }) });
  });
  await page.goto(`${base}/${name}`);
  return { ctx, page, events, errors, calls, warms };
}
const tap = (page, sel) => page.locator(sel).first().click();
const chipNamed = (page, label) => page.locator('[data-hs3="chip"]', { hasText: label }).first().click();
const bubble = (page) => page.locator('.hs3-bubble').last().innerText();
const noteLines = (page) => page.locator('.hs3-note .hs3-line.hs3-ink').allInnerTexts();
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

// 1. chips only, two gifts, timed (spec 11.1)
{
  const { ctx, page, errors, calls, warms } = await session('index-gifts.html');
  const t0 = Date.now();
  await page.screenshot({ path: path.join(shots, '0-home.png') });
  ok(await page.locator('.hs3-hero__h').innerText() === 'Your dog loves you too.', 'home: headline "Your dog loves you too."');
  ok(await noOverflow(page), 'home: no sideways scroll at 390px');
  await tap(page, '[data-hs3-start]');
  ok((await bubble(page)).includes("Hi! I'm Buddy."), 'chat step 1: Buddy greets');
  await page.fill('#hs3-dog', 'kuku');
  await tap(page, '[data-hs3="next"]');
  ok((await bubble(page)).startsWith('Kuku! Great name. My tail is going.'), 'step 2: reacts to the name, capitalised');
  await page.fill('#hs3-rec', 'Sam');
  await tap(page, '[data-hs3="next"]');
  ok((await bubble(page)).includes('What does Kuku do when Sam comes home?'), 'step 3: home question names both');
  await page.screenshot({ path: path.join(shots, '1-chat-step3.png') });
  await chipNamed(page, 'Waits at the door');
  ok((await noteLines(page))[0] === 'I wait by the door until you come home.', 'step 3: a first draft line inks straight away');
  await page.waitForSelector('text=At the door! Every day? Even weekends? (I would.)', { timeout: 3000 });
  await chipNamed(page, 'Even weekends');
  ok((await bubble(page)).startsWith("Weekends too? That's a dog who knows what matters."), 'step 3b: follow-up reaction');
  await chipNamed(page, "Sam's side of the bed");
  await chipNamed(page, 'The morning walk');
  await chipNamed(page, "Sam's shadow");
  ok((await noteLines(page)).join('|') === "I wait by the door for you, weekends too.|I took your side of the bed to keep it warm.|Our walks are the best part of my day.|I'm your shadow, and I like it that way.", 'chat: four lines in the dog\'s own voice');
  await page.screenshot({ path: path.join(shots, '2-chat-done.png') });
  await tap(page, '[data-hs3="next"]');
  await page.waitForTimeout(3300);
  await page.screenshot({ path: path.join(shots, '3-reveal-mug.png') });
  ok((await page.locator('.hs3-h2').innerText()) === "Kuku's gift for Sam", 'reveal: "Kuku\'s gift for Sam"');
  ok((await page.locator('.hs3-tab.is-on').innerText()).includes("Buddy's pick") && (await page.locator('.hs3-tab.is-on').innerText()).includes('Mug'), 'reveal: walks pick the mug, marked Buddy\'s pick');
  ok((await page.locator('.hs3-stage .hs3-line.hs3-ink').count()) === 3, 'reveal: three lines ink on the mug');
  ok(await page.locator('[data-hs3-tone]').inputValue() === '1', 'tone: warm default on the reveal');
  await page.locator('[data-hs3-tone]').focus(); await page.locator('[data-hs3-tone]').press('End');
  await page.waitForFunction(() => document.querySelector('.hs3-stage')?.textContent?.includes('owes me rent'));
  ok(calls.length === 2 && calls[1].note_tone === 'hilarious', 'tone: hilarious rewrites from the same answers');
  ok((await page.locator('.hs3-tab.is-on').innerText()).includes('Mug') && (await page.locator('.hs3-tab.is-on').innerText()).includes("Buddy's pick"), 'tone: a rewrite cannot change the gift recommendation');
  await page.locator('[data-hs3-tone]').focus(); await page.locator('[data-hs3-tone]').press('ArrowLeft');
  ok(await page.locator('[data-hs3-tone]').inputValue() === '1' && calls.length === 2, 'tone: cached warm note returns without a third call');
  await tap(page, '[data-hs3="tab"][data-v="blanket"]');
  await page.waitForTimeout(3300);
  ok((await page.locator('.hs3-stage .hs3-line').count()) === 4, 'reveal: the blanket tab shows the same words, all four');
  await page.screenshot({ path: path.join(shots, '4-reveal-blanket.png') });
  await tap(page, '[data-hs3="edit"]');
  ok(await page.locator('[data-hs3-edit]').count() === 1, 'reveal: one sentence field at a time');
  await page.screenshot({ path: path.join(shots, '4a-reveal-edit.png') });
  await page.locator('[data-hs3-edit="home"]').fill('Will ride anywhere, as long as it\'s with you.');
  ok((await page.locator('[data-hs3-left="home"]').innerText()) === '15 characters left' && (await page.locator('[data-hs3-edit="home"]').inputValue()).length === 45, 'change a word: 60-character home limit');
  await tap(page, '[data-hs3="editNext"]');
  ok(await page.locator('[data-hs3-edit="spot"]').count() === 1 && await page.locator('[data-hs3-edit]').count() === 1, 'reveal: Next changes the single field');
  await tap(page, '[data-hs3="edit"]');
  await page.locator('[data-hs3-tone]').focus(); await page.locator('[data-hs3-tone]').press('End');
  ok((await page.locator('.hs3-stage').innerText()).includes("Will ride anywhere, as long as it's with you."), 'tone: changing it keeps the buyer-edited sentence');
  await tap(page, '[data-hs3="them"]');
  await tap(page, '[data-hs3="sel"][data-v="mug"]');
  const label = await page.locator('[data-hs3="add"]').innerText();
  ok(label === 'Personalize 2 gifts · $118', `choose: two gifts ("${label}")`);
  ok((await page.locator('.hs3-opts').innerText()).includes('$19'), 'choose: the ornament shows $19 with another gift (discount on)');
  await page.screenshot({ path: path.join(shots, '5-choose.png'), fullPage: true });
  await tap(page, '[data-hs3="add"]');
  await page.waitForURL(/\/products\/the-morning-mug\?view=gift/, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(800);
  const secs = (Date.now() - t0) / 1000;
  ok(secs < 90, `chips only to the first gift page in ${secs.toFixed(1)}s (under 90)`);
  const hs2 = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-review')));
  const q = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-queue') || '[]'));
  ok(hs2.dog === 'Kuku' && hs2.person === 'Sam', 'bridge: names handed to the product page');
  ok(hs2.hs3_lines.home === 'Will ride anywhere, as long as it\'s with you.' && hs2.hs3_kinds['the-morning-mug'] === 'mug', 'bridge: edited words and gift kinds handed over');
  ok(q.length === 2, 'bridge: both gifts queued for the next-gift bar');
  const props = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-hs2-prop]')].map((i) => [i.name, i.value])));
  ok(/Dog: Kuku/.test(props['properties[_hs_answers]'] || '') && /as long as it's with you/.test(props['properties[_hs_lines]'] || ''), 'order: _hs_answers and _hs_lines filled on the product form');
  ok(!('properties[_Manager]' in props), 'order: no v2 review properties on a v3 gift');
  ok(calls.length === 2 && !!calls[0].current_lines, `chips only made the initial compose and one requested tone call (${calls.length})`);
  ok(warms.length === 2 && warms[0].includes('typed-answer') && warms[1].includes('compose'), `a warm-up ping as the chat starts and one before compose (${warms.length})`);
  ok(!errors.length, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await ctx.close();
}

// 2. typed answers with the AI, follow-up, compose (spec 11.2)
{
  const { ctx, page, errors, calls } = await session('index-gifts.html');
  await tap(page, '[data-hs3-start]');
  await page.fill('#hs3-dog', 'Kuku'); await tap(page, '[data-hs3="next"]');
  await page.fill('#hs3-rec', 'Sam'); await tap(page, '[data-hs3="next"]');
  await tap(page, '[data-hs3="other"]');
  ok(await page.locator('.hs3-dock .hs3-privacy').isVisible(), 'something else: the AI privacy note shows');
  await page.screenshot({ path: path.join(shots, '6-something-else.png') });
  await page.fill('#hs3-typed', 'she sits in the window from 5pm');
  const t = Date.now();
  await tap(page, '[data-hs3="send"]');
  await page.waitForSelector('text=From 5pm sharp? Every day?', { timeout: 3500 });
  ok(Date.now() - t < 3200, `typed answer: reaction and line within 3s (${Date.now() - t}ms)`);
  ok((await noteLines(page))[0] === 'Watches the window for you from 5pm.', 'typed answer: the AI line inks');
  await chipNamed(page, 'Every single day');
  await page.waitForSelector('text=Where\'s Kuku\'s spot', { timeout: 3500 });
  ok((await noteLines(page))[0] === 'Watches the window for you from 5pm, daily.', 'follow-up: the line is refined');
  // grief is caught and the chips come back
  await tap(page, '[data-hs3="other"]');
  await page.fill('#hs3-typed', 'she passed away last spring'); await tap(page, '[data-hs3="send"]');
  await page.waitForSelector("text=I didn't quite catch that one. Try again, or pick one of these?", { timeout: 3500 });
  ok(await page.locator('[data-hs3="chip"]').count() === 4, 'grief: Buddy asks again and shows the chips');
  await chipNamed(page, "Sam's side of the bed");
  await chipNamed(page, 'Naps');
  await tap(page, '[data-hs3="skip"]');
  await tap(page, '[data-hs3="next"]');
  await page.waitForTimeout(3500);
  ok((await page.locator('.hs3-tab.is-on').innerText()).includes('Mug'), 'compose: the AI pick (mug) replaces the scripted one (naps = blanket)');
  ok((await page.locator('.hs3-says--reveal .hs3-bubble').innerText()).includes('The window watch starts at 5pm.'), 'compose: Buddy\'s reason from the AI');
  ok(calls.length === 4 && calls.every((c) => /^hs[0-9a-f]{24}$/.test(c.session)), `AI calls: ${calls.length} (typed, follow-up, grief, compose), each with the session id`);
  ok(!errors.length, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await ctx.close();
}

// 3. AI refused or slow: falls back cleanly (spec 11.2), and the all-"Not sure" path (11.4)
for (const mode of ['fail', 'slow']) {
  const { ctx, page, errors } = await session('index-gifts.html', { ai: mode });
  await tap(page, '[data-hs3-start]');
  await page.fill('#hs3-dog', 'Pip'); await page.locator('[data-hs3="pro"][data-v="he"]').click(); await tap(page, '[data-hs3="next"]');
  await page.fill('#hs3-rec', 'Jo'); await tap(page, '[data-hs3="next"]');
  await tap(page, '[data-hs3="other"]');
  await page.fill('#hs3-typed', 'he howls the moment my key turns in the lock');
  const t = Date.now();
  await tap(page, '[data-hs3="send"]');
  if (mode === 'slow') {
    await page.waitForTimeout(150);
    const first = (await noteLines(page))[0];
    ok(first === 'Howls the moment your key turns in the lock.', `while the AI writes, the buyer's own words ink at once, read like a chip line ("${first}")`);
  }
  await page.waitForSelector('text=Tell me more?', { timeout: 6500 });
  ok(Date.now() - t < 6500, `AI ${mode}: "Tell me more?" fallback in ${Date.now() - t}ms`);
  ok((await noteLines(page))[0] === 'Howls the moment your key turns in the lock.', `AI ${mode}: the buyer's own words become the line, read like a chip line ("${(await noteLines(page))[0]}")`);
  ok((await noteLines(page))[0].length <= 60, `AI ${mode}: own-words line fits 60 characters`);
  await tap(page, '[data-hs3="skip"]');
  await tap(page, '[data-hs3="skip"]'); await tap(page, '[data-hs3="skip"]'); await tap(page, '[data-hs3="skip"]');
  ok((await noteLines(page)).slice(1).join('|') === "I'm never far from you.|Any time with you is my favorite time.|I'm yours, always.", `AI ${mode}: "Not sure" uses the calm lines`);
  ok(!errors.length, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await ctx.close();
}
{
  const { ctx, page, events } = await session('index-gifts.html');
  await tap(page, '[data-hs3-start]');
  await page.fill('#hs3-dog', 'Moose'); await tap(page, '[data-hs3="next"]');
  await page.fill('#hs3-rec', 'Ana'); await tap(page, '[data-hs3="next"]');
  for (let i = 0; i < 4; i++) await tap(page, '[data-hs3="skip"]');
  ok((await noteLines(page)).join('|') === "Best part of my day? You walking in.|I'm never far from you.|Any time with you is my favorite time.|I'm yours, always.", 'all "Not sure": a warm, complete set of lines');
  await tap(page, '[data-hs3="next"]');
  await page.waitForTimeout(3300);
  await page.screenshot({ path: path.join(shots, '7-not-sure-reveal.png') });
  ok((await page.locator('.hs3-stage .hs3-line').count()) === 4, 'all "Not sure": the reveal shows four lines (anything else: the print)');
  await tap(page, '[data-hs3="them"]');
  await tap(page, '[data-hs3="toShare"]');
  await page.waitForSelector('.hs3-share__img', { timeout: 5000 });
  await page.screenshot({ path: path.join(shots, '8-share.png') });
  const dims = await page.evaluate(() => { const i = document.querySelector('.hs3-share__img'); return [i.naturalWidth, i.naturalHeight]; });
  ok(dims[0] === 1080 && dims[1] === 1920, 'share card: a 9:16 image to press and hold');
  const ev = await page.evaluate(() => (window.__ev || []).map((e) => e[0] + ':' + (e[1].step || '') + ':' + (e[1].action || '')));
  ok(ev.includes('hs3_step:home:shown') && ev.includes('hs3_step:home:skipped') && ev.includes('hs3_reveal::') && ev.includes('hs3_share_card::'), `step events published (${ev.length})`);
  const text = await page.evaluate(() => document.body.innerText);
  ok(!BANNED.test(text), 'no em dashes, banned words or HR copy on the page');
  await ctx.close();
}
// 3b. speed: a prepared follow-up chip is instant, and a pause while typing sends the answer early
{
  const { ctx, page, calls, errors } = await session('index-gifts.html', { ai: 'delay' });
  await tap(page, '[data-hs3-start]');
  await page.fill('#hs3-dog', 'Kuku'); await tap(page, '[data-hs3="next"]');
  await page.fill('#hs3-rec', 'Sam'); await tap(page, '[data-hs3="next"]');
  await tap(page, '[data-hs3="other"]');
  await page.locator('#hs3-typed').pressSequentially('she sits in the window from 5pm', { delay: 10 });
  await page.waitForTimeout(2000); // a buyer reading it back before pressing Done
  const t = Date.now();
  await tap(page, '[data-hs3="send"]');
  await page.waitForSelector('text=From 5pm sharp? Every day?', { timeout: 3500 });
  const took = Date.now() - t;
  ok(took < 400, `paused before Done: Buddy replies in ${took} ms (the AI takes 1200 ms here)`);
  ok(calls.length === 1, `the early call is reused, not repeated (${calls.length} call)`);
  const t2 = Date.now();
  await chipNamed(page, 'Weekdays');
  await page.waitForSelector("text=Where's Kuku's spot", { timeout: 1000 });
  ok(Date.now() - t2 < 400 && calls.length === 1, `a prepared follow-up chip is instant, with no second call (${Date.now() - t2} ms, ${calls.length} call)`);
  ok((await noteLines(page))[0] === 'Watches for you from 5pm on weekdays.' && (await bubble(page)).startsWith('Keeps office hours. Smart dog.'), 'the chip\'s prepared line and reply are used');
  ok(!errors.length, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await ctx.close();
}

// 4. products not created yet: the button says so instead of failing (today's live state)
{
  const { ctx, page } = await session('index-gifts-noproducts.html');
  await page.evaluate(() => sessionStorage.setItem('hs3-gift', JSON.stringify({ screen: 'choose', step: 6, dog: 'Kuku', rec: 'Sam', home: 'door', follow: 'weekends', spot: 'bed', together: 'walk', meaning: 'shadow', sel: { mug: true } })));
  await page.reload();
  ok(await page.locator('[data-hs3="add"]').isDisabled() && (await page.locator('.hs3-dock').innerText()).includes('The Morning Mug is not in the shop yet.'), 'no products yet: add is disabled and says why');
  ok(!(await page.locator('.hs3-opts').innerText()).includes('$19'), 'bundle off: no $19 ornament promise');
  await ctx.close();
}
// 5. narrow phone and the Instagram in-app height
// A new gift must not inherit a previous dog's photo, and a photo-free gift cannot
// be added with Teeinblue's sample dog in its place.
{
  const { ctx, page } = await session('index-gifts.html');
  await tap(page, '[data-hs3-start]');
  await page.fill('#hs3-dog', 'Pip');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lZkAAAAASUVORK5CYII=', 'base64');
  await page.locator('[data-hs3-file]').setInputFiles({ name: 'pip.png', mimeType: 'image/png', buffer: png });
  const prior = await page.evaluate(() => window.__hs3api.state());
  ok(prior.hasPhoto && prior.photoT > 0, 'photo: attachment belongs to this gift session');
  await page.goto(`${base}/index-gifts.html?hs3=reset`);
  const reset = await page.evaluate(() => window.__hs3api.state());
  const bridge = await page.evaluate(() => sessionStorage.getItem('hs2-review'));
  ok(!reset.hasPhoto && !reset.photoT && !bridge, 'new gift: old photo and bridge are cleared');
  await tap(page, '[data-hs3-start]');
  ok((await page.locator('.hs3-photo-pick').innerText()).includes('Add a photo'), 'new gift: asks for this dog’s photo');
  await page.goto(`${base}/product-gift.html`);
  ok(await page.locator('#buy [data-hs2-media][data-hs2-sample] .hs2-product__example').isVisible(), 'product: sample artwork is clearly labelled until the current dog photo is accepted');
  await page.evaluate(() => {
    const b = document.createElement('button'); b.id = 'teeAtcButton'; b.textContent = 'Add To Cart';
    b.addEventListener('click', () => { window.__testAdded = true; });
    document.querySelector('#buy').appendChild(b);
  });
  await page.locator('#teeAtcButton').click();
  ok(await page.locator('[data-hs2-photo-wait]').innerText() === "Add your dog's photo before adding this gift." && !(await page.evaluate(() => window.__testAdded)), 'product: no-photo order is blocked before Teeinblue can add its sample');
  await page.evaluate(() => {
    const field = document.createElement('div'); field.className = 'tee-field--photo';
    field.innerHTML = '<span>Choose another image</span><input type="file" id="tee-photo-test">';
    document.querySelector('#buy').appendChild(field);
  });
  await page.locator('#tee-photo-test').setInputFiles({ name: 'pip.png', mimeType: 'image/png', buffer: png });
  await page.waitForFunction(() => !document.querySelector('#buy [data-hs2-media]').hasAttribute('data-hs2-sample'));
  ok(!(await page.locator('#buy [data-hs2-media]').getAttribute('data-hs2-sample')), 'product: example label clears only after Teeinblue acknowledges this dog photo');
  await ctx.close();
}
for (const [w, h] of [[360, 740], [390, 664], [430, 932]]) {
  const { ctx, page } = await session('index-gifts.html', { width: w, height: h });
  await tap(page, '[data-hs3-start]');
  await page.fill('#hs3-dog', 'Bartholomew123'); await tap(page, '[data-hs3="next"]');
  await page.fill('#hs3-rec', 'Maximiliana12'); await tap(page, '[data-hs3="next"]');
  ok(await noOverflow(page), `${w}x${h}: chat has no sideways scroll with 14-character names`);
  await ctx.close();
}
// 6. one screen, no scroll (Krish, 21 Oct): every screen at every size fits the window, the
//    page can't scroll, and nothing has to shrink below 75%
{
  const done = { dog: 'Bartholomew', rec: 'Maximiliana', pro: 'she', rel: 'partner', home: 'door', follow: 'weekends', spot: 'bed', together: 'walk', meaning: 'shadow' };
  const states = {
    hero: { screen: 'hero' }, 'question 1': { screen: 'chat', step: 1 }, 'question 2': { ...done, home: null, follow: null, spot: null, together: null, meaning: null, screen: 'chat', step: 2 },
    'question 3': { ...done, home: null, follow: null, spot: null, together: null, meaning: null, screen: 'chat', step: 3 },
    'question 6': { ...done, meaning: null, screen: 'chat', step: 6 },
    'reveal mug': { ...done, screen: 'reveal', step: 7, gift: 'mug', tabbed: true }, 'reveal blanket': { ...done, screen: 'reveal', step: 7, gift: 'blanket', tabbed: true },
    'reveal print': { ...done, screen: 'reveal', step: 7, gift: 'print', tabbed: true }, 'reveal ornament': { ...done, screen: 'reveal', step: 7, gift: 'ornament', tabbed: true },
    'choose all four': { ...done, screen: 'choose', step: 7, sel: { mug: true, blanket: true, print: true, ornament: true } }, share: { ...done, screen: 'share', step: 7 },
  };
  for (const [w, h] of [[360, 640], [375, 667], [390, 664], [390, 844], [430, 932], [1280, 720], [1440, 900]]) {
    const { ctx, page } = await session('index-gifts.html', { width: w, height: h });
    const bad = [];
    let least = 1;
    for (const [name, st] of Object.entries(states)) {
      await page.evaluate((s) => sessionStorage.setItem('hs3-gift', JSON.stringify(s)), st);
      await page.reload(); await page.waitForTimeout(700);
      const m = await page.evaluate(() => {
        const f = document.querySelector('.hs3__frame'), r = f.getBoundingClientRect();
        window.scrollTo(0, 5000); const sy = window.scrollY; window.scrollTo(0, 0);
        return { sy, bottom: r.bottom, over: f.scrollHeight - f.clientHeight, z: +f.getAttribute('data-hs3-fit'), wide: document.documentElement.scrollWidth - innerWidth };
      });
      least = Math.min(least, m.z);
      if (m.sy > 0 || m.bottom > h + 1 || m.over > 1 || m.wide > 0 || m.z < 0.75) bad.push(`${name} (scroll ${m.sy}, bottom ${Math.round(m.bottom)}, over ${m.over}, zoom ${m.z})`);
    }
    ok(!bad.length, `${w}x${h}: every screen fits one screen with no scroll (smallest zoom ${least.toFixed(2)})${bad.length ? ': ' + bad.join('; ') : ''}`);
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
