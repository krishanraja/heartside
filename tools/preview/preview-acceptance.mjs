// Part A of docs/review/COWORK-LIVE-ACCEPTANCE.md, automated: the real store (Helio's real
// header, Teeinblue's real form, real products), optionally on an unpublished theme, at a phone,
// a desktop and Krish's Android Edge size. It checks what a buyer would meet: one Heartside on
// every page, "Start with your dog" inside the first screen, the chat's Back, Forward and reload,
// the retired ?view= links, each product page answering at its own address (catalog.mjs; a
// redirect to another handle fails), the product pages' truth, the gallery swap, Teeinblue's
// photo input, the empty cart and the 404.
//
//   cd tools/preview && node preview-acceptance.mjs                    # heartside.io, live theme
//   node preview-acceptance.mjs --theme <unpublished theme id>        # that theme, by preview
//   node preview-acceptance.mjs --views edge                          # one size
//   node preview-acceptance.mjs --parts products                      # only the product pages
//                                                                     # (home, chat, links, products, cart)
//
// Read-only and free: a fresh browser with no saved state; every request to the n8n host and
// every request that is not a GET or HEAD is refused before it leaves the browser, so it never
// calls Buddy's paid AI, writes to a cart or uploads anything. Chips only, synthetic names. It
// prints what the pages show, never a request address or the theme id. Exit 1 on any failure;
// exit 2 when nothing failed but Cloudflare challenged a page (inconclusive, never a pass).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, EDGE, CHALLENGE } from './browser.mjs';
import { CORE, landed } from './catalog.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out', 'acceptance');
fs.mkdirSync(OUT, { recursive: true });
const arg = (name, dflt) => { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : dflt; };
const BASE = arg('base', 'https://heartside.io');
const THEME = arg('theme', '');
if (THEME && !/^\d+$/.test(THEME)) throw new Error('--theme takes digits only');
const VIEWS = {
  phone: { width: 390, height: 844, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  desk: { width: 1280, height: 900, mobile: false, ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36' },
  // Krish's phone on 28 Oct: Edge on Android, 360 wide with about 640px under Edge's bars
  edge: EDGE,
};
const PRODUCTS = Object.fromEntries(CORE.map((c) => [c.key, c.path]));
const SHIP = 'Free US shipping on every order.';
const url = (p) => { if (!THEME) return BASE + p; const u = new URL(BASE + p); u.searchParams.set('preview_theme_id', THEME); return u.toString(); };
const views = arg('views') ? arg('views').split(',') : Object.keys(VIEWS);
if (views.some((v) => !VIEWS[v])) { console.log(`unknown view: ${views.filter((v) => !VIEWS[v]).join(', ')} (known: ${Object.keys(VIEWS).join(', ')})`); process.exit(1); }
// --parts products: only the product pages, e.g. right after a Teeinblue campaign Update
const PARTS = ['home', 'chat', 'links', 'products', 'cart'];
const parts = arg('parts') ? arg('parts').split(',') : PARTS;
if (parts.some((p) => !PARTS.includes(p))) { console.log(`unknown part: ${parts.filter((p) => !PARTS.includes(p)).join(', ')} (known: ${PARTS.join(', ')})`); process.exit(1); }
// --settle <ms> caps every wait, for local stand-ins; the store itself gets the full waits
const SETTLE = arg('settle') === undefined ? null : Math.max(0, Number(arg('settle')) || 0);
const settle = (page, ms) => page.waitForTimeout(SETTLE === null ? ms : Math.min(ms, SETTLE));

const results = [];
const check = (view, area, ok, detail) => { results.push({ view, area, ok: !!ok, detail }); console.log(`${ok ? 'ok  ' : 'FAIL'} ${view.padEnd(5)} ${area}${detail ? ': ' + detail : ''}`); };

// what every Heartside page should carry, read in the page
function chrome(ship) {
  const text = document.body.innerText;
  const fav = [...document.querySelectorAll('link[rel~="icon"]')].map((l) => l.getAttribute('href') || '');
  return {
    brand: !!document.querySelector('link[href*="hs-brand"]'),
    memo: text.includes(ship),
    footer: !!document.querySelector('.hs-footer'),
    powered: /Powered by Shopify/i.test(text),
    calculated: /calculated at checkout/i.test(text),
    favicon: fav.some((h) => /heartside-favicon-heart/.test(h)),
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    // Helio scrolls inside .page-wrapper on desktop, with html and body hidden: that scrolls
    locked: [document.documentElement, document.body].some((el) => getComputedStyle(el).overflowY === 'hidden' || getComputedStyle(el).overflow === 'hidden')
      && !(() => { const w = document.querySelector('.page-wrapper'); return w && /auto|scroll/.test(getComputedStyle(w).overflowY) && w.scrollHeight > w.clientHeight; })(),
  };
}
const step = (page) => new URL(page.url()).searchParams.get('step');
async function move(page, how, want) {
  await (how === 'back' ? page.goBack() : page.goForward());
  await page.waitForFunction((w) => new URL(location.href).searchParams.get('step') === w && document.querySelector('.hs3__frame').getAttribute('data-hs3-screen') === 'chat', want, { timeout: 8000 });
}
const pressed = (page, v) => page.getAttribute(`[data-hs3="chip"][data-v="${v}"]`, 'aria-pressed');
// Cloudflare's challenge page instead of the store: this view cannot be judged (inconclusive)
class Challenged extends Error {}
async function open(page, u, opts = {}) {
  const response = await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 45000, ...opts });
  if (CHALLENGE.test(await page.title())) throw new Challenged('Cloudflare challenge');
  return response;
}
const inconclusive = [];

const browser = await launch();
for (const v of views) {
  const V = VIEWS[v];
  const ctx = await browser.newContext({ viewport: { width: V.width, height: V.height }, isMobile: V.mobile, hasTouch: V.mobile, userAgent: V.ua });
  let n8n = 0, refused = 0;
  await ctx.route('**/*', (route) => {
    const req = route.request();
    if (/n8n/i.test(req.url())) { n8n++; return route.abort(); }
    if (!['GET', 'HEAD'].includes(req.method())) { refused++; return route.abort(); }
    return route.continue();
  });
  // Shopify's preview bar (preview links only, never shown to buyers) covers the bottom of a phone
  if (THEME) await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '#PBarNextFrameWrapper,#preview-bar-iframe{display:none!important}'; document.head.appendChild(st); }); });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));
  // each part, and each product page, reports its own failure and lets the rest run, so one
  // broken step never hides the others; a Cloudflare challenge stops the whole view instead
  const part = async (name, fn) => {
    try { await fn(); } catch (e) {
      if (e instanceof Challenged) throw e;
      check(v, `${name}: did not finish`, false, e.message.split('\n')[0].replace(/https?:\/\/\S+/g, 'the page'));
    }
  };
  try {
    // 1. One Heartside, on the first screen
    if (parts.includes('home')) await part('home', async () => {
      await open(page, url('/'));
      await settle(page, 3000);
      const c = await page.evaluate(chrome, SHIP);
      check(v, 'home is the new theme (hs-brand.css loaded)', c.brand);
      check(v, 'home: shipping strip', c.memo);
      check(v, 'home: Heartside footer, no "Powered by Shopify"', c.footer && !c.powered);
      check(v, 'home: favicon is the heart', c.favicon);
      check(v, 'home: no sideways scroll, page not locked', !c.overflow && !c.locked, `overflow ${c.overflow}, locked ${c.locked}`);
      // Krish's Edge phone, 28 Oct: "Start with your dog" sat below the first screen
      const start = await page.evaluate(() => { const b = document.querySelector('[data-hs3-start]'); return b ? { bottom: Math.round(b.getBoundingClientRect().bottom), h: innerHeight } : null; });
      check(v, 'home: Start with your dog ends inside the first screen', start && start.bottom <= start.h, start ? `ends at ${start.bottom}px in a ${start.h}px window` : 'no start button');
      await page.screenshot({ path: path.join(OUT, `${v}-home.png`) });
    });

    // 2. The chat: an address per step; Back, Forward and reload keep the answers
    if (parts.includes('chat')) await part('chat', async () => {
      if (!parts.includes('home')) { await open(page, url('/')); await settle(page, 3000); }
      await page.click('[data-hs3-start]');
      await page.fill('#hs3-dog', 'Pip'); await page.click('[data-hs3="next"]');
      await page.fill('#hs3-rec', 'Alex'); await page.click('[data-hs3="next"]');
      await page.click('[data-hs3="chip"][data-v="door"]'); await page.waitForSelector('[data-hs3="chip"][data-v="weekends"]');
      await page.click('[data-hs3="chip"][data-v="weekends"]');
      await page.click('[data-hs3="chip"][data-v="bed"]');
      check(v, 'chat: each step has its own address', step(page) === 'together', 'at ' + step(page));
      await move(page, 'back', 'spot');
      const b1 = await pressed(page, 'bed');
      await move(page, 'back', 'home-more');
      const b2 = await pressed(page, 'weekends');
      check(v, 'chat: browser Back lands on the previous step with its answer', b1 === 'true' && b2 === 'true');
      await move(page, 'forward', 'spot');
      check(v, 'chat: Forward returns', step(page) === 'spot');
      await page.reload({ waitUntil: 'domcontentloaded' }); await settle(page, 2500);
      check(v, 'chat: reload keeps the step, not the first screen', step(page) === 'spot' && (await page.getAttribute('.hs3__frame', 'data-hs3-screen')) === 'chat' && (await pressed(page, 'bed')) === 'true');
      await open(page, url('/')); await settle(page, 2500);
      const resume = (await page.textContent('[data-hs3-start]')).trim();
      check(v, 'chat: the first screen offers to pick up where you left off', resume === 'Pick up where you left off', resume);
      // on to the choose screen: the reveal's own first note is refused here, which must not stop it
      await page.click('[data-hs3-start]'); await page.waitForSelector('[data-hs3="chip"][data-v="bed"]');
      await page.click('[data-hs3="chip"][data-v="bed"]'); await page.click('[data-hs3="chip"][data-v="walk"]');
      await page.click('[data-hs3="chip"][data-v="shadow"]'); await page.click('[data-hs3="next"]');
      await page.waitForSelector('[data-hs3="them"]', { timeout: 20000 });
      const slider = await page.evaluate(() => { const t = document.querySelector('[data-hs3-tone]'); return { free: !!t && !t.disabled, stuck: /didn't come back/.test(document.body.innerText) }; });
      check(v, 'reveal: the slider stays free when the first note does not come back', slider.free && !slider.stuck);
      await page.click('[data-hs3="them"]'); await settle(page, 800);
      const remind = await page.evaluate(() => { const r = document.querySelector('[data-hs3-remind]'); return { shown: !!r && !r.hidden && r.getBoundingClientRect().height > 0, email: !!(r && r.querySelector('input[type="email"][name="contact[email]"]')), tags: r && (r.querySelector('input[name="contact[tags]"]') || {}).value }; });
      check(v, 'choose: the Christmas reminder offer is there (not submitted)', step(page) === 'choose' && remind.shown && remind.email && /newsletter/.test(remind.tags || ''), JSON.stringify(remind));
    });

    // 3. A retired ?view= link lands on the same page without view, keeping utm_
    if (parts.includes('links')) await part('retired ?view= link', async () => {
      await open(page, url(PRODUCTS.portrait + '?view=gift&utm_source=qa'));
      await settle(page, 2500);
      const moved = new URL(page.url());
      check(v, 'retired ?view= link: lands on the page, view dropped, utm kept', moved.pathname === PRODUCTS.portrait && !moved.searchParams.has('view') && moved.searchParams.get('utm_source') === 'qa');
    });

    // 4. Product pages: their own address, truth, gallery, Teeinblue's photo input
    if (parts.includes('products')) for (const [name, p] of Object.entries(PRODUCTS)) await part(name, async () => {
      // its own address: 200 itself, not a redirect to another handle (the 28 Oct handle trap)
      const response = await open(page, url(p));
      const moved = response ? landed(url(p), response.url(), !!response.request().redirectedFrom()) : 'no response';
      check(v, `${name}: ${p} answers at its own address`, response && response.status() === 200 && !moved, moved || `HTTP ${response && response.status()}`);
      await settle(page, 4000);
      const c = await page.evaluate(chrome, SHIP);
      check(v, `${name}: shipping line, no "calculated at checkout", Heartside footer`, c.memo && !c.calculated && c.footer && !c.powered);
      check(v, `${name}: no sideways scroll, page not locked`, !c.overflow && !c.locked);
      const first = await page.getAttribute('[data-hs2-main]', 'alt', { timeout: 5000 }).catch(() => null);
      check(v, `${name}: first photo is not the blank reference`, first !== null && !/shown in your cart|^blank /i.test(first), first || 'no main photo');
      if (name === 'portrait') {
        const t = await page.evaluate(() => document.body.innerText);
        check(v, 'portrait: both formats and prices', /Unframed \$59/.test(t) && /Framed \$119/.test(t));
      }
      const tee = await page.waitForSelector('.tee-field--photo input[type="file"], input[type="file"][id^="tee-photo"]', { state: 'attached', timeout: 20000 }).then(() => true, () => false);
      check(v, `${name}: Teeinblue photo input present (photo check and metadata stripping rely on it)`, tee);
      // every thumbnail: the visible photo never empties and the box never changes height
      const thumbs = await page.$$('[data-hs2-thumb]:not([hidden])');
      let blank = 0, jump = 0;
      for (const t of thumbs) {
        if (!(await t.isVisible())) continue;
        const r = await page.evaluate(async (el) => {
          const main = document.querySelector('[data-hs2-main]'), stage = document.querySelector('[data-hs2-stage]');
          const h0 = stage ? stage.getBoundingClientRect().height : 0; let empty = 0, moved = 0;
          el.click();
          const t0 = performance.now();
          await new Promise((done) => { const tick = () => { if (main && main.naturalWidth === 0) empty++; if (stage && Math.abs(stage.getBoundingClientRect().height - h0) > 1) moved++; performance.now() - t0 > 1200 ? done() : requestAnimationFrame(tick); }; tick(); });
          return { empty, moved };
        }, t);
        blank += r.empty; jump += r.moved;
      }
      check(v, `${name}: ${thumbs.length} thumbnail clicks, photo never blank, box never resizes`, blank === 0 && jump === 0, `blank frames ${blank}, resized frames ${jump}`);
      await page.screenshot({ path: path.join(OUT, `${v}-${name}.png`) });
    });

    // 5. The empty cart and the 404
    if (parts.includes('cart')) await part('cart and 404', async () => {
      await open(page, url('/cart')); await settle(page, 2000);
      const cart = await page.evaluate(() => document.body.innerText);
      check(v, 'cart: Buddy\'s empty cart', /Nothing in here yet\. I checked twice\./.test(cart));
      const r404 = await open(page, url('/pages/heartside-acceptance-missing'));
      await settle(page, 1500);
      const c = await page.evaluate(chrome, SHIP);
      check(v, '404: status 404 in Heartside chrome', r404 && r404.status() === 404 && c.footer, `HTTP ${r404 && r404.status()}`);
    });
  } catch (e) {
    if (e instanceof Challenged) { inconclusive.push(v); console.log(`??   ${v.padEnd(5)} Cloudflare challenge: the rest of this view was not checked (inconclusive)`); }
    else check(v, 'run', false, e.message.split('\n')[0].replace(/https?:\/\/\S+/g, 'the page'));
  }
  // a refused request surfaces as "Failed to fetch" in the page; that is this script's own block
  const ours = errors.filter((e) => !/tee|teeinblue|shopify|klaviyo|inbox|facebook|google|Failed to fetch/i.test(e));
  check(v, 'no script errors from Heartside code', ours.length === 0, ours.slice(0, 3).join(' | '));
  check(v, 'no call reached Buddy\'s paid AI', true, `${n8n} n8n and ${refused} non-GET requests refused`);
  await ctx.close();
}
await browser.close();
const failed = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ base: BASE, preview: !!THEME, at: new Date().toISOString(), inconclusive, results }, null, 2));
if (failed.length) console.log(`\n${failed.length} checks failed${inconclusive.length ? `; Cloudflare challenged ${inconclusive.join(', ')}` : ''}`);
else if (inconclusive.length) console.log(`\ninconclusive: Cloudflare challenged ${inconclusive.join(', ')}, so those views were not checked`);
else console.log('\nall clear');
process.exit(failed.length ? 1 : inconclusive.length ? 2 : 0);
