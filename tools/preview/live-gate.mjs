// The presentation gate: load the real store (Helio's real header, Teeinblue's real form,
// real products) at desktop, iPhone Safari and Instagram in-app sizes, and fail on the defects
// a person would see before judging taste: content under the header, text on top of text,
// sideways overflow, Teeinblue's own blue, or its button bar pinned over the form.
//
//   cd tools/preview && node live-gate.mjs                    # heartside.io
//   node live-gate.mjs --query "view=shop"                    # a hidden alternate template
//   node live-gate.mjs --pages home,poster --views phone,ig   # a subset
//
// Screenshots of every fold land in tools/preview/out/gate/. Exit code 1 on any failure.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out', 'gate');
fs.mkdirSync(OUT, { recursive: true });

const arg = (name, dflt) => { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : dflt; };
const BASE = arg('base', 'https://heartside.io');
const QUERY = arg('query', '');

// Cloudflare in front of heartside.io turns away a plain headless browser
const SPKI = 'PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0=,gBdItbWylHhTkoJDRwIiMuweY/qX4F0bJmLNs5wosUQ=,L+/CZomxifpzjiAVG11S0bTbaTopj+c49s0rBjjSC6A=,KnP1OnzHv/y42eRQmbGwoYTHcSJF448m6CU5mdngwKk=';
const VIEWS = {
  desk: { width: 1440, height: 900, mobile: false, ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36' },
  phone: { width: 390, height: 844, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  // Instagram's in-app browser keeps its own bars on screen, so the page gets ~664px of height
  ig: { width: 390, height: 664, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0 (iPhone15,3; iOS 18_0; en_US)' },
};
const PAGES = {
  home: '/', landing: '/products/the-annual-review?view=landing', poster: '/products/the-annual-review',
  framed: '/products/the-annual-review-framed', ornament: '/products/tiny-me-for-the-tree',
  pillow: '/products/the-body-double', catalog: '/collections/all', cart: '/cart',
};
const pick = (list, all) => (list ? list.split(',') : Object.keys(all)).filter((k) => all[k]);
const views = pick(arg('views'), VIEWS);
const pages = pick(arg('pages'), PAGES);

const withQuery = (p) => (QUERY ? p + (p.includes('?') ? '&' : '?') + QUERY : p);

// Runs in the page. Everything it reports is something a shopper would see.
function inspect() {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    return r.bottom > 0 && r.top < innerHeight;
  };
  const label = (el) => {
    const t = (el.innerText || el.getAttribute('aria-label') || el.alt || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''} "${t}"`;
  };
  const fails = [];

  // 1. under the header: the lowest visible part of Helio's header, against our first section
  const header = document.querySelector('.header-section, header.shopify-section');
  let headBottom = 0;
  if (header) {
    header.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.right <= 0 || r.left >= innerWidth || r.top > 260) return;
      if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return;
      headBottom = Math.max(headBottom, r.bottom);
    });
  }
  const ours = [...document.querySelectorAll('main .hs2 h1, main .hs2 h2, main .hs2 .hs2-stamp, main .hs2 .hs2-btn, main .hs2-product__main, main .hs2-product__media, main .hs2-hero__media, main .hs2-hero__copy > *')];
  for (const el of ours) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.top < headBottom - 1) fails.push(`under header (header ends ${Math.round(headBottom)}px, ${label(el)} starts ${Math.round(r.top)}px)`);
  }

  // 2. sideways overflow
  const sw = document.documentElement.scrollWidth;
  if (sw > innerWidth + 1) fails.push(`page scrolls sideways (${sw}px wide in a ${innerWidth}px window)`);
  const scrollers = [...document.querySelectorAll('*')].filter((el) => { const o = getComputedStyle(el).overflowX; return o === 'auto' || o === 'scroll' || o === 'hidden'; });
  document.querySelectorAll('main .hs2 *').forEach((el) => {
    if (!vis(el) || scrollers.some((s) => s !== el && s.contains(el) && s !== document.documentElement && s !== document.body && !s.classList.contains('page-wrapper'))) return;
    const r = el.getBoundingClientRect();
    if (r.right > innerWidth + 2 || r.left < -2) fails.push(`off the edge: ${label(el)} spans ${Math.round(r.left)}..${Math.round(r.right)}px`);
  });

  // 3. text on top of text: headings, buttons, labels and stamps that aren't nested in each other
  const texts = [...document.querySelectorAll('main h1, main h2, main h3, main .hs2-stamp, main .hs2-btn, main label, main .tee-btn, main .hs2-product__price, main .tee-field__heading, main .hs2-card__cta, main .hs2-card__price')].filter(vis);
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w > 4 && h > 4) fails.push(`overlap: ${label(a)} and ${label(b)} (${Math.round(w)}x${Math.round(h)}px)`);
  }

  // 4. Teeinblue's own blue, anywhere a shopper can see it. The house palette has no blue at all,
  //    so any blue-dominant colour in a visible paint property is someone else's default.
  const isBlue = (c) => { const m = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(c || ''); if (!m) return false; const [r, g, b, a] = [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]]; return a > 0.2 && b > 150 && b > r + 70 && b > g + 40; };
  // anywhere on the page, not just the first screen: the form sits below the fold
  const rendered = (el) => { const r = el.getBoundingClientRect(); return r.width >= 2 && r.height >= 2 && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true })); };
  document.querySelectorAll('.teeinblue-item *, [class*="tee-"]').forEach((el) => {
    if (!rendered(el)) return;
    const cs = getComputedStyle(el);
    const painted = {
      color: (el.innerText || '').trim() ? cs.color : '',
      backgroundColor: cs.backgroundColor,
      borderTopColor: parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' ? cs.borderTopColor : '',
      outlineColor: parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none' ? cs.outlineColor : '',
      fill: el instanceof SVGElement ? cs.fill : '', stroke: el instanceof SVGElement && cs.stroke !== 'none' ? cs.stroke : '',
    };
    for (const [p, c] of Object.entries(painted)) if (isBlue(c)) { fails.push(`blue ${p} ${c} on ${label(el)}`); return; }
  });

  // 5. Teeinblue's action bar pinned over its own form
  const act = document.querySelector('.tee-form-actions');
  if (act) { const p = getComputedStyle(act).position; if (p === 'sticky' || p === 'fixed') fails.push(`Teeinblue action bar is ${p}: it slides over the fields`); }

  return { fails: [...new Set(fails)], headBottom: Math.round(headBottom) };
}

const browser = await chromium.launch({
  executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
  args: ['--disable-blink-features=AutomationControlled', '--ignore-certificate-errors-spki-list=' + SPKI],
});
let failed = 0;
for (const v of views) {
  const V = VIEWS[v];
  const ctx = await browser.newContext({ viewport: { width: V.width, height: V.height }, isMobile: V.mobile, hasTouch: V.mobile, userAgent: V.ua });
  const page = await ctx.newPage();
  for (const p of pages) {
    const url = BASE + withQuery(PAGES[p]);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(3500);
      if (/verify you are human|just a moment/i.test(await page.title())) { console.log(`?? ${v} ${p}: Cloudflare challenge, not checked`); failed++; continue; }
      // a page that scrolls itself while the shopper only watches (Helio's search grabbing focus did)
      await page.waitForTimeout(3500);
      const drift = await page.evaluate(() => { const w = document.querySelector('.page-wrapper'); return Math.round(Math.max(window.scrollY, w ? w.scrollTop : 0)); });
      // scroll through once so reveal animations finish, then back to the top
      await page.evaluate(async () => {
        const s = document.querySelector('.page-wrapper') || document.scrollingElement;
        for (let y = 0; y < s.scrollHeight; y += 500) { s.scrollTop = y; await new Promise((r) => setTimeout(r, 40)); }
        s.scrollTop = 0;
      });
      await page.waitForTimeout(900);
      const res = await page.evaluate(inspect);
      if (drift > 40 && !/#/.test(url)) res.fails.unshift(`page scrolled itself to ${drift}px within 7s of loading, with nobody touching it`);
      await page.screenshot({ path: path.join(OUT, `${v}-${p}.png`) });
      if (res.fails.length) {
        failed++;
        console.log(`FAIL ${v} ${p} (${url})`);
        res.fails.slice(0, 12).forEach((f) => console.log('   - ' + f));
        if (res.fails.length > 12) console.log(`   ... ${res.fails.length - 12} more`);
      } else console.log(`ok   ${v} ${p}`);
    } catch (e) { failed++; console.log(`ERR  ${v} ${p}: ${e.message.split('\n')[0]}`); }
  }
  await ctx.close();
}
await browser.close();
console.log(failed ? `\n${failed} page/viewport combinations failed` : '\nall clear');
process.exit(failed ? 1 : 0);
