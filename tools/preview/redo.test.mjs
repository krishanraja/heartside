// One redo per gift (27 Oct): a personalised cart line offers "Make another version" once, the new
// version names the design it replaces, and the old line then offers removal to the buyer; nothing
// is removed for them. The product page adds _hs_redo_of only when it arrives from that link.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const A = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', B = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
function row(snapshot, personal = true) {
  const slotHost = {children: [], appendChild(n) { this.children.push(n); n.parentNode = this; }};
  const remove = {hidden: false, clicks: 0, click() { this.clicks++; }};
  // the first product link is the picture's; its cell is the narrow image column (28 Oct)
  const mediaCell = {children: [], appendChild(n) { this.children.push(n); }};
  const link = {getAttribute: () => '/products/your-dogs-illustrated-mug?variant=11', closest: () => mediaCell};
  return {remove, slotHost, mediaCell, getAttribute: k => k === 'data-hs2-cart-line' ? JSON.stringify(snapshot) : k === 'data-hs2-quantity-key' ? (personal ? 'k' : '') : null,
    querySelector: s => s.startsWith('a[') ? link : s === '.cart-items__details' ? slotHost : s === '.cart-items__remove' ? remove : s === '[data-hs2-redo]' ? (slotHost.children[0] || null) : null};
}
const snap = (id, of = '', quantity = 1) => ({key: id, variant_id: 11, quantity, properties: {}, item_components: [{properties: {_customization_id: id, _hs_redo_of: of}}]});
function slotEl() { return {className: '', attrs: {}, innerHTML: '', setAttribute(k, v) { this.attrs[k] = v; }, querySelector(s) { return this.handlers[s] || null; }, handlers: {}, remove() {}}; }
for (const minified of [false, true]) {
  const load = extra => {
    const ctx = Object.assign({URL, location: {href: 'https://example.test/cart'}, track() {}, document: {createElement: () => {
      const el = slotEl();
      Object.defineProperty(el, 'innerHTML', {set(v) { this._h = v; this.handlers = {}; if (/data-hs2-redo-remove/.test(v)) this.handlers['[data-hs2-redo-remove]'] = {addEventListener: (n, fn) => { this.removeFn = fn; }}; if (/data-hs2-redo-go/.test(v)) this.handlers['[data-hs2-redo-go]'] = {addEventListener() {}}; }, get() { return this._h; }});
      return el; }}}, extra);
    const code = ['cartOfferHost', 'cartLineFacts', 'redoOffers'].map(section).join('\n');
    vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, ctx); return ctx;
  };
  test(`${minified ? 'minified' : 'source'}: one redo per gift, and the old version waits for the buyer`, () => {
    const ctx = load();
    const first = row(snap(A)), ordinary = row(snap(B), false), two = row(snap(B, '', 2));
    ctx.redoOffers([first, ordinary, two]);
    const offer = first.slotHost.children[0].innerHTML;
    assert.match(offer, /Not quite right\? Make another version\./); assert.match(offer, new RegExp('redo=' + A)); assert.match(offer, /variant=11/);
    assert.equal(first.mediaCell.children.length, 0, 'the offer sits with the title and price, not under the picture');
    assert.equal(ordinary.slotHost.children.length, 0, 'not a personalised line'); assert.equal(two.slotHost.children.length, 0, 'quantity 1 only');
    // the new version is in the cart: the old line asks, the new one offers no second redo
    const old = row(snap(A)), fresh = row(snap(B, A));
    ctx.redoOffers([old, fresh]);
    assert.match(old.slotHost.children[0].innerHTML, /You made a new version of this gift\. Keep the new one\?/);
    assert.equal(fresh.slotHost.children.length, 0, 'one redo per gift');
    assert.equal(old.remove.clicks, 0, 'nothing is removed for the buyer');
    old.slotHost.children[0].removeFn(); assert.equal(old.remove.clicks, 1, "the buyer's tap uses the cart's own remove");
  });
  test(`${minified ? 'minified' : 'source'}: the product page adds _hs_redo_of only for a real design id from the redo link`, () => {
    for (const [search, expect] of [['?variant=11&redo=' + A, A], ['?variant=11&redo=not-an-id', null], ['?variant=11', null]]) {
      const added = [], adds = [];
      const form = {appendChild: n => { added.push(n); n.parentNode = {removeChild: x => added.splice(added.indexOf(x), 1)}; }};
      const element = () => ({attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }});
      // hsProps() reads only the form's inputs marked data-hs2-prop
      const marked = () => added.filter(n => 'data-hs2-prop' in n.attrs);
      const ctx = {URLSearchParams, window: {location: {search}}, document: {getElementById: () => form, createElement: element, querySelectorAll: () => marked()}, nativeArtworkPurchase: () => true,
        restoredArtworkChosen: () => false, resetBlanketUpload: () => true, journeyCard() {}, onCartAdd: fn => adds.push(fn)};
      const code = section('redoMode') + '\n' + section('hsProps');
      vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, ctx);
      ctx.redoMode();
      if (!expect) { assert.equal(added.length, 0, search); continue; }
      assert.equal(added.length, 1); assert.equal(added[0].name, 'properties[_hs_redo_of]'); assert.equal(added[0].value, expect);
      assert.equal(ctx.hsProps()._hs_redo_of, expect, "the redo link rides into Teeinblue's add request");
      adds[0](); assert.equal(added.length, 0, 'gone once the new version is in the cart');
    }
  });
}
