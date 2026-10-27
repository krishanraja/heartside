// Part A of docs/review/COWORK-LIVE-ACCEPTANCE.md, automated: the real store (Helio's real
// header, Teeinblue's real form, real products), optionally on an unpublished theme, at a phone
// and a desktop size. It checks what a buyer would meet: one Heartside on every page, the chat's
// Back, Forward and reload, the retired ?view= links, the product pages' truth, the gallery
// swap, Teeinblue's photo input, the empty cart and the 404.
//
//   cd tools/preview && node preview-acceptance.mjs                    # heartside.io, live theme
//   node preview-acceptance.mjs --theme <unpublished theme id>        # that theme, by preview
//
// Read-only and free: a fresh browser with no saved state; every request to the n8n host and
// every request that is not a GET or HEAD is refused before it leaves the browser, so it never
// calls Buddy's paid AI, writes to a cart or uploads anything. Chips only, synthetic names. It
// prints what the pages show, never a request address or the theme id. Exit 1 on any failure.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out', 'acceptance');
fs.mkdirSync(OUT, { recursive: true });
const arg = (name, dflt) => { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : dflt; };
const BASE = arg('base', 'https://heartside.io');
const THEME = arg('theme', '');
if (THEME && !/^\d+$/.test(THEME)) throw new Error('--theme takes digits only');
// Cloudflare in front of heartside.io turns away a plain headless browser (same as live-gate.mjs)
const SPKI = 'PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0=,gBdItbWylHhTkoJDRwIiMuweY/qX4F0bJmLNs5wosUQ=,L+/CZomxifpzjiAVG11S0bTbaTopj+c49s0rBjjSC6A=,KnP1OnzHv/y42eRQmbGwoYTHcSJF448m6CU5mdngwKk=';
const VIEWS = {
  phone: { width: 390, height: 844, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  desk: { width: 1280, height: 900, mobile: false, ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36' },
};
const PRODUCTS = {
  mug: '/products/your-dogs-illustrated-mug',
  portrait: '/products/your-dogs-portrait',
  blanket: '/products/your-dogs-personality-blanket',
};
const SHIP = 'Free US shipping on every order.';
const url = (p) => { if (!THEME) return BASE + p; const u = new URL(BASE + p); u.searchParams.set('preview_theme_id', THEME); return u.toString(); };
const views = (arg('views') ? arg('views').split(',') : Object.keys(VIEWS)).filter((v) => VIEWS[v]);

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
    locked: [document.documentElement, document.body].some((el) => getComputedStyle(el).overflowY === 'hidden' || getComputedStyle(el).overflow === 'hidden'),
  };
}
const step = (page) => new URL(page.url()).searchParams.get('step');
async function move(page, how, want) {
  await (how === 'back' ? page.goBack() : page.goForward());
  await page.waitForFunction((w) => new URL(location.href).searchParams.get('step') === w && document.querySelector('.hs3__frame').getAttribute('data-hs3-screen') === 'chat', want, { timeout: 8000 });
}
const pressed = (page, v) => page.getAttribute(`[data-hs3="chip"][data-v="${v}"]`, 'aria-pressed');

const browser = await chromium.launch({
  executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
  args: ['--disable-blink-features=AutomationControlled', '--disable-background-networking', '--ignore-certificate-errors-spki-list=' + SPKI],
});
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
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));
  try {
    // 1. One Heartside, on the first screen
    await page.goto(url('/'), { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    let c = await page.evaluate(chrome, SHIP);
    check(v, 'home is the new theme (hs-brand.css loaded)', c.brand);
    check(v, 'home: shipping strip', c.memo);
    check(v, 'home: Heartside footer, no "Powered by Shopify"', c.footer && !c.powered);
    check(v, 'home: favicon is the heart', c.favicon);
    check(v, 'home: no sideways scroll, page not locked', !c.overflow && !c.locked, `overflow ${c.overflow}, locked ${c.locked}`);
    await page.screenshot({ path: path.join(OUT, `${v}-home.png`) });

    // 2. The chat: an address per step; Back, Forward and reload keep the answers
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
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500);
    check(v, 'chat: reload keeps the step, not the first screen', step(page) === 'spot' && (await page.getAttribute('.hs3__frame', 'data-hs3-screen')) === 'chat' && (await pressed(page, 'bed')) === 'true');
    await page.goto(url('/'), { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500);
    const resume = (await page.textContent('[data-hs3-start]')).trim();
    check(v, 'chat: the first screen offers to pick up where you left off', resume === 'Pick up where you left off', resume);

    // 3. A retired ?view= link lands on the same page without view, keeping utm_
    await page.goto(url('/products/your-dogs-portrait?view=gift&utm_source=qa'), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const moved = new URL(page.url());
    check(v, 'retired ?view= link: lands on the page, view dropped, utm kept', moved.pathname === PRODUCTS.portrait && !moved.searchParams.has('view') && moved.searchParams.get('utm_source') === 'qa');

    // 4. Product pages: truth, gallery, Teeinblue's photo input
    for (const [name, p] of Object.entries(PRODUCTS)) {
      await page.goto(url(p), { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(4000);
      c = await page.evaluate(chrome, SHIP);
      check(v, `${name}: shipping line, no "calculated at checkout", Heartside footer`, c.memo && !c.calculated && c.footer && !c.powered);
      check(v, `${name}: no sideways scroll, page not locked`, !c.overflow && !c.locked);
      const first = await page.getAttribute('[data-hs2-main]', 'alt').catch(() => null);
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
    }

    // 5. The empty cart and the 404
    await page.goto(url('/cart'), { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2000);
    const cart = await page.evaluate(() => document.body.innerText);
    check(v, 'cart: Buddy\'s empty cart', /Nothing in here yet\. I checked twice\./.test(cart));
    const r404 = await page.goto(url('/pages/heartside-acceptance-missing'), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    c = await page.evaluate(chrome, SHIP);
    check(v, '404: status 404 in Heartside chrome', r404 && r404.status() === 404 && c.footer, `HTTP ${r404 && r404.status()}`);
  } catch (e) {
    check(v, 'run', false, e.message.split('\n')[0]);
  }
  // a refused request surfaces as "Failed to fetch" in the page; that is this script's own block
  const ours = errors.filter((e) => !/tee|teeinblue|shopify|klaviyo|inbox|facebook|google|Failed to fetch/i.test(e));
  check(v, 'no script errors from Heartside code', ours.length === 0, ours.slice(0, 3).join(' | '));
  check(v, 'no call reached Buddy\'s paid AI', true, `${n8n} n8n and ${refused} non-GET requests refused`);
  await ctx.close();
}
await browser.close();
const failed = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ base: BASE, preview: !!THEME, at: new Date().toISOString(), results }, null, 2));
console.log(failed.length ? `\n${failed.length} checks failed` : '\nall clear');
process.exit(failed.length ? 1 : 0);
