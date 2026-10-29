// The presentation gate: load the real store (Helio's real header, Teeinblue's real form,
// real products) at desktop, iPhone Safari, Instagram in-app and Android Edge sizes, and fail on
// the defects a person would see before judging taste: content under the header, text on top of
// text, sideways overflow, Teeinblue's own blue, its button bar pinned over the form or its
// Personalize bar pinned over the page, a heading that leaves one word alone (a product title
// only when another wrap could have avoided it), Title Case on the Add to cart button, or the
// first screen's button below the first screen. It also checks today's
// catalog where a shopper sees it (catalog.mjs): each product page answers at its own address
// (a redirect to another handle fails), carries its native template's mark, and shows its title
// and first price; the home page's chat offers the three gifts at their clean addresses and the
// phone menu links them; and no retired product name or price shows anywhere on the page.
//
//   cd tools/preview && node live-gate.mjs                     # heartside.io
//   node live-gate.mjs --query "view=gift"                     # a query on every page (here: an old
//                                                              # ?view= link, which should land on
//                                                              # the current page)
//   node live-gate.mjs --query "preview_theme_id=<id>"         # an unpublished copy (Shopify's
//                                                              # preview bar is hidden)
//   node live-gate.mjs --pages home,mug --views phone,edge     # a subset
//   node live-gate.mjs --settle 300                            # shorter waits, for local stand-ins
//
// Read-only: the pages are opened in a fresh browser with no cookies or saved state, every
// request the pages make that is not a GET (or HEAD) is refused before it leaves the browser,
// as is anything to the n8n host, so the gate never writes to a cart, sends analytics or calls
// Buddy's paid AI. It prints only what the public pages show and their paths, never a host,
// request address or theme id, and stores only the screenshots. Screenshots of every fold land
// in tools/preview/out/gate/. Exit 1 on any failure; exit 2 when nothing failed but Cloudflare
// challenged a page, so it could not be checked (inconclusive, never a pass).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, EDGE, CHALLENGE } from './browser.mjs';
import { CORE, landed, markerSelector } from './catalog.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out', 'gate');
fs.mkdirSync(OUT, { recursive: true });

const arg = (name, dflt) => { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : dflt; };
const BASE = arg('base', 'https://heartside.io');
const QUERY = arg('query', '');
const SETTLE = Math.max(0, Number(arg('settle', 3500)) || 0);

const VIEWS = {
  desk: { width: 1440, height: 900, mobile: false, ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36' },
  phone: { width: 390, height: 844, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  // Instagram's in-app browser keeps its own bars on screen, so the page gets ~664px of height
  ig: { width: 390, height: 664, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0 (iPhone15,3; iOS 18_0; en_US)' },
  // Krish's phone on 28 Oct: Edge on Android, 360 wide with about 640px under Edge's bars
  edge: EDGE,
};
// today's catalog (catalog.mjs); title and price are what the product page shows first (the
// portrait opens on its first variant, framed). The home page's first-screen button must end
// inside the first screen, and its chat and phone menu must offer the three clean addresses.
const GIFTS = CORE.map(({ key, chat, handle, path: p }) => ({ key, chat, handle, path: p }));
const PAGES = {
  home: { path: '/', primary: '[data-hs3-start]', gifts: GIFTS },
  ...Object.fromEntries(CORE.map((c) => [c.key, { path: c.path, title: c.title, price: c.price, marker: markerSelector(c) }])),
  catalog: { path: '/collections/all' },
  cart: { path: '/cart' },
  missing: { path: '/pages/heartside-gate-missing-page', status: 404 },
};
const RETIRED = String(/The Morning Mug|The Couch Blanket|The Framed Print|The Tree Ornament|Annual Review|Body Double|\bUniform\b|\$(?:29|89|24|39)(?:\.00)?\b(?!\.\d)|\bBiscuit\b|your dog has notes/i);
// an unknown name is refused rather than skipped, so a typo can never read as "all clear"
const pick = (list, all, what) => {
  const names = list ? list.split(',') : Object.keys(all);
  const unknown = names.filter((k) => !all[k]);
  if (unknown.length) { console.log(`unknown ${what}: ${unknown.join(', ')} (known: ${Object.keys(all).join(', ')})`); process.exit(1); }
  return names;
};
const views = pick(arg('views'), VIEWS, 'view');
const pages = pick(arg('pages'), PAGES, 'page');

const withQuery = (p) => (QUERY ? p + (p.includes('?') ? '&' : '?') + QUERY : p);

// Runs in the page. Everything it reports is something a shopper would see.
function inspect([spec, retiredSource]) {
  // laid out but out of sight: inside a box clipped to a pixel (sr-only, visually-hidden)
  const clippedAway = (el) => {
    for (let x = el; x && x !== document.body; x = x.parentElement) {
      const r = x.getBoundingClientRect(), cs = getComputedStyle(x);
      if ((r.width <= 1 || r.height <= 1) && (cs.overflow === 'hidden' || cs.clip !== 'auto' || cs.clipPath !== 'none')) return true;
    }
    return false;
  };
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    if (clippedAway(el)) return false;
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
  const ours = [...document.querySelectorAll('main .hs2 h1, main .hs2 h2, main .hs2 .hs2-stamp, main .hs2 .hs2-btn, main .hs2-product__main, main .hs2-product__media, main .hs3 h1, main .hs3 .hs3-btn, main .hs3-hero__art, main .hs-lost h1, main .hs-lost .hs-btn')];
  for (const el of ours) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.top < headBottom - 1) fails.push(`under header (header ends ${Math.round(headBottom)}px, ${label(el)} starts ${Math.round(r.top)}px)`);
  }

  // 2. sideways overflow
  const sw = document.documentElement.scrollWidth;
  if (sw > innerWidth + 1) fails.push(`page scrolls sideways (${sw}px wide in a ${innerWidth}px window)`);
  const scrollers = [...document.querySelectorAll('*')].filter((el) => { const o = getComputedStyle(el).overflowX; return o === 'auto' || o === 'scroll' || o === 'hidden'; });
  document.querySelectorAll('main .hs2 *, main .hs3 *').forEach((el) => {
    if (!vis(el) || scrollers.some((s) => s !== el && s.contains(el) && s !== document.documentElement && s !== document.body && !s.classList.contains('page-wrapper'))) return;
    const r = el.getBoundingClientRect();
    if (r.right > innerWidth + 2 || r.left < -2) fails.push(`off the edge: ${label(el)} spans ${Math.round(r.left)}..${Math.round(r.right)}px`);
  });

  // 3. text on top of text: headings, buttons, labels and stamps that aren't nested in each other
  const texts = [...document.querySelectorAll('main h1, main h2, main h3, main .hs2-stamp, main .hs2-btn, main .hs3-btn, main .hs-btn, main label, main .tee-btn, main .hs2-product__price, main .tee-field__heading, main .hs3-fan__name, main .hs3-fan__price, main .hs3-bubble')].filter(vis);
  // a turned card (a CSS rotate) widens the screen boxes of everything in it, so two lines in the
  // same turned box are compared by their layout boxes, which the turn does not change
  const turnedBox = (el) => { for (let x = el.parentElement; x && x !== document.body; x = x.parentElement) if (getComputedStyle(x).transform !== 'none') return x; return null; };
  const layoutBox = (el) => ({ left: el.offsetLeft, top: el.offsetTop, right: el.offsetLeft + el.offsetWidth, bottom: el.offsetTop + el.offsetHeight });
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j];
    if (a.contains(b) || b.contains(a)) continue;
    const turned = turnedBox(a);
    const same = turned && turned === turnedBox(b) && a.offsetParent === b.offsetParent;
    const ra = same ? layoutBox(a) : a.getBoundingClientRect(), rb = same ? layoutBox(b) : b.getBoundingClientRect();
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w > 4 && h > 4) fails.push(`overlap: ${label(a)} and ${label(b)} (${Math.round(w)}x${Math.round(h)}px)`);
  }

  // 4. Teeinblue's own blue, anywhere a shopper can see it. The house palette has no blue at all,
  //    so any blue-dominant color in a visible paint property is someone else's default.
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
  // a bar fixed to the screen (Teeinblue's Personalize bar, our next-gift bar, Shopify's preview
  // bar, which the gate hides on a copy) over anything a shopper reads or taps on the first
  // screen: fixed bars reserve no space under them
  const fixedBars = [...document.querySelectorAll('.tee-btn-wrapper--personalize, .hs2-next, #PBarNextFrameWrapper')].filter((b) => vis(b) && getComputedStyle(b).position === 'fixed');
  for (const bar of fixedBars) {
    const rb = bar.getBoundingClientRect();
    const under = [...document.querySelectorAll('main h1, main h2, main button, main a.button, main .hs2-btn, main .hs3-btn, main label, main p, main [data-hs2-price]')]
      .filter((el) => !bar.contains(el) && !el.contains(bar) && vis(el))
      .find((el) => { const r = el.getBoundingClientRect(); return Math.min(r.right, rb.right) - Math.max(r.left, rb.left) > 4 && Math.min(r.bottom, rb.bottom) - Math.max(r.top, rb.top) > 4; });
    if (under) fails.push(`covered: ${label(bar)} is fixed over ${label(under)}`);
  }
  // Teeinblue's own Add To Cart in Title Case: our buttons are sentence case ("Add to cart")
  const atc = document.querySelector('#teeAtcButton');
  if (atc && rendered(atc)) {
    const words = (atc.innerText || '').trim().split(/\s+/);
    if (words.length > 1 && words.slice(1).some((w) => /^[A-Z][a-z]/.test(w))) fails.push(`not sentence case: Teeinblue's button reads "${words.join(' ')}"`);
  }

  // 6. one word alone on the last line of a heading or Buddy's line ("Last step. Let's make
  //    Mochi's / mug."): the words of each, grouped into lines by where the browser put them.
  //    The product title is Shopify's, not our copy, so it fails only when its last word could
  //    have shared a line with the word before it. At the desk size "Personality Blanket" is
  //    wider than the title's column, so "Blanket" is alone in every wrap (review of #65).
  const lastLine = (el) => {
    const words = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      for (const m of n.data.matchAll(/\S+/g)) {
        const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const box = r.getClientRects()[0];
        if (box && box.width) words.push({ w: m[0], top: box.top });
      }
    }
    const lines = [];
    for (const x of words) { const l = lines[lines.length - 1]; if (l && Math.abs(x.top - l.top) <= 4) l.words.push(x.w); else lines.push({ top: x.top, words: [x.w] }); }
    return lines;
  };
  // would these words fit on one line of el, in its own font? Measured by a hidden copy inside
  // it, removed at once
  const fitsOneLine = (el, text) => {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
    probe.textContent = text;
    el.appendChild(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    const cs = getComputedStyle(el), box = el.getBoundingClientRect();
    return width <= box.width - ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce((s, k) => s + (parseFloat(cs[k]) || 0), 0);
  };
  for (const el of document.querySelectorAll('.hs3-hero__h, .hs3-h2, .hs3-range__h, .hs-journey__line, #buy h1')) {
    if (!vis(el)) continue;
    const lines = lastLine(el);
    if (lines.length < 2 || lines[lines.length - 1].words.length !== 1) continue;
    const before = lines[lines.length - 2].words, alone = lines[lines.length - 1].words[0];
    if (el.matches('#buy h1') && !fitsOneLine(el, before[before.length - 1] + ' ' + alone)) continue;
    fails.push(`one word alone: "${alone}" on the last line of ${label(el)}`);
  }

  // 7. the first screen's button ends inside the first screen (Krish's Edge phone, 28 Oct:
  //    "Start with your dog" sat below it)
  if (spec.primary) {
    const btn = document.querySelector(spec.primary);
    if (!btn || !rendered(btn)) fails.push(`no ${spec.primary} button on the page`);
    else {
      const r = btn.getBoundingClientRect();
      if (r.bottom > innerHeight + 0.5) fails.push(`below the first screen: "${(btn.innerText || '').trim()}" ends at ${Math.round(r.bottom)}px in a ${innerHeight}px window`);
    }
  }

  // 8. the address and the template: a product page carries its native template's mark, and the
  //    home page's chat (server-rendered config) and phone menu offer the three clean addresses
  if (spec.marker && !document.querySelector(spec.marker)) fails.push(`not on its native template (no ${spec.marker})`);
  if (spec.gifts) {
    let cfg = null;
    try { cfg = JSON.parse(document.querySelector('[data-hs3-config]').textContent); } catch (e) { cfg = null; }
    if (!cfg || !cfg.gifts) fails.push('no chat config on the first screen');
    else for (const g of spec.gifts) {
      const got = cfg.gifts[g.chat] || {};
      if (!got.handle || !got.url) fails.push(`the chat has no ${g.key} (its product setting points at nothing)`);
      else if (got.handle !== g.handle || new URL(got.url, location.href).pathname !== g.path) fails.push(`the chat's ${g.key} is ${new URL(got.url, location.href).pathname}, expected ${g.path}`);
    }
    const menu = document.querySelector('template[data-hs-menu]');
    if (!menu) fails.push('the phone menu is missing');
    else {
      const links = [...menu.content.querySelectorAll('a[href]')].map((a) => new URL(a.getAttribute('href'), location.href).pathname);
      for (const g of spec.gifts) if (!links.includes(g.path)) fails.push(`the phone menu has no link to ${g.path}`);
    }
  }

  // 9. today's catalog: the product's own title and first price, and nothing retired on the page
  if (spec.title) {
    const h1 = document.querySelector('#buy h1, main h1');
    if (!h1 || h1.innerText.trim() !== spec.title) fails.push(`title: expected "${spec.title}", page shows "${h1 ? h1.innerText.trim() : 'no h1'}"`);
  }
  if (spec.price) {
    const price = document.querySelector('#buy [data-hs2-price], main [data-hs2-price]');
    if (!price || price.innerText.trim() !== spec.price) fails.push(`price: expected ${spec.price}, page shows ${price ? price.innerText.trim() : 'no price'}`);
  }
  const retired = new RegExp(retiredSource.slice(1, retiredSource.lastIndexOf('/')), retiredSource.slice(retiredSource.lastIndexOf('/') + 1));
  // the Artist's touch add-on's own price (read from its product, $29 today) is not a retired price
  const hit = (document.body.innerText || '').replace(/Artist['’]s touch,\s+\$\d+(?:\.\d\d)?/gi, "Artist's touch").match(retired);
  if (hit) fails.push(`retired copy on the page: "${hit[0]}"`);

  return { fails: [...new Set(fails)], headBottom: Math.round(headBottom) };
}

const browser = await launch();
// Shopify's preview bar (preview links only, never shown to buyers) covers the bottom of a phone
const PREVIEW = /(?:^|&)preview_theme_id=/.test(QUERY);
let failed = 0, inconclusive = 0;
for (const v of views) {
  const V = VIEWS[v];
  const ctx = await browser.newContext({ viewport: { width: V.width, height: V.height }, isMobile: V.mobile, hasTouch: V.mobile, userAgent: V.ua });
  // read-only: GET and HEAD go out, nothing else does, and nothing to n8n at all
  let refused = 0;
  await ctx.route('**/*', (route) => {
    const req = route.request();
    if (/n8n/i.test(req.url()) || !['GET', 'HEAD'].includes(req.method())) { refused++; return route.abort(); }
    return route.continue();
  });
  if (PREVIEW) await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '#PBarNextFrameWrapper,#preview-bar-iframe{display:none!important}'; document.head.appendChild(st); }); });
  const page = await ctx.newPage();
  for (const p of pages) {
    const spec = PAGES[p];
    const url = BASE + withQuery(spec.path);
    // the report names the path, never the host or the query (which can carry a theme id)
    const where = spec.path;
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const status = response ? response.status() : 0;
      // a product address that redirects (a renamed handle, 28 Oct) or ends on another path fails,
      // even when the page it lands on has the same title and price
      const moved = landed(url, response ? response.url() : page.url(), !!(response && response.request().redirectedFrom()));
      await page.waitForTimeout(SETTLE);
      if (CHALLENGE.test(await page.title())) { console.log(`??   ${v} ${p}: Cloudflare challenge, not checked (inconclusive)`); inconclusive++; continue; }
      // a page that scrolls itself while the shopper only watches (Helio's search grabbing focus did)
      await page.waitForTimeout(SETTLE);
      const drift = await page.evaluate(() => { const w = document.querySelector('.page-wrapper'); return Math.round(Math.max(window.scrollY, w ? w.scrollTop : 0)); });
      // scroll through once so reveal animations finish, then back to the top
      await page.evaluate(async () => {
        const s = document.querySelector('.page-wrapper') || document.scrollingElement;
        for (let y = 0; y < s.scrollHeight; y += 500) { s.scrollTop = y; await new Promise((r) => setTimeout(r, 40)); }
        s.scrollTop = 0;
      });
      await page.waitForTimeout(Math.min(900, SETTLE));
      const res = await page.evaluate(inspect, [spec, RETIRED]);
      const later = landed(url, page.url());
      if (drift > 40 && !/#/.test(url)) res.fails.unshift(`page scrolled itself to ${drift}px within ${Math.round((2 * SETTLE) / 1000)}s of loading, with nobody touching it`);
      if (moved || later) res.fails.unshift(moved || later);
      if (status !== (spec.status || 200)) res.fails.unshift(`HTTP ${status}, expected ${spec.status || 200}`);
      await page.screenshot({ path: path.join(OUT, `${v}-${p}.png`) });
      if (res.fails.length) {
        failed++;
        console.log(`FAIL ${v} ${p} (${where})`);
        res.fails.slice(0, 12).forEach((f) => console.log('   - ' + f));
        if (res.fails.length > 12) console.log(`   ... ${res.fails.length - 12} more`);
      } else console.log(`ok   ${v} ${p}`);
      if (refused) { console.log(`     (${refused} non-GET or n8n requests refused so far in this view)`); }
    } catch (e) { failed++; console.log(`ERR  ${v} ${p} (${where}): ${e.message.split('\n')[0].replace(/https?:\/\/\S+/g, 'the page')}`); }
  }
  await ctx.close();
}
await browser.close();
if (failed) console.log(`\n${failed} page/viewport combinations failed${inconclusive ? `, ${inconclusive} not checked (Cloudflare challenge)` : ''}`);
else if (inconclusive) console.log(`\ninconclusive: ${inconclusive} page/viewport combinations met a Cloudflare challenge and were not checked`);
else console.log('\nall clear');
process.exit(failed ? 1 : inconclusive ? 2 : 0);
