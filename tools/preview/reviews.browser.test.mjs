// What people say (shopify/sections/hs-reviews.liquid, assets/hs-reviews.js, hs-reviews.css), rendered from the
// homepage's own blocks (templates/index.json) with Shopify's filters stood in.
// HS_REVIEWS_SHOTS=<dir> also saves desktop and phone screenshots.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Liquid } from 'liquidjs';
import { chromium } from 'playwright';

const read = f => fs.readFileSync(new URL('../../shopify/' + f, import.meta.url), 'utf8');
const SHOTS = process.env.HS_REVIEWS_SHOTS || '';
const tpl = JSON.parse(read('templates/index.json').replace(/^\s*\/\*[\s\S]*?\*\//, ''));
const sec = tpl.sections.reviews;
const blocks = sec.block_order.map(k => ({ settings: sec.blocks[k].settings, shopify_attributes: '' }));
const engine = new Liquid();
engine.registerFilter('asset_url', v => 'asset:' + v);
engine.registerFilter('stylesheet_tag', () => '');
const html = (await engine.parseAndRender(read('sections/hs-reviews.liquid').split('{% schema %}')[0], { section: { settings: sec.settings, blocks } }))
  .replace(/<script src="asset:hs-reviews.js"[^>]*><\/script>/, '');
const page = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${read('assets/hs-brand.css')}</style><style>${read('assets/hs-reviews.css')}</style><style>body{margin:0;background:var(--hs-cream)}</style></head><body>${html}<script>${read('assets/hs-reviews.js')}</script></body></html>`;

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });
async function open(viewport, opts = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion: opts.reduce ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  await p.clock.install();
  await p.setContent(page);
  return { ctx, p };
}
const at = p => p.evaluate(() => document.querySelector('[data-hsr]').__hsrApi.index());

test('the homepage carries the nine quotes, word for word, under the showcase', () => {
  assert.deepEqual(tpl.order.slice(-2), ['showcase', 'reviews']);
  assert.equal(blocks.length, 9);
  assert.ok(blocks.some(b => b.settings.text.endsWith('arrived fast!')), 'their words stay as they gave them');
  assert.doesNotMatch(html, /★|stars? rating|\d+ reviews/i, 'no invented rating or count');
});

test('every card shows the quote, the person, the place and initials in a small circle', async () => {
  const { ctx, p } = await open({ width: 1280, height: 800 });
  assert.equal(await p.locator('[data-hsr-card]').count(), 9);
  const first = p.locator('[data-hsr-card]').first();
  assert.match(await first.textContent(), /I actually got emotional opening it/);
  assert.equal((await first.locator('.hsr__face--initials').textContent()).trim(), 'JM');
  const face = await first.locator('.hsr__face').boundingBox();
  assert.ok(face.width <= 34, 'the face is small');
  if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: SHOTS + '/desktop.png' }); }
  await ctx.close();
});

test('it moves one card every 6 s, loops at the end, and stands still while hovered or paused', async () => {
  const { ctx, p } = await open({ width: 390, height: 844 });
  await p.evaluate(() => document.querySelector('[data-hsr]').scrollIntoView());
  assert.equal(await at(p), 0);
  await p.clock.runFor(6100); await p.waitForTimeout(600);
  assert.equal(await at(p), 1, 'moved one');
  await p.hover('[data-hsr-track]');
  await p.clock.runFor(12100); await p.waitForTimeout(600);
  assert.equal(await at(p), 1, 'still while hovered');
  await p.mouse.move(5, 5);
  await p.click('[data-hsr-pause]');
  await p.clock.runFor(12100); await p.waitForTimeout(600);
  assert.equal(await at(p), 1, 'still while paused');
  assert.equal(await p.getAttribute('[data-hsr-pause]', 'aria-pressed'), 'true');
  await p.evaluate(() => { const a = document.querySelector('[data-hsr]').__hsrApi; a.go(-1); a.go(-1); }); await p.waitForTimeout(700);
  assert.equal(await p.evaluate(() => document.querySelector('[data-hsr]').__hsrApi.target()), await p.evaluate(() => { const t = document.querySelector('[data-hsr-track]'); const c = t.querySelectorAll('[data-hsr-card]'); return Math.round((t.scrollWidth - t.clientWidth) / (c[1].offsetLeft - c[0].offsetLeft)); }), 'back past the start goes to the end');
  if (SHOTS) await p.screenshot({ path: SHOTS + '/phone.png' });
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= 390), true, 'no sideways page scroll');
  await ctx.close();
});

test('under reduced motion it never moves by itself', async () => {
  const { ctx, p } = await open({ width: 1280, height: 800 }, { reduce: true });
  await p.clock.runFor(30000); await p.waitForTimeout(300);
  assert.equal(await at(p), 0);
  await ctx.close();
});

test('no card is cut off at the top or bottom, on a phone or a desktop', async () => {
  for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    const { ctx, p } = await open(vp);
    const ok = await p.evaluate(() => {
      const t = document.querySelector('[data-hsr-track]').getBoundingClientRect();
      return [...document.querySelectorAll('.hsr__fig')].every(f => { const r = f.getBoundingClientRect(); return r.top >= t.top + 6 && r.bottom <= t.bottom - 10; });
    });
    assert.ok(ok, `cards fit inside the strip with room for their edges at ${vp.width}`);
    await ctx.close();
  }
});
