// The purchase path inside the Instagram, Facebook and TikTok in-app browsers, on the real
// store: product page (or the ?view=shop gift grid), photo upload and crop, names, Teeinblue's
// Add To Cart, the next step after it (the cart drawer, or the next-gift bar on a gift list),
// the second gift opening with the photo carried over, the cart, and Shopify checkout up to
// the payment form. It never pays: the cart is emptied at the end.
//
// Desktop Chromium pretends to be each app's browser (user agent, 390 x 664 viewport). That
// catches layout, script and flow bugs; it can't prove the phone's file picker, Apple Pay or a
// real order. Run from tools/preview:
//
//   node inapp/flow.mjs ig product          # ig | fb | tt | iga (Instagram Android) | safari
//   node inapp/flow.mjs tt shop             # the gift grid: two gifts, photo carried to the second
//   node inapp/flow.mjs ig shop --swap      # test shopify/assets/hs2.js before deploying it,
//                                           # minified the way Shopify's CDN serves it
//
// Screenshots and a JSON report land in tools/preview/out/inapp/. Shopify rate-limits (429)
// after a dozen runs in a row; wait ten minutes before trusting a failure that follows them.
import { chromium } from 'playwright';
import { transformSync } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const OUT = path.join(HERE, '..', 'out', 'inapp');
fs.mkdirSync(OUT, { recursive: true });
const SPKI = 'PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0=,gBdItbWylHhTkoJDRwIiMuweY/qX4F0bJmLNs5wosUQ=,L+/CZomxifpzjiAVG11S0bTbaTopj+c49s0rBjjSC6A=,KnP1OnzHv/y42eRQmbGwoYTHcSJF448m6CU5mdngwKk=';
const UAS = {
  ig: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0 (iPhone15,3; iOS 18_0; en_US)',
  fb: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0.0.0;FBBV/600000000;FBDV/iPhone15,3;FBMD/iPhone;FBSN/iOS;FBSV/18.0;FBSS/3;FBCR/;FBID/phone;FBLC/en_US;FBOP/5]',
  tt: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_36.0.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US BytedanceWebview/d8a21c6',
  safari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  iga: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36 Instagram 350.0.0.0 Android',
};
const ua = process.argv[2] || 'ig', mode = process.argv[3] || 'product';
const tag = `${ua}-${mode}`;
const BASE = 'https://heartside.io';
const PHOTO = path.join(REPO, 'assets', 'v2', 'biscuit-headshot.jpg');
const T0 = Date.now(); const ts = () => ((Date.now() - T0) / 1000).toFixed(1) + 's';
const R = { ua, mode, steps: {}, console: [], failed: [], http: [], notes: [], marks: [] };
const log = (...a) => console.log(`[${tag}]`, ...a);
const step = (k, pass, detail) => { R.marks.push(ts() + ' end ' + k + ' @ ' + page.url().slice(0, 60)); R.steps[k] = { pass, detail }; log(pass ? 'PASS' : 'FAIL', k, typeof detail === 'string' ? detail : JSON.stringify(detail)); };
const shot = async (page, name, full = false) => { const p = `${OUT}/${tag}-${name}.png`; try { await page.screenshot({ path: p, fullPage: full, timeout: 15000 }); } catch (e) { log('shot fail', name, e.message.split('\n')[0]); } return p; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const interesting = (s) => /teeinblue|hs2|checkout|cart|shopify_pay|shop\.app|cdn\.shopify|tee-|vue|paypal|google.?pay|apple.?pay/i.test(s);

const browser = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, args: ['--disable-blink-features=AutomationControlled', '--ignore-certificate-errors-spki-list=' + SPKI] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, userAgent: UAS[ua], deviceScaleFactor: 2, locale: 'en-US' });
const page = await ctx.newPage();
if (process.argv.includes('--swap')) {
  const LOCAL = transformSync(fs.readFileSync(path.join(REPO, 'shopify', 'assets', 'hs2.js'), 'utf8'), { minify: true, loader: 'js' }).code;
  await ctx.route(/\/assets\/hs2\.js/, (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: LOCAL }));
}
page.on('console', (m) => { if (m.type() === 'error') R.console.push(`${ts()} [${new URL(page.url()).pathname}] ${m.text().slice(0, 400)}`); });
page.on('pageerror', (e) => R.console.push(`${ts()} [pageerror ${new URL(page.url()).pathname}] ${String(e.message).slice(0, 400)}`));
page.on('requestfailed', (r) => { const f = r.failure()?.errorText || ''; R.failed.push(`${ts()} ${f} ${r.method()} ${r.url().slice(0, 180)}`); });
page.on('response', (r) => { if (r.status() >= 400) R.http.push(`${ts()} ${r.status()} ${r.request().method()} ${r.url().slice(0, 180)}`); });
const cartAdds = [];
R.tee = [];
const isTee = (u) => /teeinblue|wasabisys/.test(u);
page.on('request', (r) => { if (isTee(r.url())) R.tee.push(`${ts()} -> ${r.method()} ${r.resourceType()} ${r.url().split('?')[0].slice(0, 130)}`); });
page.on('requestfinished', async (r) => { if (isTee(r.url()) && r.method() !== 'GET') { const res = await r.response().catch(() => null); R.tee.push(`${ts()} <- ${res ? res.status() : '?'} ${r.method()} ${r.url().split('?')[0].slice(0, 130)}`); } });
page.on('requestfailed', (r) => { if (isTee(r.url())) R.tee.push(`${ts()} XX ${r.failure()?.errorText} ${r.method()} ${r.url().split('?')[0].slice(0, 130)}`); });
page.on('request', (r) => { if (/\/cart\/add/.test(r.url())) cartAdds.push({ url: r.url(), post: (r.postData() || '').slice(0, 3000) }); });
page.on('response', async (r) => { if (/\/cart\/add/.test(r.url())) { const a = cartAdds.find((c) => c.url === r.url() && !c.status); if (a) { a.status = r.status(); try { a.body = (await r.text()).slice(0, 600); } catch (e) {} } } });

// in-page: where is this element, is it on screen, what sits on top of it, which fixed bars overlap it
async function where(page, sel, root = null) {
  return page.evaluate(([sel]) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : null;
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    const lab = (e) => e ? `${e.tagName.toLowerCase()}.${(typeof e.className === 'string' ? e.className : '').trim().split(/\s+/).slice(0, 2).join('.')} "${(e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30)}"` : null;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const top = cy >= 0 && cy < innerHeight ? document.elementFromPoint(cx, cy) : null;
    const covered = top && !(el === top || el.contains(top) || top.contains(el)) ? lab(top) : null;
    const fixed = [...document.querySelectorAll('body *')].filter((e) => { const cs = getComputedStyle(e); return (cs.position === 'fixed' || cs.position === 'sticky') && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05 && !e.contains(el) && !el.contains(e); })
      .map((e) => ({ e, b: e.getBoundingClientRect() })).filter(({ b }) => b.width > 2 && b.height > 2 && b.bottom > 0 && b.top < innerHeight)
      .filter(({ b }) => Math.min(b.right, r.right) - Math.max(b.left, r.left) > 4 && Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top) > 4)
      .map(({ e, b }) => `${lab(e)} [${Math.round(b.top)}..${Math.round(b.bottom)}]`);
    return { found: true, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), onScreen: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, covered, fixedOverlap: fixed.slice(0, 4), vh: innerHeight };
  }, [sel]);
}
async function tapEl(page, sel, label) {
  const loc = page.locator(sel).first();
  try { await loc.scrollIntoViewIfNeeded({ timeout: 5000 }); } catch (e) {}
  await wait(500);
  const w = await where(page, sel);
  try { await loc.tap({ timeout: 6000 }); return { ok: true, how: 'tap', w }; }
  catch (e) {
    const msg = e.message.split('\n').find((l) => /intercept|not visible|outside|timeout/i.test(l)) || e.message.split('\n')[0];
    try { await loc.click({ timeout: 4000, force: true }); return { ok: true, how: 'forced click after tap failed: ' + msg.slice(0, 200), w }; }
    catch (e2) { return { ok: false, how: 'tap and click failed: ' + msg.slice(0, 200), w }; }
  }
}
async function goto(page, url) {
  for (let i = 0; i < 3; i++) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(3000);
    const t = await page.title();
    if (!/just a moment|verify you are human/i.test(t)) return t;
    log('Cloudflare challenge, waiting'); await wait(15000 * (i + 1));
  }
  return 'CHALLENGE';
}

try {
  // ---------------------------------------------------------------- 1. load
  if (mode === 'shop') {
    const t = await goto(page, BASE + '/?view=shop');
    if (t === 'CHALLENGE') throw new Error('Cloudflare challenge on /?view=shop');
    await wait(4000);
    await shot(page, '0-shop-top');
    const grid = await page.evaluate(() => [...document.querySelectorAll('[data-hs2-shop-check]')].map((b) => ({ title: b.getAttribute('data-title'), url: b.getAttribute('data-url'), checked: b.checked })));
    log('grid', JSON.stringify(grid));
    // the shopper wants The Annual Review and The Body Double
    const want = ['The Annual Review', 'The Body Double'];
    for (const g of grid) {
      const should = want.includes(g.title);
      if (g.checked !== should) {
        const sel = `.hs2-shop__item:has([data-hs2-shop-check][data-title="${g.title}"])`;
        const r = await tapEl(page, sel, g.title);
        log('tap card', g.title, JSON.stringify(r));
        await wait(1200);
      }
    }
    const after = await page.evaluate(() => [...document.querySelectorAll('[data-hs2-shop-check]')].filter((b) => b.checked).map((b) => b.getAttribute('data-title')));
    const barW = await where(page, '[data-hs2-shop-go]');
    const barText = await page.evaluate(() => { const b = document.querySelector('[data-hs2-shop-bar]'); return b ? (b.hidden ? 'HIDDEN ' : '') + b.innerText.replace(/\s+/g, ' ') : 'no bar'; });
    await shot(page, '0-shop-picked');
    step('0 grid pick', after.length === 2 && after.includes('The Annual Review') && after.includes('The Body Double'), { picked: after, bar: barText, button: barW });
    const go = await tapEl(page, '[data-hs2-shop-go]', 'go');
    await page.waitForURL(/\/products\//, { timeout: 20000 }).catch(() => {});
    await wait(3000);
    const q = await page.evaluate(() => sessionStorage.getItem('hs2-queue'));
    step('0 bar button lands on first product', /\/products\/the-annual-review(\?|$)/.test(page.url()), { url: page.url(), tap: go.how, queue: q });
  } else {
    const t = await goto(page, BASE + '/products/the-annual-review');
    if (t === 'CHALLENGE') throw new Error('Cloudflare challenge');
  }
  await wait(6000);
  const loaded = await page.evaluate(() => ({ title: document.title, h1: document.querySelector('h1')?.innerText, tee: !!document.querySelector('.tee-field--photo input[type=file]'), atc: !!document.querySelector('.tee-btn--atc'), hs2: !!window.__hs2api, sw: document.documentElement.scrollWidth }));
  await shot(page, '1-load');
  step('1 load', loaded.tee && loaded.atc, loaded);

  // a shopper's first move on a phone: the bottom "Personalize" bar
  const pers = await where(page, '.tee-btn--personalize');
  if (pers.found && pers.onScreen) {
    const before = page.url();
    const r = await tapEl(page, '.tee-btn--personalize');
    await wait(2000);
    const after = await page.evaluate(() => { const p = document.querySelector('.tee-field--photo'); const r = p && p.getBoundingClientRect(); return { photoTop: r && Math.round(r.top), modal: !!document.querySelector('.vm--container, .tee-dialog') }; });
    R.notes.push(`Personalize bar tap: ${r.how}; afterwards photo field top=${after.photoTop}px (vh 664), modal=${after.modal}`);
    await shot(page, '1b-after-personalize');
  } else R.notes.push('Personalize bar ' + JSON.stringify(pers));

  // ---------------------------------------------------------------- 2. photo
  const photoW = await where(page, '.tee-field--photo .tee-btn--upload');
  await page.locator('.tee-field--photo').first().scrollIntoViewIfNeeded().catch(() => {});
  await wait(600);
  const photoW2 = await where(page, '.tee-field--photo .tee-btn--upload');
  await shot(page, '2a-photo-field');
  await page.locator('.tee-field--photo input[type=file]').first().setInputFiles(PHOTO);
  let dialog = null;
  try { await page.waitForSelector('.vm--container .tee-dialog-image-cropper, .tee-dialog-image-cropper, .vm--container', { state: 'visible', timeout: 15000 }); dialog = true; } catch (e) { dialog = false; }
  await wait(2500);
  const dlg = await page.evaluate(() => {
    const m = document.querySelector('.tee-dialog-image-cropper') || document.querySelector('.vm--modal');
    if (!m) return null;
    const box = (document.querySelector('.vm--modal') || m).getBoundingClientRect();
    const btns = [...(document.querySelector('.vm--container') || m).querySelectorAll('button, .tee-btn, [role=button]')].map((b) => { const r = b.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const top = cy >= 0 && cy < innerHeight && cx >= 0 && cx < innerWidth ? document.elementFromPoint(cx, cy) : null; return { text: (b.innerText || b.getAttribute('aria-label') || '').trim().slice(0, 30), cls: (typeof b.className === 'string' ? b.className : '').slice(0, 60), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height), onScreen: r.top >= 0 && r.bottom <= innerHeight && r.width > 0, hit: !!top && (b === top || b.contains(top)) }; });
    return { modal: { top: Math.round(box.top), bottom: Math.round(box.bottom), left: Math.round(box.left), right: Math.round(box.right), scrollH: (document.querySelector('.vm--modal') || m).scrollHeight }, btns, text: m.innerText.replace(/\s+/g, ' ').slice(0, 200), vh: innerHeight, bodyScroll: getComputedStyle(document.body).overflow };
  });
  await shot(page, '2b-crop-dialog');
  R.notes.push('crop dialog: ' + JSON.stringify(dlg));
  let cropOk = false, cropDetail = { dialogShown: dialog, dlg: dlg && dlg.modal };
  if (dlg) {
    const confirm = dlg.btns.find((b) => /^(select|crop|done|save|confirm|apply|ok|use)/i.test(b.text));
    cropDetail.confirm = confirm;
    if (confirm) {
      const sel = '.vm--container button, .vm--container .tee-btn';
      const loc = page.locator(sel).filter({ hasText: new RegExp('^\\s*' + confirm.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i') }).first();
      try { await loc.tap({ timeout: 6000 }); cropDetail.how = 'tap'; }
      catch (e) { cropDetail.how = 'tap failed: ' + e.message.split('\n')[0].slice(0, 150); try { await loc.click({ force: true, timeout: 4000 }); cropDetail.how += ' / forced click'; } catch (e2) {} }
      try { await page.waitForSelector('.vm--container', { state: 'detached', timeout: 20000 }); cropOk = true; } catch (e) { cropDetail.stillOpen = true; }
    }
  } else {
    // no dialog: did the photo go straight in?
  }
  // wait for Teeinblue's upload to finish
  await wait(6000);
  const photoState = await page.evaluate(() => { const f = document.querySelector('.tee-field--photo'); return { cls: f && f.className, text: f && f.innerText.replace(/\s+/g, ' ').slice(0, 160), imgs: f ? [...f.querySelectorAll('img')].map((i) => i.src.slice(0, 120)) : [], uploading: !!document.querySelector('.tee-field--photo .tee-loading, .tee-field--photo [class*=progress], .tee-field--photo [class*=uploading]') }; });
  cropDetail.photoField = photoState;
  await page.locator('.tee-field--photo').first().scrollIntoViewIfNeeded().catch(() => {});
  await shot(page, '2c-after-crop');
  step('2 photo + crop', cropOk && !photoState.uploading, cropDetail);
  R.notes.push('upload button position before scroll: ' + JSON.stringify(photoW) + ' after scroll: ' + JSON.stringify(photoW2));

  // ---------------------------------------------------------------- 3. names
  const nameFields = await page.evaluate(() => [...document.querySelectorAll('.tee-field--text')].map((f) => ({ cls: [...f.classList].find((c) => /layer-/.test(c)), label: (f.querySelector('.tee-field__heading, label')?.innerText || '').trim(), val: f.querySelector('input')?.value, ph: f.querySelector('input')?.placeholder, hidden: getComputedStyle(f).display === 'none' })));
  const typed = [];
  for (const f of nameFields) {
    const isDog = /dog|manager/i.test(f.label);
    const isYou = /you|employee|your name/i.test(f.label) && !isDog;
    const want = isDog ? 'Rex' : isYou ? 'Jane' : null;
    if (!want) continue;
    const sel = `.tee-field.${f.cls} input`;
    await page.locator(sel).first().scrollIntoViewIfNeeded().catch(() => {});
    await wait(400);
    const w = await where(page, sel);
    try {
      await page.locator(sel).first().tap({ timeout: 5000 });
      await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace');
      await page.keyboard.type(want, { delay: 60 });
      await page.locator(sel).first().blur().catch(() => {});
    } catch (e) { w.err = e.message.split('\n')[0].slice(0, 150); }
    await wait(1200);
    typed.push({ label: f.label, want, w });
  }
  await wait(2000);
  const nameVals = await page.evaluate(() => [...document.querySelectorAll('.tee-field--text')].map((f) => `${(f.querySelector('.tee-field__heading, label')?.innerText || '').trim()} = ${f.querySelector('input')?.value}`));
  const cur = await page.evaluate(() => { try { return window.teeinblue && window.teeinblue.getCurrentCustomization ? JSON.stringify(window.teeinblue.getCurrentCustomization()).slice(0, 600) : null; } catch (e) { return 'err ' + e.message; } });
  const chips = await page.evaluate(() => [...document.querySelectorAll('.tee-field--clipart')].map((f) => `${(f.querySelector('.tee-field__heading, label')?.innerText || '').trim()}: ${f.querySelector('input:checked') ? 'picked' : 'NONE'}`));
  await shot(page, '3-names');
  step('3 names', nameVals.some((v) => /= Jane$/.test(v)) && nameVals.some((v) => /= Rex$/.test(v)), { nameVals, chips, typed: typed.map((t) => ({ label: t.label, covered: t.w.covered, fixed: t.w.fixedOverlap, top: t.w.top, err: t.w.err })) });
  R.notes.push('teeinblue current customization: ' + cur);

  // ---------------------------------------------------------------- 4. add to cart
  await page.evaluate(() => fetch('/cart.js').then((r) => r.json())).then((c) => R.notes.push(`cart before ATC: ${c.item_count} items`));
  await page.locator('.tee-btn--atc').first().scrollIntoViewIfNeeded().catch(() => {});
  await wait(800);
  const atcW = await where(page, '.tee-btn--atc');
  await shot(page, '4a-atc-button');
  const urlBefore = page.url();
  const atc = await tapEl(page, '.tee-btn--atc');
  // Teeinblue renders the print file, then posts /cart/add
  let added = false;
  for (let i = 0; i < 40 && !added; i++) { await wait(1000); added = cartAdds.some((c) => c.status); }
  await wait(4000);
  const urlAfter = page.url();
  await shot(page, '4b-after-atc');
  const headerCart = await page.evaluate(() => { const b = document.querySelector('.cart-bubble, .cart-count, [class*=cart-count], [class*=cart-bubble], cart-icon, .header__icon--cart'); const d = document.querySelector('cart-drawer[open], .cart-drawer[open], dialog[open], [class*=drawer][open], .is-open'); return { bubble: b ? (b.innerText || '').trim() || b.className : null, drawerOpen: d ? (d.tagName + '.' + (typeof d.className === 'string' ? d.className.slice(0, 40) : '')) : null, msg: (document.querySelector('.tee-atc-message, [class*=added], .tee-alert')?.innerText || '').trim().slice(0, 80) }; });
  R.notes.push('after ATC: ' + JSON.stringify(headerCart));
  const drawer = await page.evaluate(() => { const d = document.querySelector('cart-drawer-component')?.closest('dialog'); const td = document.querySelector('cart-drawer-component')?.closest('theme-drawer'); const n = document.querySelector('[ref="cartBubbleCount"]'); const bar = document.querySelector('[data-hs2-next]'); return { dialogOpen: !!(d && d.open), drawerIsOpen: !!(td && td.isOpen), rows: document.querySelectorAll('cart-drawer-component .cart-items__table-row[data-key]').length, bubble: n ? n.textContent.trim() + (n.classList.contains('hidden') ? ' (hidden)' : '') : null, checkout: !!document.querySelector('cart-drawer-component [name="checkout"], cart-drawer-component button[name="checkout"]'), bar: bar ? bar.innerText.replace(/\s+/g, ' ') : null }; });
  R.drawer = drawer;
  step('4x after ATC: next step shown', mode === 'shop' ? (!drawer.dialogOpen && /\d/.test(drawer.bubble || '') && !!drawer.bar) : (drawer.dialogOpen && drawer.checkout && /^[1-9]/.test(drawer.bubble || '')), drawer);
  await shot(page, '4x-drawer');
  const invalid = await page.evaluate(() => [...document.querySelectorAll('.tee-field--invalid')].map((f) => f.innerText.replace(/\s+/g, ' ').slice(0, 80))).catch(() => []);
  const cart = await page.evaluate(() => fetch('/cart.js', { credentials: 'same-origin' }).then((r) => r.json())).catch((e) => ({ err: e.message }));
  const items = (cart.items || []).map((it) => ({ title: it.title, qty: it.quantity, handle: it.handle, propKeys: Object.keys(it.properties || {}), props: Object.fromEntries(Object.entries(it.properties || {}).map(([k, v]) => [k, String(v).slice(0, 160)])) }));
  const img = items[0] && (items[0].props._customization_image || null);
  step('4 add to cart', cart.item_count >= 1 && !!img, { atcButton: atcW, tap: atc.how, cartAddCalls: cartAdds.map((c) => `${c.status} ${c.url.replace(BASE, '')}`), urlBefore, urlAfter, invalid, item_count: cart.item_count, items });
  // the print file / mockup the order carries
  const full = (cart.items || [])[0]?.properties || {};
  if (full._customization_image) {
    try {
      const res = await ctx.request.get(full._customization_image, { timeout: 30000 });
      const buf = await res.body();
      const ext = /png/.test(res.headers()['content-type'] || '') ? 'png' : /webp/.test(res.headers()['content-type'] || '') ? 'webp' : 'jpg';
      fs.writeFileSync(`${OUT}/${tag}-customization.${ext}`, buf);
      R.notes.push(`_customization_image ${res.status()} ${res.headers()['content-type']} ${buf.length} bytes -> ${OUT}/${tag}-customization.${ext}`);
    } catch (e) { R.notes.push('customization fetch failed ' + e.message.split('\n')[0]); }
  }
  R.cartAddPost = cartAdds.map((c) => c.post.slice(0, 1500));

  // shop path: the bar that offers the next gift
  if (mode === 'shop') {
    await wait(2000);
    const next = await page.evaluate(() => { const b = document.querySelector('[data-hs2-next]'); return b ? { text: b.innerText.replace(/\s+/g, ' '), href: b.querySelector('a')?.getAttribute('href') } : null; });
    const nextW = await where(page, '[data-hs2-next] .hs2-next__go');
    await shot(page, '4c-next-bar');
    step('4s next-gift bar', !!next && /body-double/.test(next.href || ''), { next, where: nextW });
    if (next && /body-double/.test(next.href || '')) {
      const r = await tapEl(page, '[data-hs2-next] .hs2-next__go');
      await page.waitForURL(/body-double/, { timeout: 20000 }).catch(() => {});
      await wait(12000);
      const carry = await page.evaluate(() => ({ url: location.pathname + location.search, crop: !!document.querySelector('.vm--container'), names: [...document.querySelectorAll('.tee-field--text')].map((f) => `${(f.querySelector('.tee-field__heading, label')?.innerText || '').trim()} = ${f.querySelector('input')?.value}`), photoText: document.querySelector('.tee-field--photo')?.innerText.replace(/\s+/g, ' ').slice(0, 120), status: document.querySelector('[data-hs2-bridge-status]')?.innerText }));
      await shot(page, '4d-body-double');
      const photoCarried = await page.evaluate(() => ({ crop: !!document.querySelector('.vm--container'), thumbs: [...document.querySelectorAll('.tee-field--photo img')].map((i) => i.src.slice(0, 80)), handed: Object.keys(localStorage).filter((k) => /^hs2-handed/.test(k)) }));
      step('4s next gift opens with the photo carried', photoCarried.crop || photoCarried.thumbs.some((u) => /^blob:|wasabi|teeinblue/.test(u)), { tap: r.how, ...carry, photoCarried });
      // close any crop dialog Teeinblue opened for the handed-over photo, without adding
    }
  }

  // ---------------------------------------------------------------- 5. cart -> checkout
  await wait(2500);
  await goto(page, BASE + '/cart');
  await wait(3000);
  const cartPage = await page.evaluate(() => ({ rows: document.querySelectorAll('.cart-items__table-row[data-key], [data-key]').length, text: (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' ').slice(0, 300), dyn: [...document.querySelectorAll('shopify-accelerated-checkout-cart, shopify-accelerated-checkout, .additional-checkout-buttons, [data-shopify="dynamic-checkout-cart"]')].map((e) => e.tagName + ' ' + (e.innerText || '').slice(0, 60)) }));
  const coSel = (await page.$('button[name="checkout"]')) ? 'button[name="checkout"]' : (await page.$('[name="checkout"]')) ? '[name="checkout"]' : 'a[href*="/checkout"]';
  await page.locator(coSel).first().scrollIntoViewIfNeeded().catch(() => {});
  await wait(600);
  const coW = await where(page, coSel);
  await shot(page, '5a-cart');
  await shot(page, '5a-cart-full', true);
  const co = await tapEl(page, coSel);
  let coUrl = '';
  try { await page.waitForURL(/\/checkouts?\//, { timeout: 30000 }); coUrl = page.url(); } catch (e) { coUrl = 'did not reach checkout: ' + page.url(); }
  await wait(10000);
  const coInfo = await page.evaluate(() => {
    const all = [];
    const walk = (root) => { root.querySelectorAll('*').forEach((e) => { all.push(e); if (e.shadowRoot) walk(e.shadowRoot); }); };
    walk(document);
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
    const labels = all.filter((e) => /^(BUTTON|A|IFRAME|SHOP-PAY-WALLET-BUTTON|DIV)$/.test(e.tagName) && vis(e)).map((e) => `${e.tagName}|${e.getAttribute('aria-label') || ''}|${e.getAttribute('title') || ''}|${e.getAttribute('name') || ''}|${e.getAttribute('data-testid') || ''}`).filter((s) => /shop ?pay|apple ?pay|google ?pay|gpay|paypal|venmo|amazon|meta ?pay|express/i.test(s));
    const inputs = all.filter((e) => e.tagName === 'INPUT' && vis(e)).map((e) => `${e.name || e.id}:${e.type}:${e.getAttribute('placeholder') || e.getAttribute('aria-label') || ''}`);
    const headings = [...document.querySelectorAll('h1,h2,h3')].filter(vis).map((h) => h.innerText.trim()).filter(Boolean).slice(0, 12);
    const shopPay = all.filter((e) => vis(e) && (/shop-pay|shopify-pay|shop_pay/i.test(e.tagName + ' ' + (e.id || '') + ' ' + (typeof e.className === 'string' ? e.className : '') + ' ' + (e.getAttribute('data-testid') || '') + ' ' + (e.getAttribute('aria-label') || '')))).map((e) => e.tagName + '#' + (e.id || '') + ' ' + (e.getAttribute('aria-label') || '')).slice(0, 4);
    const applePay = typeof window.ApplePaySession !== 'undefined';
    return { shopPay, applePaySessionAPI: applePay, title: document.title, express: [...new Set(labels)].slice(0, 20), inputs: inputs.slice(0, 25), headings, text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 500), frames: [...document.querySelectorAll('iframe')].map((f) => (f.title || f.name || f.src || '').slice(0, 80)) };
  }).catch((e) => ({ err: e.message }));
  // express buttons can live inside iframes too
  const frameInfo = [];
  for (const f of page.frames()) { if (f === page.mainFrame()) continue; try { const t = await f.evaluate(() => [...document.querySelectorAll('button,[role=button],div[aria-label]')].map((b) => b.getAttribute('aria-label') || b.innerText).filter(Boolean).join(' | ').slice(0, 200)); if (t) frameInfo.push(f.url().slice(0, 80) + ' :: ' + t); } catch (e) {} }
  await shot(page, '5b-checkout');
  await shot(page, '5b-checkout-full', true);
  const hasContact = (coInfo.inputs || []).some((i) => /email|phone/i.test(i));
  const hasDelivery = (coInfo.inputs || []).some((i) => /address|zip|postal|city/i.test(i));
  step('5 checkout', /\/checkouts?\//.test(coUrl) && hasContact && hasDelivery, { shopPay: coInfo.shopPay, applePaySessionAPI: coInfo.applePaySessionAPI, cart: cartPage, checkoutButton: coW, tap: co.how, coUrl, title: coInfo.title, headings: coInfo.headings, express: coInfo.express, frames: coInfo.frames, frameInfo, hasContact, hasDelivery, inputs: coInfo.inputs, err: coInfo.err });
} catch (e) {
  R.fatal = e.message.split('\n')[0];
  log('FATAL', R.fatal);
  await shot(page, 'fatal');
} finally {
  // ---------------------------------------------------------------- 6. empty the cart
  try {
    if (!/heartside\.io\/(cart|products|\?|$)/.test(page.url())) { await wait(3000); await goto(page, BASE + '/cart'); }
    const c = await page.evaluate(async () => { await fetch('/cart/clear.js', { method: 'POST', credentials: 'same-origin' }); return fetch('/cart.js').then((r) => r.json()); });
    step('6 cart cleared', c.item_count === 0, `item_count=${c.item_count}`);
  } catch (e) { step('6 cart cleared', false, e.message.split('\n')[0]); }
  R.consoleInteresting = R.console.filter(interesting);
  R.failedInteresting = R.failed.filter((s) => interesting(s) && !/monorail|api\/collect|analytics|produce_batch/.test(s));
  R.httpInteresting = R.http.filter((s) => interesting(s));
  fs.writeFileSync(`${OUT}/${tag}-result.json`, JSON.stringify(R, null, 1));
  log('console errors (all):', R.console.length, 'interesting:', JSON.stringify(R.consoleInteresting.slice(0, 15)));
  log('failed reqs interesting:', JSON.stringify(R.failedInteresting.slice(0, 15)));
  log('http>=400 interesting:', JSON.stringify(R.httpInteresting.slice(0, 15)));
  log('notes:', JSON.stringify(R.notes, null, 1));
  await browser.close();
}
