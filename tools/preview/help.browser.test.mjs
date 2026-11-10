// The help assistant in the corner (shopify/assets/hs-help.js, hs-help.css, snippets/hs-help.liquid; n8n/HELP-CHAT.md).
// A page with the brand layer, Buddy and the widget; the workflow is answered by a stub, so nothing is paid or sent.
// HS_HELP_SHOTS=<dir> also saves screenshots of the closed, open and handoff states.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const read = f => fs.readFileSync(new URL('../../shopify/' + f, import.meta.url), 'utf8');
const BRAND = read('assets/hs-brand.css'), CSS = read('assets/hs-help.css'), JS = read('assets/hs-help.js');
const AVATAR = 'data:image/svg+xml;base64,' + Buffer.from(read('assets/hs-help-agent.svg')).toString('base64');
const HOOK = 'https://help.test/webhook/heartside-help';
const SHOTS = process.env.HS_HELP_SHOTS || '';

const page = (extra = '') => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${BRAND}</style><style>${CSS}</style><style>body{margin:0;background:var(--hs-cream);font-family:var(--hs-sans)} main{padding:24px;height:1400px}</style></head>
<body><main><h1 style="font-family:var(--hs-serif)">Your dog loves you too.</h1><p>Heartside page body.</p></main>${extra}
<div class="hs-help" data-hs-help data-url="${HOOK}" data-avatar="${AVATAR}" hidden></div>
<script>${JS}</script></body></html>`;

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function open(viewport, extra, onPost) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 600, hasTouch: viewport.width < 600 });
  const p = await ctx.newPage();
  const calls = [];
  await p.route(HOOK, async r => {
    const body = JSON.parse(r.request().postData() || '{}');
    calls.push(body);
    const res = onPost ? onPost(body) : { reply: 'We ship to US addresses only.', chips: ['ship', 'xmas'], handoff: false };
    await r.fulfill({ status: res.status || 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(res) });
  });
  await p.route('https://heartside.test/', r => r.fulfill({ status: 200, contentType: 'text/html', body: page(extra) }));
  await p.goto('https://heartside.test/');
  await p.waitForSelector('.hs-help__launch');
  return { ctx, p, calls };
}
const shot = async (p, name) => { if (SHOTS) { await p.waitForTimeout(400); fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: `${SHOTS}/${name}.png` }); } };

test('the launcher sits bottom right, opens the panel with the greeting and one-tap chips', async () => {
  const { ctx, p } = await open({ width: 1280, height: 800 });
  const b = await p.locator('.hs-help__launch').boundingBox();
  assert.ok(b.x + b.width > 1280 - 40 && b.y + b.height > 800 - 40, 'bottom right');
  await shot(p, 'desktop-closed');
  await p.click('.hs-help__launch');
  await p.waitForSelector('.hs-help__panel:not([hidden])');
  assert.match(await p.textContent('.hs-help__log'), /I'm the help assistant/);
  assert.match(await p.textContent('.hs-help__sub'), /help assistant/, 'it says it is automated');
  assert.equal(await p.locator('.hs-help__head img').evaluate(i => i.complete && i.naturalWidth > 0), true, 'the avatar shows');
  const chips = await p.locator('.hs-help__chip').allTextContents();
  assert.ok(chips.includes('Talk to a person') && chips.includes('Christmas delivery') && chips.length >= 5, chips.join('|'));
  assert.equal(await p.getAttribute('.hs-help__launch', 'aria-expanded'), 'true');
  await shot(p, 'desktop-open');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('.hs-help__panel').isHidden(), true);
  await ctx.close();
});

test('a chip answers at once, with no call to the workflow', async () => {
  const { ctx, p, calls } = await open({ width: 1280, height: 800 });
  await p.click('.hs-help__launch');
  await p.click('.hs-help__chip[data-k="xmas"]');
  assert.match(await p.textContent('.hs-help__log'), /order by December 4/i);
  assert.equal(calls.length, 0);
  assert.ok(await p.locator('.hs-help__chip[data-k="person"]').count(), 'a person stays one tap away');
  await ctx.close();
});

test('a typed question goes to the workflow with the chat and comes back with chips', async () => {
  const { ctx, p, calls } = await open({ width: 1280, height: 800 });
  await p.click('.hs-help__launch');
  await p.fill('#hs-help-input', 'Do you ship to Canada?');
  await p.keyboard.press('Enter');
  await p.waitForSelector('.hs-help__msg--buddy:has-text("US addresses only")');
  assert.equal(calls[0].action, 'ask');
  assert.ok(calls[0].sid && calls[0].messages.at(-1).text === 'Do you ship to Canada?');
  const chips = await p.locator('.hs-help__chip').evaluateAll(n => n.map(x => x.dataset.k));
  assert.deepEqual(chips, ['ship', 'xmas', 'person']);
  await ctx.close();
});

test('asking for a person shows the email form; sending it promises a reply within 6 hours', async () => {
  const { ctx, p, calls } = await open({ width: 390, height: 844 }, '', b => b.action === 'handoff' ? { ok: true } : {});
  await p.click('.hs-help__launch');
  await p.fill('#hs-help-input', 'Can I talk to someone about my order?');
  await p.keyboard.press('Enter');
  await p.waitForSelector('.hs-help__handoff:not([hidden])');
  assert.equal(calls.length, 0, 'no AI call for a plain request for a person');
  await p.click('.hs-help__primary');
  assert.match(await p.textContent('.hs-help__error'), /does not look right/);
  await p.fill('.hs-help__handoff input[name=email]', 'pat@example.com');
  await p.fill('.hs-help__handoff input[name=name]', 'Pat Lee');
  await shot(p, 'phone-handoff');
  await p.click('.hs-help__primary');
  await p.waitForSelector('.hs-help__msg--buddy:has-text("within the next 6 hours")');
  assert.equal(calls[0].action, 'handoff');
  assert.equal(calls[0].email, 'pat@example.com');
  assert.ok(calls[0].messages.some(m => /talk to someone/.test(m.text)), 'the chat goes with it');
  assert.equal(await p.locator('.hs-help__handoff').isHidden(), true);
  await shot(p, 'phone-sent');
  await ctx.close();
});

test('a long chat offers the team after 8 questions', async () => {
  const { ctx, p, calls } = await open({ width: 1280, height: 800 });
  await p.click('.hs-help__launch');
  for (let i = 0; i < 8; i++) {
    await p.fill('#hs-help-input', 'Question number ' + (i + 1) + ' about mugs');
    await p.keyboard.press('Enter');
    if (i < 7) await p.waitForFunction(n => document.querySelectorAll('.hs-help__msg--buddy:not(.hs-help__typing)').length >= n, i + 2);
  }
  await p.waitForSelector('.hs-help__handoff:not([hidden])');
  assert.equal(calls.length, 7, 'the eighth goes to the team, not the AI');
  assert.match(await p.textContent('.hs-help__log'), /covered a lot/);
  await ctx.close();
});

test('a failed answer says so kindly and offers a person', async () => {
  const { ctx, p } = await open({ width: 1280, height: 800 }, '', () => ({ status: 500 }));
  await p.click('.hs-help__launch');
  await p.fill('#hs-help-input', 'What paper is the portrait on?');
  await p.keyboard.press('Enter');
  await p.waitForSelector('.hs-help__msg--buddy:has-text("a real person from the team can")');
  assert.ok(await p.locator('.hs-help__chip[data-k="person"]').count());
  await ctx.close();
});

test('it lifts above a bar pinned to the bottom, and the phone sheet fits a 320 px screen', async () => {
  const { ctx, p } = await open({ width: 320, height: 568 }, '<div class="hs2-next" style="position:fixed;left:12px;right:12px;bottom:12px;height:64px;background:#1e1714"></div>');
  await p.waitForFunction(() => parseInt(getComputedStyle(document.querySelector('.hs-help')).getPropertyValue('--hs-help-lift')) > 60);
  const bar = await p.locator('.hs2-next').boundingBox(), launch = await p.locator('.hs-help__launch').boundingBox();
  assert.ok(launch.y + launch.height <= bar.y, 'above the bar');
  await p.click('.hs-help__launch');
  const panel = await p.locator('.hs-help__panel').boundingBox();
  assert.ok(panel.x >= 0 && panel.width <= 320 && panel.y >= 0, JSON.stringify(panel));
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= 320), true, 'no sideways scroll');
  await shot(p, 'phone320-open');
  await ctx.close();
});

test('the chat stays with the buyer from page to page in one visit', async () => {
  const { ctx, p } = await open({ width: 1280, height: 800 });
  await p.click('.hs-help__launch');
  await p.click('.hs-help__chip[data-k="prices"]');
  await p.reload();
  await p.waitForSelector('.hs-help__panel:not([hidden])');
  assert.match(await p.textContent('.hs-help__log'), /Illustrated mug, \$45/);
  await ctx.close();
});
