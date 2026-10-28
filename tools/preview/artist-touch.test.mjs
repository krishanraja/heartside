// Artist's touch (27 Oct, fixed 28 Oct). Offered on a personalized cart line once the add-on product
// exists, in the place cart-products.liquid keeps for it, never twice for one design and never in the
// drawer; it needs the buyer's notes and goes in as its own line linked by _hs_addon_for, with the
// 5 days it adds as a visible Delivery property and tagged photos as file properties. In the cart,
// each add-on sits right after the gift it reworks (A9a) and names it (A9d); a gift the checkout
// transform did not merge is still its gift (N4).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {renderCart, gift, addon, ordinary, rowKeys, rowOf, ID, ID2} from './cart-fixture.mjs';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const A = ID;
const TAGS = ['Another photo of my dog', 'Favorite toy', 'Collar or accessory', 'Something else'];

// the offer's <details>, as artistTouch fills it: three photo slots, the notes, the button
function box() {
  const files = [{name: 'toy.jpg'}];
  const photos = [0, 1, 2].map(i => {
    const text = {textContent: 'Choose photo ' + (i + 1)};
    const input = {files: i === 0 ? files : [], handlers: {}, addEventListener(n, f) { this.handlers[n] = f; }, parentNode: {querySelector: s => (s === '[data-hs-file-text]' ? text : null)}};
    const tag = {value: TAGS[i]};
    return {input, text, tag, querySelector: s => (s === '[data-hs2-artist-file]' ? input : s === '[data-hs2-artist-tag]' ? tag : null)};
  });
  const notes = {value: ''}, status = {textContent: ''}, button = {disabled: false, addEventListener(n, fn) { this.click = fn.bind(this); }};
  return {className: '', attrs: {}, innerHTML: '', parentNode: null, photos, notes, status, button, setAttribute(k, v) { this.attrs[k] = v; },
    querySelector(s) { return s === '[data-hs2-artist-add]' ? button : s === '[data-hs2-artist-notes]' ? notes : s === '[data-hs2-artist-status]' ? status : null; },
    querySelectorAll(s) { return s === '[data-hs2-artist-file]' ? photos.map(p => p.input) : s === '.hs2-artist__photo' ? photos : []; }};
}
function holder() {
  return {children: [], parentNode: null,
    appendChild(n) { n.parentNode = this; this.children.push(n); return n; },
    removeChild(n) { this.children.splice(this.children.indexOf(n), 1); n.parentNode = null; return n; },
    querySelector(s) { return s === '[data-hs2-artist]' ? this.children.find(n => n.className === 'hs2-artist') || null : null; }};
}
// a cart row: the details cell (title and price) hosts the offers; `slot` is the place the Liquid keeps
function row(props, personal, {slot = false, drawer = false} = {}) {
  const host = holder(), kept = slot ? host.appendChild(holder()) : null;
  const all = () => [...host.children, ...(kept ? kept.children : [])];
  return {host, kept,
    closest: s => (drawer && s === '[data-drawer]' ? {} : null),
    getAttribute: k => (k === 'data-hs2-cart-line' ? JSON.stringify({quantity: 1, properties: props, item_components: personal ? [{properties: {_customization_id: A}}] : []}) : k === 'data-hs2-quantity-key' ? (personal ? 'k' : '') : null),
    // the details cell (title and price), never the picture's cell (28 Oct)
    querySelector: s => (s === '.cart-items__details' ? host
      : s === '[data-hs2-artist-slot]' ? (kept && kept.parentNode ? kept : null)
      : s === '[data-hs2-artist]' ? all().find(n => n.className === 'hs2-artist') || null
      : s === '[data-hs2-artist-orphan]' ? all().find(n => n.className === 'hs2-artist__orphan') || null
      : s.startsWith('a[') ? {closest: () => ({appendChild() { throw new Error('offer in the picture column'); }})} : null)};
}
for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: the artist's touch fills its kept place once per design, and sends notes, the 5 days and tagged photos`, async () => {
  const posts = [], made = [];
  let memo = null;
  const ctx = {location: {pathname: '/cart', reload() {}}, FormData, track() {}, shopRoot: () => '/', ADDON_TAGS: TAGS,
    fetch: (url, o) => { posts.push([url, o.body]); return Promise.resolve({ok: true, json: async () => ({})}); },
    document: {querySelector: s => (s === '[data-hs-artist-variant]' ? memo : null),
      createElement: tag => { if (tag === 'details') { const b = box(); made.push(b); return b; } const p = {className: '', attrs: {}, textContent: '', setAttribute(k, v) { this.attrs[k] = v; }}; made.push(p); return p; }}};
  vm.runInNewContext(['cartOfferHost', 'cartLineFacts', 'artistTouch'].map(section).map(c => (minified ? transformSync(c, {minify: true}).code : c)).join('\n'), ctx);
  // no add-on product yet: no offer, and the kept place goes rather than stay empty
  const early = row({}, true, {slot: true});
  ctx.artistTouch([early]);
  assert.equal(early.host.children.length, 0, 'hidden until the add-on product exists, its place gone');
  memo = {getAttribute: k => (k === 'data-hs-artist-variant' ? '777' : '$29')};
  const gift1 = row({}, true, {slot: true});
  ctx.artistTouch([gift1, row({}, false)]);
  const offer = made.find(m => m.className === 'hs2-artist');
  assert.ok(offer, 'offered');
  assert.equal(gift1.kept.children[0], offer, 'in the place the Liquid kept for it, so nothing below moves');
  assert.deepEqual(gift1.host.children, [gift1.kept]);
  assert.match(offer.innerHTML, /Artist's touch, \$29\. Adds 5\u00a0days\./, '"Adds 5 days" never splits');
  assert.doesNotMatch(offer.innerHTML, /Krish/);
  // each photo starts on its own tag, and the picker names the photo
  assert.deepEqual([...offer.innerHTML.matchAll(/<option selected>([^<]+)</g)].map(m => m[1]), TAGS.slice(0, 3));
  assert.equal((offer.innerHTML.match(/<label class="hs-file"><input type="file"/g) || []).length, 3);
  offer.photos[0].input.handlers.change();
  assert.equal(offer.photos[0].text.textContent, 'toy.jpg');
  offer.button.click(); assert.equal(posts.length, 0, 'notes come first'); assert.match(offer.status.textContent, /what to change/);
  offer.notes.value = 'Make the ears floppier.'; offer.button.click(); await new Promise(r => setImmediate(r));
  const [url, body] = posts[0];
  assert.equal(url, '/cart/add.js'); assert.equal(body.get('id'), '777'); assert.equal(body.get('properties[_hs_addon_for]'), A);
  assert.equal(body.get('properties[What to change]'), 'Make the ears floppier.');
  assert.equal(body.get('properties[Delivery]'), 'Adds 5 days', 'the delay shows in the cart, checkout, the order and the packing slip');
  assert.deepEqual([...body.keys()].filter(k => /Photo/.test(k)), ['properties[Photo 1 (another photo of my dog)]'], 'one colon only, the one the cart adds');
  const withAddon = row({}, true, {slot: true}), addonRow = row({_hs_addon_for: A}, false); ctx.artistTouch([withAddon, addonRow]);
  assert.equal(withAddon.host.children.length, 0, 'never twice for one design, and its kept place goes');
  assert.equal(addonRow.host.children.length, 0, 'an add-on beside its gift says nothing');
  // N4: a gift the checkout transform did not merge (no quantity key) is still its gift
  const unmerged = row({_customization_id: A}, false), beside = row({_hs_addon_for: A}, false);
  ctx.artistTouch([unmerged, beside]);
  assert.equal(beside.host.children.length, 0, 'not called an orphan while its gift is right there');
  const orphan = row({_hs_addon_for: A}, false); ctx.artistTouch([orphan]);
  assert.equal(orphan.host.children.length, 1, 'an add-on whose gift left the cart says so');
  assert.match(made.at(-1).textContent, /no longer in your cart/);
  // the drawer never carries the offer
  const before = made.length, inDrawer = row({}, true, {slot: true, drawer: true});
  ctx.artistTouch([inDrawer]);
  assert.equal(made.length, before); assert.equal(inDrawer.host.children.length, 0);
});

test("each Artist's touch is listed right after the gift it reworks, keeping Shopify's line numbers (A9a)", async () => {
  const {html} = await renderCart([addon(0, ID), gift(1, ID), ordinary(2)]);
  assert.deepEqual(rowKeys(html), ['101:merged-1', '777:addon-0', '456:plain-2']);
  assert.deepEqual([...html.matchAll(/data-hs-line="(\d+)"/g)].map(m => m[1]), ['2', '1', '3'], 'each row keeps its own line number');
  assert.match(rowOf(html, '777:addon-0'), /on:click="\/onLineItemRemove\/1"/, 'remove still names the right line');
  // two gifts, each with its add-on, and one add-on whose gift has gone: it stays where Shopify put it
  const lost = 'cccccccc-3333-4333-8333-cccccccccccc';
  const many = await renderCart([addon(0, ID2), gift(1, ID), addon(2, lost), gift(3, ID2), addon(4, ID)]);
  assert.deepEqual(rowKeys(many.html), ['101:merged-1', '777:addon-4', '777:addon-2', '101:merged-3', '777:addon-0']);
  assert.match(rowOf(many.html, '777:addon-4'), /class="cart-items__table-row hs2-addon-line"/, 'tucked under its gift');
  assert.doesNotMatch(rowOf(many.html, '777:addon-2'), /hs2-addon-line/, 'an orphan is not tucked under anything');
  assert.match(rowOf(many.html, '777:addon-2'), /<p class="hs2-artist__orphan" data-hs2-artist-orphan role="status">The design this rework was for is no longer in your cart\./, 'and says so from the first paint');
});

test("an Artist's touch names the gift it reworks and the 5 days it adds (A9d)", async () => {
  const old = rowOf((await renderCart([gift(0, ID), addon(1, ID)])).html, '777:addon-1');
  assert.match(old, /<p class="hs2-addon-for">For the Illustrated Mug\. Adds 5&nbsp;days\.<\/p>/, 'a line from before the Delivery property says it here');
  const now = rowOf((await renderCart([gift(0, ID), addon(1, ID, {Delivery: 'Adds 5 days'})])).html, '777:addon-1');
  assert.match(now, /<p class="hs2-addon-for">For the Illustrated Mug<\/p>/);
  assert.match(now, /<dt>Delivery:<\/dt>\s*<dd>Adds 5 days<\/dd>/, 'said once, by the property');
  assert.doesNotMatch(rowOf((await renderCart([gift(0, ID)])).html, '101:merged-0'), /hs2-addon-for/);
});
