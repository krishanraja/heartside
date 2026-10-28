// The cart as a buyer sees it, in real Chromium (28 Oct recordings and the 390x844 audit):
//  - phone lines (A19): the design beside a wide text column, the price under the title, the controls
//    across the card, "One per design" on one line, nothing past the card's edge; the Artist's touch
//    form's controls fit and are 16px (N1); the Artist's touch line sits under its gift, indented and
//    smaller (A9b);
//  - no late pop-in: the redo offer, the Artist's touch offer, the bundle line and the shipping line
//    arrive without moving Check out;
//  - the drawer lies over the page: opening it moves neither the header nor the gallery, and its
//    prices, Discount and Check out keep a gutter from the right edge.
// cart-products.liquid is rendered by liquidjs (cart-fixture.mjs) with the snippet's own stylesheet,
// hs-brand.css and hs2.css, inside Helio's captured header and drawer markup and the preview's
// stand-in CSS; the cart script is the real one, sliced from hs2.js. Helio's own stylesheet is not in
// this repo, so its drawer is a stand-in modelled on Recording 3 (05:16 to 05:17): opened beside the
// page, the page narrowed by the drawer's width, the drawer's box running past the right edge.
// Nothing leaves localhost.
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';
import {renderCart, gift, addon, asset, ID, ID2, HELIO_TOKENS} from './cart-fixture.mjs';

const fixture = name => readFileSync(new URL('./fixtures/' + name, import.meta.url), 'utf8');
const hs2 = asset('hs2.js');
const part = name => { const i = hs2.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return hs2.slice(i, hs2.indexOf('\n  function ', i + 1)); };
const cartScript = minified => {
  const code = ['norm', 'cartArtworkImage', 'cartLineFacts', 'cartOfferHost', 'redoOffers', 'bundleLine', 'artistTouch', 'cartTidy', 'cartDesignRetry', 'cartPicture'].map(part).join('\n');
  return `(function () {
  var CART_DROP_PROPS = /^available product$/i, CART_DROP_VALUES = /^(default|default title|1 pc|one size)$/i, cartImages = {};
  var ADDON_TAGS = ['Another photo of my dog', 'Favorite toy', 'Collar or accessory', 'Something else'];
  function track() {}
  function shopRoot() { return '/'; }
  ${minified ? transformSync(code, {minify: true}).code : code}
  window.__cartTidy = cartTidy;
})();`;
};
const css = {brand: asset('hs-brand.css'), hs2: asset('hs2.css'), standin: fixture('standin.css')};

// a plain PNG, no dependencies
function png(w, h, [r, g, b]) {
  const table = Array.from({length: 256}, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xFFFFFFFF; for (const x of buf) c = table[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3).map((_, i) => [r, g, b][i % 3])]);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(Array(h).fill(row)))), chunk('IEND', Buffer.alloc(0))]);
}
const IMAGE = png(60, 60, [200, 150, 120]);
// every Shopify and capture address points here instead
const local = html => html.replace(/https:\/\/cdn\.shopify\.com\//g, '/cdn/').replace(/\/\/cdn\.example\/file\.png/g, '/img/file.png');

const UPLOAD = 'https://cdn.shopify.com/s/files/1/1/2/3/uploads/0f3c9a7d2e1b4c5a8d6e9f0a1b2c3d4e.jpg';
// a mug with its artist's touch, and a second mug that is offered one
const lines = () => [
  gift(0, ID, {props: {'Your note': 'On the hard days, I stay right beside you.', Signed: 'Love, Pickle'}}),
  addon(1, ID, {Delivery: 'Adds 5 days', 'Photo 1 (favorite toy)': UPLOAD}),
  gift(2, ID2),
];
// /cart.js for those lines: two gifts save, one gets the nudge
const cartJs = items => JSON.stringify({items: items.map(it => ({key: it.key, product_title: it.product.title, properties: it.properties})),
  total_discount: items.filter(it => !it.properties._hs_addon_for).length > 1 ? 1490 : 0});
const summary = `<div class="cart-summary"><div class="cart-totals"><div class="cart-totals__item cart-totals__total"><span>Estimated total</span><span class="hs-total">$74.00 USD</span></div></div>
<div class="cart-totals__item cart-totals__tax-note cart-primary-typography"><small>Taxes and <a href="/policies/shipping-policy">shipping</a> calculated at checkout. </small></div>
<button type="submit" form="cart-form" name="checkout" class="button cart__checkout-button">Check out</button></div>`;
const memo = '<div class="hs2-memo" data-hs2-memo data-hs-bundle-live data-hs-artist-variant="777" data-hs-artist-price="$29" hidden></div>';
const head = extra => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>${HELIO_TOKENS}</style><style>${css.standin}</style><style>${extra}</style><style>${css.brand}</style><style>${css.hs2}</style></head>`;
async function cartPage(minified, items = lines()) {
  const {html, css: own} = await renderCart(items);
  return {cart: cartJs(items), html: local(`${head(own)}<body>${memo}<main id="MainContent"><cart-items-component class="cart-items-component" data-section-id="main"><div class="section section--page-width"><div class="cart-page"><div class="cart-page__items">${html}</div><div class="cart-page__summary">${summary}</div></div></div></cart-items-component></main>
<script>${cartScript(minified)}</script></body></html>`)};
}

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });
async function open({html, cart = cartJs(lines())}, viewport, path = '/cart') {
  const tab = await browser.newPage({viewport}), offsite = [], errors = [];
  tab.on('pageerror', e => errors.push(String(e)));
  await tab.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost') { offsite.push(url.href); return route.abort(); }
    if (url.pathname === path) return route.fulfill({contentType: 'text/html', body: html});
    if (url.pathname === '/cart.js') return route.fulfill({contentType: 'application/json', body: cart});
    if (/^\/(cdn|mock|img)\//.test(url.pathname)) return route.fulfill({contentType: 'image/png', body: IMAGE});
    return route.fulfill({status: 404, body: ''});
  });
  await tab.goto('http://localhost' + path);
  return {tab, offsite, errors};
}
// the cart script has run its course: the offers in place, the bundle line and the shipping line in
// (the bundle line as a tax note's first line, or as the element it was before 28 Oct)
const settled = async (tab, errors) => {
  try {
    await tab.waitForFunction(() => {
      const note = document.querySelector('.cart-totals__tax-note');
      return note && note.hasAttribute('data-hs-note') && (note.getAttribute('data-hs2-bundle-say') || document.querySelector('[data-hs2-bundle-line]')) && document.querySelector('[data-hs2-artist]');
    }, null, {timeout: 10000});
  } catch (e) {
    const state = await tab.evaluate(() => { const note = document.querySelector('.cart-totals__tax-note'); return {note: note && note.outerHTML.slice(0, 300), artist: !!document.querySelector('[data-hs2-artist]'), slot: !!document.querySelector('[data-hs2-artist-slot]')}; });
    throw new Error('the cart script did not finish: ' + JSON.stringify({state, errors}));
  }
  await tab.waitForTimeout(250);
};

for (const minified of [false, true]) {
  const mode = minified ? 'minified' : 'source';
  for (const viewport of [{width: 375, height: 812}, {width: 390, height: 844}]) test(`${mode}: phone cart at ${viewport.width}: a wide text column, the price under the title, controls across, everything inside the card`, async () => {
    const {tab, offsite, errors} = await open(await cartPage(minified), viewport);
    try {
      await tab.evaluate(() => window.__cartTidy());
      await settled(tab, errors);
      await tab.evaluate(() => { document.querySelector('[data-hs2-artist]').open = true; });
      const r = await tab.evaluate(() => {
        const rect = el => el.getBoundingClientRect();
        const giftRow = document.querySelector('#CartItem-101\\:merged-0'), addonRow = document.querySelector('#CartItem-777\\:addon-1');
        const box = rect(giftRow), pad = parseFloat(getComputedStyle(giftRow).paddingLeft) + parseFloat(getComputedStyle(giftRow).paddingRight);
        const info = rect(giftRow.querySelector('.cart-items__product-info')), title = rect(giftRow.querySelector('.cart-items__title')), price = rect(giftRow.querySelector('.cart-items__price'));
        const visible = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && !el.closest('.visually-hidden, .hidden, [hidden]') && rect(el).width > 0; };
        const outside = row => [...row.querySelectorAll('*')].filter(visible).filter(el => rect(el).right > rect(row).right + 1 || rect(el).left < rect(row).left - 1).map(el => el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' ' + Math.round(rect(el).right) + '>' + Math.round(rect(row).right));
        const onePer = giftRow.querySelector('.hs2-one-per'), lh = parseFloat(getComputedStyle(onePer).fontSize) * 1.6;
        const controls = [...document.querySelectorAll('[data-hs2-artist] :is(select, textarea, input[type="file"])')];
        return {
          ratio: info.width / (box.width - pad), priceUnderTitle: price.top >= title.bottom - 1 && Math.abs(price.left - info.left) <= 2,
          outsideGift: outside(giftRow), outsideAddon: outside(addonRow),
          onePerLines: rect(onePer).height <= lh, quantityWidth: rect(giftRow.querySelector('.cart-items__quantity')).width / (box.width - pad),
          controls: controls.map(c => ({font: parseFloat(getComputedStyle(c).fontSize), inside: rect(c).right <= box.right + 1 && rect(c).left >= box.left - 1})),
          indent: rect(addonRow).left - box.left, thumbs: rect(addonRow.querySelector('.cart-items__media')).width / rect(giftRow.querySelector('.cart-items__media')).width,
          badge: !!addonRow.querySelector('.hs2-cart-addon-badge') && visible(addonRow.querySelector('.hs2-cart-addon-badge')),
        };
      });
      assert.ok(r.ratio >= 0.6, `the text column is ${Math.round(r.ratio * 100)}% of the card, not a sliver`);
      assert.ok(r.priceUnderTitle, 'the price sits under the title');
      assert.deepEqual(r.outsideGift, [], 'nothing runs past the gift card');
      assert.deepEqual(r.outsideAddon, [], "nothing runs past the artist's touch card");
      assert.ok(r.onePerLines, '"One per design" on one line');
      assert.ok(r.quantityWidth >= 0.95, 'the controls take the card\'s width');
      assert.equal(r.controls.length, 7, 'the form is open: 3 tags, 3 photos, the notes');
      assert.deepEqual(r.controls.filter(c => c.font < 16 || !c.inside), [], 'every control fits the card and is 16px, so an iPhone never zooms');
      assert.ok(r.indent >= 12, `the artist's touch is tucked under its gift (indent ${Math.round(r.indent)}px)`);
      assert.ok(r.thumbs <= 0.8, 'and smaller');
      assert.ok(r.badge, 'with its brush');
      assert.deepEqual(offsite, []); assert.deepEqual(errors, []);
    } finally { await tab.close(); }
  });

  for (const viewport of [{width: 390, height: 844}, {width: 1280, height: 900}]) test(`${mode}: at ${viewport.width}, the offers, the bundle line and the shipping line arrive without moving Check out`, async () => {
    const {tab, offsite, errors} = await open(await cartPage(minified, [gift(0, ID2)]), viewport);
    try {
      const where = () => tab.evaluate(() => Math.round(document.querySelector('[name="checkout"]').getBoundingClientRect().top * 10) / 10);
      const first = await where();
      // the redo offer drawn with the line is the one hs2.js redoOffers writes: taking it over changes nothing
      const redo = () => tab.evaluate(() => { const slot = document.querySelector('[data-hs2-redo]'); return slot && slot.innerHTML.replace(/&amp;/g, '&'); });
      const drawn = await redo();
      await tab.evaluate(() => window.__cartTidy());
      await settled(tab, errors);
      const then = await where();
      assert.ok(Math.abs(then - first) <= 1, `Check out moved ${then - first}px after paint`);
      assert.ok(drawn, 'the redo offer is there from the first paint');
      assert.equal(await redo(), drawn, 'and the script writes the same offer');
      const arrived = await tab.evaluate(() => ({
        redo: !!document.querySelector('[data-hs2-redo-go]'), artist: !!document.querySelector('[data-hs2-artist-slot] [data-hs2-artist]'),
        bundle: getComputedStyle(document.querySelector('.cart-totals__tax-note'), '::before').content,
        shipping: document.querySelector('.cart-totals__tax-note small').textContent,
      }));
      assert.ok(arrived.redo && arrived.artist, 'the offers are there');
      assert.match(arrived.bundle, /Add a second gift and save 15%\. Three saves 20%\./);
      assert.equal(arrived.shipping, 'Free US shipping on every order. Any tax is shown at checkout.');
      assert.deepEqual(offsite, []); assert.deepEqual(errors, []);
    } finally { await tab.close(); }
  });
}

// ------------------------------------------------------------------ the drawer
// Helio's drawer opened beside the page (squeeze): three ways it could narrow the page, all seen as the
// same thing in the recording; and the drawer's box, its width plus its padding, past the right edge.
const SQUEEZE = {
  margin: 'html:has(#cart-drawer dialog[open]) body { margin-inline-end: var(--drawer-width); }',
  width: 'html:has(#cart-drawer dialog[open]) body { width: calc(100% - var(--drawer-width)); }',
  padding: 'html:has(#cart-drawer dialog[open]) { padding-right: var(--drawer-width); }',
};
const HELIO_DRAWER = `:root { --drawer-width: min(420px, 100vw); }
#cart-drawer .theme-drawer__dialog { position: fixed; top: 0; bottom: 0; left: calc(100% - var(--drawer-width)); width: var(--drawer-width); height: 100%; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; overflow-y: auto; }
#cart-drawer .cart-drawer__inner { padding: 0 24px 24px; }
#cart-drawer .theme-drawer__header { display: flex; justify-content: space-between; align-items: center; min-height: 64px; }
#cart-drawer .cart-discount { display: flex; justify-content: space-between; padding: 12px 0; }
#cart-drawer .cart-totals__total { display: flex; justify-content: space-between; }
.gallery { max-width: 1200px; margin: 0 auto; padding: 24px 16px; box-sizing: border-box; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; }
.gallery img { width: 100%; height: auto; display: block; }`;
async function drawerPage(model) {
  const {html: rows, css: own} = await renderCart(lines(), {context: 'drawer'});
  const header = fixture('helio-header.html');
  const shell = fixture('helio-drawer.html');
  const drawer = shell.slice(0, shell.indexOf('</div>', shell.indexOf('</theme-drawer>')) + '</div>'.length);
  const items = drawer.lastIndexOf('<div class="cart-drawer__items">'), end = drawer.indexOf('</cart-items-component>', items);
  const filled = drawer.slice(0, items) + `<div class="cart-drawer__items">${rows}</div><div class="cart-drawer__summary"><div class="cart-discount"><span>Discount</span><button type="button" class="hs-discount" aria-label="Add a discount">+</button></div>${summary}</div></div>` + drawer.slice(end);
  return {html: local(`${head(own + HELIO_DRAWER + SQUEEZE[model])}<body>${memo}<div id="header-group">${header.slice(header.indexOf('<header id="shopify-section-'))}</div>${filled}
<main id="MainContent"><div class="gallery"><img class="gallery__img" src="/img/a.png" width="600" height="600" alt=""><div><p>Your dog's portrait, wrapped around a mug.</p></div></div></main></body></html>`)};
}
for (const model of Object.keys(SQUEEZE)) for (const viewport of [{width: 1280, height: 900}, {width: 390, height: 844}]) test(`the drawer lies over the page (${model} squeeze, ${viewport.width}): nothing moves, and nothing touches the right edge`, async () => {
  const {tab, offsite, errors} = await open(await drawerPage(model), viewport, '/products/your-dogs-illustrated-mug');
  try {
    const marks = () => tab.evaluate(() => {
      const x = sel => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); return {left: Math.round(r.left), width: Math.round(r.width)}; };
      return {logo: x('.header-logo'), actions: x('header-actions'), gallery: x('.gallery__img')};
    });
    const shut = await marks();
    await tab.evaluate(() => document.querySelector('#cart-drawer dialog').show());
    await tab.waitForTimeout(100);
    const open = await marks();
    assert.deepEqual(open, shut, 'the header and the gallery stay where they were');
    const edge = await tab.evaluate(() => {
      const width = document.documentElement.clientWidth, dialog = document.querySelector('#cart-drawer dialog').getBoundingClientRect();
      const right = sel => [...document.querySelectorAll(sel)].map(el => Math.round(width - el.getBoundingClientRect().right));
      return {width, dialog: {left: Math.round(dialog.left), right: Math.round(dialog.right)}, gutters: [...right('#cart-drawer [name="checkout"]'), ...right('#cart-drawer .hs-discount'), ...right('#cart-drawer .hs-total'), ...right('#cart-drawer .cart-items__price')]};
    });
    assert.ok(edge.dialog.right <= edge.width && edge.dialog.left >= 0, `the drawer is wholly on screen (${edge.dialog.left} to ${edge.dialog.right} of ${edge.width})`);
    assert.equal(edge.gutters.length, 6, 'Check out, Discount, the total and three line prices');
    assert.deepEqual(edge.gutters.filter(g => g < 12), [], `Check out, Discount and the prices keep a gutter (${edge.gutters.join(', ')})`);
    assert.deepEqual(offsite, []); assert.deepEqual(errors, []);
  } finally { await tab.close(); }
});
