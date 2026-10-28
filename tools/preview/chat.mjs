// The gift chat on the homepage (templates/index.json: sections/hs3-chat.liquid, assets/hs3.js),
// driven on a phone-sized page against today's catalog: the illustrated mug ($45), the portrait
// ($59 unframed, $119 framed) and the word-free blanket ($129), each opening its own native
// product template. Run after render.mjs:   cd tools/preview && node chat.mjs
// Every request to the n8n host is answered by a stub here (AI answers, a slow answer and a
// refusal), and any other request that would leave this machine is refused, so the test never
// spends a call; the live webhooks have their own check in n8n/README.md.
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

// today's catalog, as render.mjs mocks it from the public store
const MUG = 'your-dogs-illustrated-mug', PORTRAIT = 'your-dogs-portrait', BLANKET = 'your-dogs-personality-blanket';
const PAGE_FOR = { [MUG]: 'product-mug-native.html', [PORTRAIT]: 'product-portrait-native.html', [BLANKET]: 'product-blanket-native.html' };
const RETIRED = /The Morning Mug|The Couch Blanket|The Framed Print|The Tree Ornament|Annual Review|Body Double|\bUniform\b|\$(?:29|89|24|39)\b(?!\.\d)|\bBiscuit\b|your dog has notes/i;
const BANNED = /—|\belevate|\bunleash|must-have|game-changer|fur baby|area for improvement|known enemy|HR\b|!(?=\s|$)/i;

// out/ as a shop: /products/<handle> opens its default template, the native one, and
// ?view=<suffix> opens that template when render.mjs wrote it
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__blank') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<!doctype html><title>blank</title>'); return; }
  let f = path.join(out, decodeURIComponent(u.pathname));
  if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', u.pathname.split('/assets/')[1]);
  else if (u.pathname.startsWith('/products/')) {
    const view = u.searchParams.get('view');
    f = path.join(out, view && fs.existsSync(path.join(out, `product-${view}.html`)) ? `product-${view}.html` : PAGE_FOR[u.pathname.split('/')[2]] || 'missing');
  }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  const type = f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.svg') ? 'image/svg+xml' : f.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--disable-background-networking'] });

async function session(name, { ai = 'ok', width = 390, height = 844 } = {}) {
  const mode = ai;
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 350.0' });
  const page = await ctx.newPage();
  const events = [], errors = [], calls = [], warms = [], external = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => { window.Shopify = { analytics: { publish: (n, d) => { (window.__ev = window.__ev || []).push([n, d]); } } }; });
  // nothing leaves this machine: the n8n host gets the stub below, anything else is refused
  await page.route((url) => !url.href.startsWith(base) && !/n8n/i.test(url.href) && !/^(data|blob):/.test(url.href), (route) => { external.push(route.request().url()); return route.abort(); });
  await page.route(/n8n/i, async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST' } });
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.warm) { warms.push(route.request().url()); return route.fulfill({ status: 200, contentType: 'application/json', body: '{"warm":true}' }); }
    calls.push(body);
    if (ai === 'fail') return route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"origin"}' });
    if (ai === 'slow') { await new Promise((r) => setTimeout(r, 4000)); return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }).catch(() => {}); }
    if (route.request().url().includes('compose')) {
      const cur = body.current_lines || {};
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lines: { home: body.note_tone === 'hilarious' ? 'I guard the window like it owes me rent.' : 'Watches the window for you from 5pm.', spot: cur.spot, together: cur.together, meaning: cur.meaning }, alternates: {}, recommended_gift: body.note_tone === 'hilarious' ? 'blanket' : ((body.answers || []).some((a) => a.typed) ? 'mug' : body.default_gift), reason: 'The window watch starts at 5pm. So Kuku gets a spot in your mug.', sources: {}, flags: [] }) });
    }
    if (/passed away/.test(body.typed_text)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reaction: "I didn't quite catch that one. Try again, or pick one of these?", line: '', follow_up: null, flags: ['grief'] }) });
    const fu = body.step === 'home' ? { question: 'From 5pm sharp? Every day?', chips: ['Every single day', 'Weekdays', 'Even weekends'], lines: [null, 'Watches for you from 5pm on weekdays.', 'Watches for you from 5pm, weekends too.'], replies: [null, 'Keeps a strict schedule. Smart dog.', 'Weekends too. Very loyal.'] } : null;
    if (mode === 'delay') await new Promise((r) => setTimeout(r, 1200));
    const line = body.step === 'home_follow' ? 'Watches the window for you from 5pm, daily.' : 'Watches the window for you from 5pm.';
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reaction: 'The window watch. Very serious work.', line, follow_up: fu, flags: [] }) });
  });
  await page.goto(`${base}/${name}`);
  return { ctx, page, events, errors, calls, warms, external };
}
const tap = (page, sel) => page.locator(sel).first().click();
const chipNamed = (page, label) => page.locator('[data-hs3="chip"]', { hasText: label }).first().click();
// a chip by its answer id, waiting for it the way a buyer waits out Buddy's pause
const chipId = (page, id) => page.locator(`[data-hs3="chip"][data-v="${id}"]`).first().click({ timeout: 5000 });
const bubble = (page) => page.locator('.hs3-bubble').last().innerText();
const lineFor = (page, key) => page.evaluate((k) => window.__hs3api.lineFor(k), key);
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const pageText = (page) => page.evaluate(() => document.body.innerText);
// open a page with a saved chat state; the state is written from a blank page of the same
// origin, so no Heartside script is running to save its own state over it on the way out
async function withState(page, state, file) {
  await page.goto(`${base}/__blank`);
  await page.evaluate((st) => sessionStorage.setItem('hs3-gift', JSON.stringify(st)), state);
  await page.goto(`${base}/${file}`);
}
const chosen = (page) => page.evaluate(() => [...document.querySelectorAll('[data-hs3="sel"][aria-pressed="true"]')].map((b) => b.getAttribute('data-v')));
// pick exactly these gifts on the choose screen
async function pickOnly(page, keys) {
  for (const k of ['mug', 'blanket', 'print']) {
    const on = (await chosen(page)).includes(k);
    if (on !== keys.includes(k) && await page.locator(`[data-hs3="sel"][data-v="${k}"]`).count()) await tap(page, `[data-hs3="sel"][data-v="${k}"]`);
  }
}

// 1. the first screen: today's three gifts at today's prices, nothing retired
{
  const { ctx, page, errors, external } = await session('index.html');
  await page.screenshot({ path: path.join(shots, '0-home.png') });
  ok(await page.locator('.hs3-hero__h').innerText() === 'Your dog loves you too.', 'home: headline "Your dog loves you too."');
  ok(await noOverflow(page), 'home: no sideways scroll at 390px');
  const text = await pageText(page);
  if (await page.locator('.hs3-fan').count()) {
    const fan = (await page.locator('.hs3-fan').innerText()).replace(/\s+/g, ' ');
    ok(/Mug \$45\b/.test(fan) && /Portrait From \$59\b/i.test(fan) && /Blanket \$129\b/.test(fan), `home: the three gifts at today's prices ("${fan}")`);
    ok(!(await page.evaluate(() => [...document.querySelectorAll('.hs3-fan img')].some((i) => !i.getAttribute('src') || i.getAttribute('src') === 'undefined'))), 'home: every gift in the fan has a picture');
  }
  ok(!RETIRED.test(text), `home: no retired product names or prices${RETIRED.test(text) ? ` ("${text.match(RETIRED)[0]}")` : ''}`);
  ok(!errors.length && !external.length, 'home: no script errors and nothing leaves the machine' + (errors.length ? ': ' + errors.join(' | ') : '') + (external.length ? ': ' + external.join(' | ') : ''));
  await ctx.close();
}

// 2. chips only, through the reveal and the choice, to the mug's own page (spec 11.1, timed)
{
  const { ctx, page, errors, calls, warms, external } = await session('index.html');
  const t0 = Date.now();
  await tap(page, '[data-hs3-start]');
  ok((await bubble(page)).includes("I'm Buddy"), 'chat step 1: Buddy greets');
  await page.fill('#hs3-dog', 'kuku');
  await tap(page, '[data-hs3="next"]');
  ok((await bubble(page)).startsWith('Kuku'), 'step 2: reacts to the name, capitalised');
  await page.fill('#hs3-rec', 'Sam');
  await tap(page, '[data-hs3="next"]');
  const q3 = await bubble(page);
  ok(q3.includes('Kuku') && q3.includes('Sam'), 'step 3: the home question names both');
  await page.screenshot({ path: path.join(shots, '1-chat-step3.png') });
  await chipId(page, 'door');
  ok(!!(await lineFor(page, 'home')), 'step 3: a chip answer becomes a line straight away');
  await chipId(page, 'weekends'); // Buddy's follow-up, after his pause
  ok((await lineFor(page, 'home')) !== null && /weekends/i.test(await lineFor(page, 'home')), 'step 3b: the follow-up refines the line');
  await chipId(page, 'bed');
  await chipId(page, 'walk');
  await chipId(page, 'shadow');
  await page.screenshot({ path: path.join(shots, '2-chat-done.png') });
  ok(await page.locator('.hs3-note .hs3-line.hs3-ink').count() >= 1, 'chat: the note inks in the dog\'s own voice');
  await tap(page, '[data-hs3="next"]');
  await page.waitForSelector('[data-hs3="tab"]', { timeout: 6000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(shots, '3-reveal.png') });
  const h2 = await page.locator('.hs3-h2').innerText();
  ok(h2.includes('Kuku') && h2.includes('Sam'), `reveal: names the dog and the person ("${h2}")`);
  const tabs = await page.locator('[data-hs3="tab"]').evaluateAll((b) => b.map((x) => x.getAttribute('data-v')));
  ok(tabs.join(',') === 'mug,blanket,print', `reveal: today's three gifts, no ornament (${tabs.join(', ')})`);
  ok((await page.locator('.hs3-tab.is-on').count()) === 1, 'reveal: one gift on show, Buddy\'s pick');
  await tap(page, '[data-hs3="them"]');
  await page.waitForSelector('[data-hs3="sel"]');
  const opts = await page.locator('[data-hs3="sel"]').evaluateAll((b) => b.map((x) => [x.getAttribute('data-v'), x.innerText.replace(/\s+/g, ' ')]));
  const optText = Object.fromEntries(opts);
  ok(opts.map((o) => o[0]).join(',') === 'mug,blanket,print', `choose: the mug, the blanket and the portrait (${opts.map((o) => o[0]).join(', ')})`);
  ok(/\$45\b/.test(optText.mug || '') && /\$129\b/.test(optText.blanket || '') && /\$59\b/.test(optText.print || '') && /\$119\b/.test(optText.print || ''), `choose: today's prices on each gift (${opts.map((o) => o[1]).join(' | ')})`);
  await pickOnly(page, ['mug']);
  const one = await page.locator('[data-hs3="add"]').innerText();
  ok(/mug/i.test(one) && /\$45\b/.test(one), `choose: one gift, the mug at $45 ("${one}")`);
  await pickOnly(page, ['mug', 'print']);
  const two = await page.locator('[data-hs3="add"]').innerText();
  ok(/2 gifts/.test(two) && /\$104\b/.test(two), `choose: two gifts from $104, the mug plus the unframed portrait ("${two}")`);
  ok(!RETIRED.test(await pageText(page)), 'choose: no retired product names or prices');
  await page.screenshot({ path: path.join(shots, '5-choose.png'), fullPage: true });
  await tap(page, '[data-hs3="add"]');
  await page.waitForURL(new RegExp(`/products/${MUG}`), { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(800);
  const secs = (Date.now() - t0) / 1000;
  ok(secs < 90, `chips only to the first gift page in ${secs.toFixed(1)}s (under 90)`);
  const at = new URL(page.url());
  ok(!at.searchParams.has('view'), `gift page: the mug opens its own default template, no ?view= (${at.pathname}${at.search})`);
  ok(/^\d+$/.test(at.searchParams.get('variant') || ''), 'gift page: the mug color chosen in the chat rides along as ?variant=');
  ok(await page.locator('#buy h1').innerText() === "Your Dog's Illustrated Mug" && (await page.locator('#buy [data-hs2-price]').innerText()).trim() === '$45.00', 'gift page: "Your Dog\'s Illustrated Mug" at $45.00');
  const hs2 = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-review') || '{}'));
  const queue = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-queue') || '[]'));
  ok(hs2.dog === 'Kuku' && hs2.person === 'Sam', 'bridge: names handed to the product page');
  ok(queue.length === 2 && queue[0].url.startsWith(`/products/${MUG}`) && queue[1].url.startsWith(`/products/${PORTRAIT}`), `bridge: both gifts queued by today's handles (${queue.map((q) => q.url).join(', ')})`);
  ok(queue.every((q) => !RETIRED.test(q.title || '')), `bridge: the queue names today's gifts (${queue.map((q) => q.title).join(', ')})`);
  ok(calls.length <= 1, `chips only made at most the compose call (${calls.length})`);
  ok(warms.every((u) => /n8n/i.test(u)) && !external.length, `AI warm-ups went only to the stub (${warms.length}) and nothing else left the machine`);
  ok(!errors.length, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await ctx.close();
}

// 3. typed answers with the AI, follow-up, compose (spec 11.2)
{
  const { ctx, page, errors, calls } = await session('index.html');
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
  ok(await lineFor(page, 'home') === 'Watches the window for you from 5pm.', 'typed answer: the AI line is the home line');
  await chipNamed(page, 'Every single day');
  await page.waitForSelector('text=Where\'s Kuku\'s spot', { timeout: 3500 });
  ok(await lineFor(page, 'home') === 'Watches the window for you from 5pm, daily.', 'follow-up: the line is refined');
  // grief is caught and the chips come back
  await tap(page, '[data-hs3="other"]');
  await page.fill('#hs3-typed', 'she passed away last spring'); await tap(page, '[data-hs3="send"]');
  await page.waitForSelector("text=I didn't quite catch that one. Try again, or pick one of these?", { timeout: 3500 });
  ok(await page.locator('[data-hs3="chip"]').count() === 4, 'grief: Buddy asks again and shows the chips');
  await chipNamed(page, "Sam's side of the bed");
  await chipNamed(page, 'Naps');
  await tap(page, '[data-hs3="skip"]');
  await tap(page, '[data-hs3="next"]');
  await page.waitForSelector('[data-hs3="tab"]', { timeout: 6000 });
  await page.waitForTimeout(1500);
  ok((await page.locator('.hs3-tab.is-on').getAttribute('data-v')) === 'mug', 'compose: the AI pick (mug) replaces the scripted one (naps = blanket)');
  ok((await page.locator('.hs3-frame, .hs3__frame').first().innerText()).includes('The window watch starts at 5pm.'), 'compose: Buddy\'s reason from the AI');
  ok(calls.length >= 3 && calls.every((c) => /^hs[0-9a-f]{24}$/.test(c.session)), `AI calls: ${calls.length} (typed, follow-up, grief, compose), each with the session id`);
  ok(!errors.length, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await ctx.close();
}

// 4. AI refused or slow: falls back cleanly (spec 11.2), and the all-"Not sure" path (11.4)
for (const mode of ['fail', 'slow']) {
  const { ctx, page, errors } = await session('index.html', { ai: mode });
  await tap(page, '[data-hs3-start]');
  await page.fill('#hs3-dog', 'Pip'); await page.locator('[data-hs3="pro"][data-v="he"]').click(); await tap(page, '[data-hs3="next"]');
  await page.fill('#hs3-rec', 'Jo'); await tap(page, '[data-hs3="next"]');
  await tap(page, '[data-hs3="other"]');
  await page.fill('#hs3-typed', 'he howls the moment my key turns in the lock');
  const t = Date.now();
  await tap(page, '[data-hs3="send"]');
  if (mode === 'slow') {
    // the note shows only the meaning line in the artwork flow, so Buddy's own pause is the feedback
    await page.waitForTimeout(150);
    ok(await page.locator('.hs3-bubble[aria-label="Buddy is sniffing around"]').count() === 1, 'while the AI writes, Buddy shows he is thinking');
  }
  await page.waitForSelector('text=Tell me more?', { timeout: 6500 });
  ok(Date.now() - t < 6500, `AI ${mode}: "Tell me more?" fallback in ${Date.now() - t}ms`);
  const own = await lineFor(page, 'home');
  ok(own === 'Howls the moment your key turns in the lock.', `AI ${mode}: the buyer's own words become the line, read like a chip line ("${own}")`);
  ok(own.length <= 60, `AI ${mode}: own-words line fits 60 characters`);
  for (let i = 0; i < 4; i++) await tap(page, '[data-hs3="skip"]');
  const calm = [await lineFor(page, 'spot'), await lineFor(page, 'together'), await lineFor(page, 'meaning')];
  ok(calm.every((l) => l && !RETIRED.test(l) && !BANNED.test(l)), `AI ${mode}: "Not sure" uses the calm lines (${calm.join(' | ')})`);
  ok(!errors.length, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await ctx.close();
}
{
  const { ctx, page } = await session('index.html');
  await tap(page, '[data-hs3-start]');
  await page.fill('#hs3-dog', 'Moose'); await tap(page, '[data-hs3="next"]');
  await page.fill('#hs3-rec', 'Ana'); await tap(page, '[data-hs3="next"]');
  for (let i = 0; i < 4; i++) await tap(page, '[data-hs3="skip"]');
  const lines = [];
  for (const k of ['home', 'spot', 'together', 'meaning']) lines.push(await lineFor(page, k));
  ok(lines.every(Boolean), `all "Not sure": a warm, complete set of lines (${lines.join(' | ')})`);
  await tap(page, '[data-hs3="next"]');
  await page.waitForSelector('[data-hs3="tab"]', { timeout: 6000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(shots, '7-not-sure-reveal.png') });
  await tap(page, '[data-hs3="them"]');
  await tap(page, '[data-hs3="toShare"]');
  await page.waitForSelector('.hs3-share__img', { timeout: 5000 });
  await page.screenshot({ path: path.join(shots, '8-share.png') });
  const dims = await page.evaluate(() => { const i = document.querySelector('.hs3-share__img'); return [i.naturalWidth, i.naturalHeight]; });
  ok(dims[0] === 1080 && dims[1] === 1920, 'share card: a 9:16 image to press and hold');
  const ev = await page.evaluate(() => (window.__ev || []).map((e) => e[0] + ':' + (e[1].step || '') + ':' + (e[1].action || '')));
  ok(ev.includes('hs3_step:home:shown') && ev.includes('hs3_step:home:skipped') && ev.includes('hs3_reveal::') && ev.includes('hs3_share_card::'), `step events published (${ev.length})`);
  const text = await pageText(page);
  ok(!BANNED.test(text) && !RETIRED.test(text), `no em dashes, exclamations, banned words or retired names on the page${BANNED.test(text) ? ` ("${text.match(BANNED)[0]}")` : ''}${RETIRED.test(text) ? ` ("${text.match(RETIRED)[0]}")` : ''}`);
  await ctx.close();
}
// 4b. speed: a prepared follow-up chip is instant, and a pause while typing sends the answer early
{
  const { ctx, page, calls, errors } = await session('index.html', { ai: 'delay' });
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
  const _l = await lineFor(page, 'home'), _b = await bubble(page);
  ok(_l === 'Watches for you from 5pm on weekdays.' && _b.startsWith('Keeps a strict schedule. Smart dog.'), 'the chip\'s prepared line and reply are used (' + _l + ' / ' + _b + ')');
  ok(!errors.length, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await ctx.close();
}

// 5. products not picked in the section: the button says which gift is missing instead of failing
{
  const { ctx, page } = await session('index-noproducts.html');
  await withState(page, { screen: 'choose', step: 7, dog: 'Kuku', rec: 'Sam', home: 'door', follow: 'weekends', spot: 'bed', together: 'walk', meaning: 'shadow', sel: { mug: true } }, 'index-noproducts.html?step=choose');
  await page.waitForSelector('[data-hs3="add"]', { timeout: 5000 });
  const dock = await page.locator('.hs3-dock').innerText();
  ok(await page.locator('[data-hs3="add"]').isDisabled() && /not in the shop yet/.test(dock), `no products yet: add is disabled and says why ("${dock.replace(/\s+/g, ' ').slice(0, 120)}")`);
  ok(!RETIRED.test(dock), 'no products yet: the missing gift is named by today\'s name');
  await ctx.close();
}
// 6. a new gift must not inherit a previous dog's photo, and the native page will not order
//    without the buyer's own finished artwork
{
  const { ctx, page } = await session('index.html');
  await tap(page, '[data-hs3-start]');
  await page.fill('#hs3-dog', 'Pip');
  // a real dog photo, big and sharp enough for the on-device photo check (hs-photo-quality.js)
  await page.locator('[data-hs3-file]').setInputFiles(path.join(here, '..', '..', 'assets', 'photos', 'pug-autumn-leaves.jpg'));
  await page.waitForFunction(() => window.__hs3api.state().hasPhoto, null, { timeout: 15000 }).catch(() => {});
  const prior = await page.evaluate(() => window.__hs3api.state());
  ok(prior.hasPhoto && prior.photoT > 0, 'photo: attachment belongs to this gift session');
  await page.goto(`${base}/index.html?hs3=reset`);
  const reset = await page.evaluate(() => window.__hs3api.state());
  const bridge = await page.evaluate(() => sessionStorage.getItem('hs2-review'));
  ok(!reset.hasPhoto && !reset.photoT && !bridge, 'new gift: old photo and bridge are cleared');
  await tap(page, '[data-hs3-start]');
  ok((await page.locator('.hs3-photo-pick').innerText()).includes('Add a photo'), 'new gift: asks for this dog\'s photo');
  for (const handle of [MUG, PORTRAIT, BLANKET]) {
    await page.goto(`${base}/products/${handle}`);
    await page.waitForTimeout(600);
    await page.evaluate(() => { const b = document.querySelector('#teeAtcButton'); if (b) b.addEventListener('click', () => { window.__testAdded = true; }); });
    ok(await page.locator('#teeAtcButton').count() === 1, `${handle}: Teeinblue's Add to cart is on the page`);
    await page.locator('#teeAtcButton').click();
    const status = (await page.locator('[data-hs2-artwork-status]').first().innerText().catch(() => '')).trim();
    ok(!(await page.evaluate(() => window.__testAdded)) && !!status, `${handle}: no order without finished artwork, and the page says why ("${status}")`);
  }
  await ctx.close();
}
// 7. narrow phones and the Instagram in-app height, with long names
for (const [w, h] of [[360, 740], [390, 664], [430, 932]]) {
  const { ctx, page } = await session('index.html', { width: w, height: h });
  await tap(page, '[data-hs3-start]');
  await page.fill('#hs3-dog', 'Bartholomew123'); await tap(page, '[data-hs3="next"]');
  await page.fill('#hs3-rec', 'Maximiliana12'); await tap(page, '[data-hs3="next"]');
  ok(await noOverflow(page), `${w}x${h}: chat has no sideways scroll with 14-character names`);
  await ctx.close();
}
// 8. every screen at every size: nothing sideways, and nothing cut off where the page can't scroll
{
  const done = { dog: 'Bartholomew', rec: 'Maximiliana', pro: 'she', rel: 'partner', home: 'door', follow: 'weekends', spot: 'bed', together: 'walk', meaning: 'shadow' };
  const blankAnswers = { home: null, follow: null, spot: null, together: null, meaning: null };
  // name: [saved answers, ?step=, the screen it must land on]
  const routes = {
    hero: [{}, '', 'hero'], 'question 1': [{}, 'dog', 'chat'], 'question 2': [{ ...done, ...blankAnswers }, 'person', 'chat'], 'question 3': [{ ...done, ...blankAnswers }, 'home', 'chat'],
    'question 6': [{ ...done, meaning: null }, 'meaning', 'chat'], 'reveal mug': [done, 'gift-mug', 'reveal'], 'reveal blanket': [done, 'gift-blanket', 'reveal'], 'reveal portrait': [done, 'gift-portrait', 'reveal'],
    'choose all three': [{ ...done, sel: { mug: true, blanket: true, print: true } }, 'choose', 'choose'], share: [done, 'card', 'share'],
  };
  for (const [w, h] of [[360, 640], [375, 667], [390, 664], [390, 844], [430, 932], [1280, 720], [1440, 900]]) {
    const { ctx, page } = await session('index.html', { width: w, height: h });
    const bad = [];
    for (const [name, [st, step, screen]] of Object.entries(routes)) {
      await withState(page, st, `index.html${step ? `?step=${step}` : ''}`); await page.waitForTimeout(600);
      const m = await page.evaluate(() => {
        const f = document.querySelector('.hs3__frame'), r = f.getBoundingClientRect();
        const locked = ['overflow', 'overflowY'].some((p) => getComputedStyle(document.documentElement)[p] === 'hidden' || getComputedStyle(document.body)[p] === 'hidden');
        return { screen: f.getAttribute('data-hs3-screen'), locked, bottom: r.bottom, wide: document.documentElement.scrollWidth - innerWidth };
      });
      if (m.screen !== screen) bad.push(`${name} (landed on ${m.screen})`);
      if (m.wide > 0) bad.push(`${name} (${m.wide}px sideways)`);
      if (m.locked && m.bottom > h + 1) bad.push(`${name} (cut off at ${Math.round(m.bottom)}px in a page that can't scroll)`);
      // the layout (28 Oct): the primary in the first screen, labels and names on one line, nothing
      // overlapping, the top bar centered (tools/preview/hs3-layout.test.mjs has the full set)
      bad.push(...(await page.evaluate(([name, phone]) => {
        const out = [], q = (s) => document.querySelector(s), all = (s) => [...document.querySelectorAll(s)], r = (el) => el.getBoundingClientRect();
        const lines = (el) => { const tops = new Set(); const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); for (let n; (n = walk.nextNode());) { const g = document.createRange(); g.selectNodeContents(n); for (const x of g.getClientRects()) if (x.width) tops.add(Math.round(x.top / 6)); } return tops.size; };
        const overlap = (a, b) => { const p = r(a), o = r(b); return Math.max(0, Math.min(p.right, o.right) - Math.max(p.left, o.left)) * Math.max(0, Math.min(p.bottom, o.bottom) - Math.max(p.top, o.top)); };
        const inView = (el) => el && r(el).bottom <= innerHeight + 1;
        if (name === 'hero' && !inView(q('[data-hs3-start]'))) out.push('hero: Start with your dog below the first screen');
        if (/^question [12]$/.test(name) && phone) {
          const note = q('.hs3-note-wrap');
          if (note && note.getClientRects().length) out.push(`${name}: the writing peek shows before step 3`);
          if (!inView(q('[data-hs3="next"]'))) out.push(`${name}: Next below the first screen`);
        }
        if (name.startsWith('reveal')) {
          const tabs = q('.hs3-tabs'), last = all('.hs3-tab').pop(), stamp = q('.hs3-product > .hs3-example'), label = q('.hs3-inset__label'), note = q('.hs3-note--print');
          if (Math.abs(r(tabs).right - parseFloat(getComputedStyle(tabs).paddingRight) - r(last).right) > 1) out.push(`${name}: the tabs stop short of the row`);
          if (all('.hs3-tab__tag').some((t) => lines(t) !== 1)) out.push(`${name}: a tab's price wraps`);
          if (stamp && overlap(stamp, tabs) > 1) out.push(`${name}: the Example stamp runs into the tabs`);
          if (label && note && overlap(label, note) > 1) out.push(`${name}: "Your photo" runs into the note`);
          const top = r(q('.hs3-top')), mid = r(q('.hs3-top > :nth-child(2)'));
          if (Math.abs((mid.left + mid.right) / 2 - (top.left + top.right) / 2) > 1) out.push(`${name}: the top bar's label is off center`);
        }
        if (name.startsWith('choose')) {
          for (const o of all('.hs3-opt')) {
            const nm = o.querySelector('.hs3-opt__name'), price = o.querySelector('.hs3-opt__price');
            if (lines(nm) !== 1) out.push(`${name}: "${nm.textContent}" wraps`);
            if (r(nm).right > r(price).left + 0.5) out.push(`${name}: "${nm.textContent}" runs under its price`);
          }
          if (phone && !inView(q('[data-hs3="add"]'))) out.push(`${name}: the button is below the first screen`);
        }
        return out;
      }, [name, w < 1000])));
    }
    ok(!bad.length, `${w}x${h}: every screen fits sideways and nothing is cut off out of reach${bad.length ? ': ' + bad.join('; ') : ''}`);
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
