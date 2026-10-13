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
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 350.0' });
  const page = await ctx.newPage();
  const events = [], errors = [], calls = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => { window.Shopify = { analytics: { publish: (n, d) => { (window.__ev = window.__ev || []).push([n, d]); } } }; });
  await page.route(/krishraja10101\.app\.n8n\.cloud/, async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    calls.push(body);
    if (ai === 'fail') return route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"origin"}' });
    if (ai === 'slow') { await new Promise((r) => setTimeout(r, 4000)); return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }).catch(() => {}); }
    if (route.request().url().includes('compose')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lines: { home: 'Watches the window for you from 5pm.', spot: body.current_lines.spot, together: body.current_lines.together, meaning: body.current_lines.meaning }, alternates: {}, recommended_gift: 'mug', reason: 'The window watch starts at 5pm. So Kuku gets a spot in your mug.', sources: {}, flags: [] }) });
    }
    if (/passed away/.test(body.typed_text)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reaction: "I didn't quite catch that one. Try again, or pick one of these?", line: '', follow_up: null, flags: ['grief'] }) });
    const fu = body.step === 'home' ? { question: 'From 5pm sharp? Every day?', chips: ['Every single day', 'Weekdays', 'Even weekends'] } : null;
    const line = body.step === 'home_follow' ? 'Watches the window for you from 5pm, daily.' : 'Watches the window for you from 5pm.';
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reaction: 'The window watch. Very serious work.', line, follow_up: fu, flags: [] }) });
  });
  await page.goto(`${base}/${name}`);
  return { ctx, page, events, errors, calls };
}
const tap = (page, sel) => page.locator(sel).first().click();
const chipNamed = (page, label) => page.locator('[data-hs3="chip"]', { hasText: label }).first().click();
const bubble = (page) => page.locator('.hs3-bubble').last().innerText();
const noteLines = (page) => page.locator('.hs3-note .hs3-line.hs3-ink').allInnerTexts();
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

// 1. chips only, two gifts, timed (spec 11.1)
{
  const { ctx, page, errors, calls } = await session('index-gifts.html');
  const t0 = Date.now();
  await page.screenshot({ path: path.join(shots, '0-home.png') });
  ok(await page.locator('.hs3-hero__h').innerText() === 'Your dog loves you too.', 'home: headline "Your dog loves you too."');
  ok(await noOverflow(page), 'home: no sideways scroll at 390px');
  await tap(page, '[data-hs3-start]');
  ok((await bubble(page)).includes("Hi! I'm Biscuit."), 'chat step 1: Biscuit greets');
  await page.fill('#hs3-dog', 'kuku');
  await tap(page, '[data-hs3="next"]');
  ok((await bubble(page)).startsWith('Kuku! Great name. My tail is going.'), 'step 2: reacts to the name, capitalised');
  await page.fill('#hs3-rec', 'Sam');
  await tap(page, '[data-hs3="next"]');
  ok((await bubble(page)).includes('What does Kuku do when Sam comes home?'), 'step 3: home question names both');
  await page.screenshot({ path: path.join(shots, '1-chat-step3.png') });
  await chipNamed(page, 'Waits at the door');
  ok((await noteLines(page))[0] === 'Waits at the door for you.', 'step 3: a first draft line inks straight away');
  await page.waitForSelector('text=At the door! Every day? Even weekends? (I would.)', { timeout: 3000 });
  await chipNamed(page, 'Even weekends');
  ok((await bubble(page)).startsWith("Weekends too. Now that's a good dog."), 'step 3b: follow-up reaction');
  await chipNamed(page, "Sam's side of the bed");
  await chipNamed(page, 'The morning walk');
  await chipNamed(page, "Sam's shadow");
  ok((await noteLines(page)).join('|') === "Waits at the door for you, weekends too.|Steals your side of the bed.|Lives for our morning walks.|Your shadow, always.", 'chat: four lines, word for word from the prototype');
  await page.screenshot({ path: path.join(shots, '2-chat-done.png') });
  await tap(page, '[data-hs3="next"]');
  await page.waitForTimeout(3300);
  await page.screenshot({ path: path.join(shots, '3-reveal-mug.png') });
  ok((await page.locator('.hs3-h2').innerText()) === "Kuku's gift for Sam", 'reveal: "Kuku\'s gift for Sam"');
  ok((await page.locator('.hs3-tab.is-on').innerText()).includes("Biscuit's pick") && (await page.locator('.hs3-tab.is-on').innerText()).includes('Mug'), 'reveal: walks pick the mug, marked Biscuit\'s pick');
  ok((await page.locator('.hs3-stage .hs3-line.hs3-ink').count()) === 3, 'reveal: three lines ink on the mug');
  await tap(page, '[data-hs3="tab"][data-v="blanket"]');
  await page.waitForTimeout(3300);
  ok((await page.locator('.hs3-stage .hs3-line').count()) === 4, 'reveal: the blanket tab shows the same words, all four');
  await page.screenshot({ path: path.join(shots, '4-reveal-blanket.png') });
  await tap(page, '[data-hs3="edit"]');
  await page.locator('[data-hs3-edit="home"]').fill('Waits at the door for you, every single day.');
  ok((await page.locator('[data-hs3-left="home"]').innerText()) === '0 characters left', 'change a word: 44-character count');
  await tap(page, '[data-hs3="edit"]');
  await tap(page, '[data-hs3="them"]');
  await tap(page, '[data-hs3="sel"][data-v="mug"]');
  const label = await page.locator('[data-hs3="add"]').innerText();
  ok(label === 'Add 2 gifts to cart · $118', `choose: two gifts ("${label}")`);
  ok(!(await page.locator('.hs3-opts').innerText()).includes('$19'), 'choose: no $19 ornament promise while the discount is off');
  await page.screenshot({ path: path.join(shots, '5-choose.png'), fullPage: true });
  await tap(page, '[data-hs3="add"]');
  await page.waitForURL(/\/products\/the-morning-mug\?view=gift/, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(800);
  const secs = (Date.now() - t0) / 1000;
  ok(secs < 90, `chips only to the first gift page in ${secs.toFixed(1)}s (under 90)`);
  const hs2 = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-review')));
  const q = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-queue') || '[]'));
  ok(hs2.dog === 'Kuku' && hs2.person === 'Sam', 'bridge: names handed to the product page');
  ok(hs2.hs3_lines.home === 'Waits at the door for you, every single day.' && hs2.hs3_kinds['the-morning-mug'] === 'mug', 'bridge: edited words and gift kinds handed over');
  ok(q.length === 2, 'bridge: both gifts queued for the next-gift bar');
  const props = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-hs2-prop]')].map((i) => [i.name, i.value])));
  ok(/Dog: Kuku/.test(props['properties[_hs_answers]'] || '') && /every single day/.test(props['properties[_hs_lines]'] || ''), 'order: _hs_answers and _hs_lines filled on the product form');
  ok(!('properties[_Manager]' in props), 'order: no v2 review properties on a v3 gift');
  ok(calls.length === 0, `chips only made no AI call (${calls.length})`);
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
  ok(await page.locator('[data-hs3="chip"]').count() === 4, 'grief: Biscuit asks again and shows the chips');
  await chipNamed(page, "Sam's side of the bed");
  await chipNamed(page, 'Naps');
  await tap(page, '[data-hs3="skip"]');
  await tap(page, '[data-hs3="next"]');
  await page.waitForTimeout(3500);
  ok((await page.locator('.hs3-tab.is-on').innerText()).includes('Mug'), 'compose: the AI pick (mug) replaces the scripted one (naps = blanket)');
  ok((await page.locator('.hs3-says--reveal .hs3-bubble').innerText()).includes('The window watch starts at 5pm.'), 'compose: Biscuit\'s reason from the AI');
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
  await page.waitForSelector('text=Tell me more?', { timeout: 4000 });
  ok(Date.now() - t < 3600, `AI ${mode}: "Tell me more?" fallback in ${Date.now() - t}ms`);
  ok((await noteLines(page))[0] === 'He howls the moment my key turns.', `AI ${mode}: the buyer's own words become the line ("${(await noteLines(page))[0]}")`);
  ok((await noteLines(page))[0].length <= 44, `AI ${mode}: own-words line fits 44 characters`);
  await tap(page, '[data-hs3="skip"]');
  await tap(page, '[data-hs3="skip"]'); await tap(page, '[data-hs3="skip"]'); await tap(page, '[data-hs3="skip"]');
  ok((await noteLines(page)).slice(1).join('|') === 'Never far from you.|Likes any time with you best.|Yours, always.', `AI ${mode}: "Not sure" uses the calm lines`);
  ok(!errors.length, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await ctx.close();
}
{
  const { ctx, page, events } = await session('index-gifts.html');
  await tap(page, '[data-hs3-start]');
  await page.fill('#hs3-dog', 'Moose'); await tap(page, '[data-hs3="next"]');
  await page.fill('#hs3-rec', 'Ana'); await tap(page, '[data-hs3="next"]');
  for (let i = 0; i < 4; i++) await tap(page, '[data-hs3="skip"]');
  ok((await noteLines(page)).join('|') === 'Always happy to see you.|Never far from you.|Likes any time with you best.|Yours, always.', 'all "Not sure": a warm, complete set of lines');
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
// 4. products not created yet: the button says so instead of failing (today's live state)
{
  const { ctx, page } = await session('index-gifts-noproducts.html');
  await page.evaluate(() => sessionStorage.setItem('hs3-gift', JSON.stringify({ screen: 'choose', step: 6, dog: 'Kuku', rec: 'Sam', home: 'door', follow: 'weekends', spot: 'bed', together: 'walk', meaning: 'shadow', sel: { mug: true } })));
  await page.reload();
  ok(await page.locator('[data-hs3="add"]').isDisabled() && (await page.locator('.hs3-dock').innerText()).includes('The Morning Mug is not in the shop yet.'), 'no products yet: add is disabled and says why');
  await ctx.close();
}
// 5. narrow phone and the Instagram in-app height
for (const [w, h] of [[360, 740], [390, 664], [430, 932]]) {
  const { ctx, page } = await session('index-gifts.html', { width: w, height: h });
  await tap(page, '[data-hs3-start]');
  await page.fill('#hs3-dog', 'Bartholomew123'); await tap(page, '[data-hs3="next"]');
  await page.fill('#hs3-rec', 'Maximiliana12'); await tap(page, '[data-hs3="next"]');
  ok(await noOverflow(page), `${w}x${h}: chat has no sideways scroll with 14-character names`);
  await ctx.close();
}
await browser.close();
server.close();
console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
