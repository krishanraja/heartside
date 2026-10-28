// One redo per gift (27 Oct): a personalised cart line offers "Make another version" once, the new
// version names the design it replaces, and the old line then offers removal to the buyer; nothing
// is removed for them. The product page adds _hs_redo_of only when it arrives from that link.
// 28 Oct (order #1008 kept only the first design): the redo key survives edits, the link carries
// only the product, variant and id, the first design is never sent again, the cart is read back
// before "Your new version is in your cart.", a reload keeps the new painting, and the gift list's
// bar stays off the redo page and says "All N gifts" once.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const A = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', B = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
const tick = () => new Promise(r => setImmediate(r));
// the add line clears itself after a minute; that timer must not hold the test process open
const later = (f, ms) => { const t = setTimeout(f, ms); if (ms >= 60000) t.unref(); return t; };
const settle = async () => { for (let i = 0; i < 6; i++) await tick(); };
function row(snapshot, personal = true, href = '/products/your-dogs-illustrated-mug?variant=11') {
  const slotHost = {children: [], appendChild(n) { this.children.push(n); n.parentNode = this; }};
  const remove = {hidden: false, clicks: 0, click() { this.clicks++; }};
  // the first product link is the picture's; its cell is the narrow image column (28 Oct)
  const mediaCell = {children: [], appendChild(n) { this.children.push(n); }};
  const link = {getAttribute: () => href, closest: () => mediaCell};
  return {remove, slotHost, mediaCell, getAttribute: k => k === 'data-hs2-cart-line' ? JSON.stringify(snapshot) : k === 'data-hs2-quantity-key' ? (personal ? 'k' : '') : null,
    querySelector: s => s.startsWith('a[') ? link : s === '.cart-items__details' ? slotHost : s === '.cart-items__remove' ? remove : s === '[data-hs2-redo]' ? (slotHost.children[0] || null) : null};
}
const snap = (id, of = '', quantity = 1) => ({key: id, variant_id: 11, quantity, properties: {}, item_components: [{properties: {_customization_id: id, _hs_redo_of: of}}]});
function slotEl() { return {className: '', attrs: {}, innerHTML: '', setAttribute(k, v) { this.attrs[k] = v; }, querySelector(s) { return this.handlers[s] || null; }, handlers: {}, remove() {}}; }
// a hidden input as a browser keeps it: whatever is assigned becomes text
function hidden() {
  return {attrs: {}, _v: '', setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    get value() { return this._v; }, set value(v) { this._v = String(v); }};
}
const compile = (names, minified) => { const code = names.map(section).join('\n'); return minified ? transformSync(code, {minify: true}).code : code; };

for (const minified of [false, true]) {
  const mode = minified ? 'minified' : 'source';
  const load = extra => {
    const ctx = Object.assign({URL, location: {href: 'https://example.test/cart'}, track() {}, document: {createElement: () => {
      const el = slotEl();
      Object.defineProperty(el, 'innerHTML', {set(v) { this._h = v; this.handlers = {}; if (/data-hs2-redo-remove/.test(v)) this.handlers['[data-hs2-redo-remove]'] = {addEventListener: (n, fn) => { this.removeFn = fn; }}; if (/data-hs2-redo-go/.test(v)) this.handlers['[data-hs2-redo-go]'] = {addEventListener() {}}; }, get() { return this._h; }});
      return el; }}}, extra);
    vm.runInNewContext(compile(['cartOfferHost', 'cartLineFacts', 'redoOffers'], minified), ctx); return ctx;
  };
  test(`${mode}: one redo per gift, and the old version waits for the buyer`, () => {
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
    assert.doesNotMatch(fresh.slotHost.children[0].innerHTML, /Make another version/, 'one redo per gift');
    assert.equal(old.remove.clicks, 0, 'nothing is removed for the buyer');
    old.slotHost.children[0].removeFn(); assert.equal(old.remove.clicks, 1, "the buyer's tap uses the cart's own remove");
  });
  test(`${mode}: both designs in the cart say which is which, and the redo link carries only product, variant and id`, () => {
    const ctx = load();
    const old = row(snap(A)), fresh = row(snap(B, A));
    ctx.redoOffers([old, fresh]);
    assert.match(old.slotHost.children[0].innerHTML, /First version/);
    assert.match(fresh.slotHost.children[0].innerHTML, /New version/);
    // a cart redraw morphs the first line's box back to the server's markup and keeps the element (28 Oct
    // review): the next pass draws the tag again, it is not skipped as already drawn
    const box = old.slotHost.children[0];
    box.innerHTML = '<p>You made a new version of this gift. Keep the new one?</p><button type="button" class="hs2-redo__remove" data-hs2-redo-remove>Remove this version</button>';
    ctx.redoOffers([old, fresh]);
    assert.equal(old.slotHost.children[0], box, 'the same box');
    assert.match(box.innerHTML, /^<p class="hs2-redo__tag">First version<\/p>/, 'the tag is back');
    box.removeFn(); assert.equal(old.remove.clicks, 1, 'and its button still works');
    // drawn and untouched, a pass leaves it alone
    const drawn = box.removeFn; ctx.redoOffers([old, fresh]); assert.equal(box.removeFn, drawn);
    // the first design removed: the new one is just the gift, with no tag and no second redo
    const alone = row(snap(B, A)); ctx.redoOffers([alone]);
    assert.equal(alone.slotHost.children.length, 0);
    // a cart link carrying a vendor id and an edit flag (28 Oct): none of it rides into the redo
    const vendor = row(snap(A), true, `/products/your-dogs-illustrated-mug?variant=11&customization_id=${A}&edit=1`);
    ctx.redoOffers([vendor]);
    const href = /href="([^"]+)"/.exec(vendor.slotHost.children[0].innerHTML)[1];
    assert.equal(href, `/products/your-dogs-illustrated-mug?variant=11&redo=${A}`);
  });

  // the product page side: redoMode, with hsProps reading the form the way Teeinblue's add does
  function productPage({search = '?variant=11&redo=' + A, store = new Map(), cart = {items: []}} = {}) {
    const added = [], adds = [], bars = [], notes = [], resets = [];
    const form = {appendChild: n => { added.push(n); n.parentNode = {removeChild: x => added.splice(added.indexOf(x), 1)}; }};
    const marked = () => added.filter(n => 'data-hs2-prop' in n.attrs);
    const onCartAdd = fn => adds.push(fn);
    const ctx = {URLSearchParams, window: {location: {search}, sessionStorage: {getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v))}},
      document: {getElementById: () => form, createElement: hidden, querySelectorAll: () => marked()}, nativeArtworkPurchase: () => true, productId: () => 7,
      restoredArtworkChosen: () => false, resetBlanketUpload: () => { resets.push(1); return true; }, journeyCard() {}, onCartAdd, shopRoot: () => '/',
      fetch: async url => { assert.equal(url, '/cart.js'); return {ok: true, json: async () => cart}; },
      showNext: (...a) => bars.push(a), checkoutImageStatus: m => notes.push(m)};
    vm.runInNewContext(compile(['redoMode', 'hsProps'], minified), ctx);
    ctx.redoMode();
    return {ctx, added, adds, bars, notes, resets, onCartAdd, store, setCart: c => { cart = c; }};
  }
  test(`${mode}: the product page adds _hs_redo_of only for a real design id from the redo link`, () => {
    for (const search of ['?variant=11&redo=not-an-id', '?variant=11']) {
      const p = productPage({search});
      assert.equal(p.added.length, 0, search); assert.equal(p.resets.length, 0, search);
    }
    const p = productPage();
    assert.equal(p.added.length, 1); assert.equal(p.added[0].name, 'properties[_hs_redo_of]'); assert.equal(p.added[0].value, A);
    assert.equal(p.ctx.hsProps()._hs_redo_of, A, "the redo link rides into Teeinblue's add request");
    assert.equal(p.onCartAdd.redo, A, 'the add wrapper knows which design not to send again');
  });
  test(`${mode}: the new version is confirmed from the cart before it is announced, and kept for a retry when it is missing`, async () => {
    const p = productPage();
    // the add went through but no line names this redo with a new design: say so, keep the key
    p.setCart({items: [{handle: 'your-dogs-illustrated-mug', properties: {_customization_id: A}}]});
    p.adds[0]([{id: 11}]); await settle();
    assert.deepEqual(p.notes, ['Your new version did not reach your cart. Your first design is still there.']);
    assert.equal(p.bars.length, 0); assert.equal(p.added.length, 1, 'the redo key stays for the next try'); assert.equal(p.ctx.redoMode.id, A);
    // the same id coming back under the redo is not a new version either
    p.setCart({items: [{properties: {_customization_id: A, _hs_redo_of: A}}]});
    p.adds[0](null); await settle(); assert.equal(p.bars.length, 0);
    // a line naming the redo with a different design (a bundle's component included)
    p.setCart({items: [{properties: {_customization_id: A}}, {properties: {}, item_components: [{properties: {_customization_id: B, _hs_redo_of: A}}]}]});
    p.adds[0](null); await settle();
    assert.deepEqual(p.bars, [['Your new version is in your cart.', 'Choose which one to keep.', '/cart', 'Choose in cart']]);
    assert.equal(p.added.length, 0, 'the key goes once the new version is in'); assert.equal(p.ctx.redoMode.id, ''); assert.equal(p.onCartAdd.redo, ''); assert.equal(p.ctx.redoMode.landed, true);
  });
  test(`${mode}: the one new paid upload is reset once per redo in a tab, never again on reload`, () => {
    const store = new Map();
    const first = productPage({store}), reload = productPage({store});
    assert.equal(first.resets.length + reload.resets.length, 1);
    assert.equal(store.get('hs2-redo:7:' + A), '1');
    // another redo id is its own new upload
    const other = productPage({store, search: '?redo=' + B}); assert.equal(other.resets.length, 1);
  });
  test(`${mode}: an edit on the redo page keeps _hs_redo_of as the design id, not "undefined"`, () => {
    const p = productPage();
    const keyed = hidden(); keyed.name = 'properties[_hs_art_style]'; keyed.setAttribute('data-hs2-prop', 'art_style');
    const all = () => [...p.added, keyed];
    const ctx = {state: {}, NAMES: ['dog', 'person'], DEFAULTS: {dog: 'Buddy', person: 'Sarah', voice: false}, answer: k => k === 'art_style' ? 'Fine ink drawing' : ({dog: 'Buddy', person: 'Sarah'})[k],
      val: k => ({dog: 'Buddy', person: 'Sarah', voice: false})[k], possessive: n => n + "'s", lines: () => ({}), offerLabel: () => '', answerParams: () => new URLSearchParams(), missingNames: () => [], engaged: () => false,
      bridgeSoon() {}, journeyCard() {}, exhibits() {}, leakUI() {}, drawSoon() {},
      document: {querySelectorAll: s => s === '[data-hs2-prop]' || s === '#hs2-product-form [data-hs2-prop]' ? all() : [], querySelector: () => null, activeElement: null}};
    vm.runInNewContext(compile(['render', 'hsProps'], minified), Object.assign(ctx, {nativeArtworkPurchase: () => true, restoredArtworkChosen: () => false}));
    ctx.render();
    assert.equal(keyed.value, 'Fine ink drawing', 'keyed inputs still follow the answers');
    assert.equal(ctx.hsProps()._hs_redo_of, A);
  });

  // Teeinblue's add request through our wrapper (the transport from checkout-image.test.mjs)
  function transport({redo = A, enabled = false} = {}) {
    const calls = [], status = {textContent: '', hidden: true};
    const redoInput = hidden(); redoInput.name = 'properties[_hs_redo_of]'; redoInput.value = A; redoInput.setAttribute('data-hs2-prop', '');
    class XHR {
      constructor() { this.events = []; this.handlers = {}; this.status = 0; }
      open() {} abort() {} send(body) { calls.push({xhr: true, body}); }
      addEventListener(k, f) { this.handlers[k] = f; } dispatchEvent(e) { this.events.push(e.type); }
    }
    const window = {fetch: async (...args) => { calls.push({args}); return {ok: true, clone: () => ({json: async () => ({id: 11, variant_id: 11})})}; }, XMLHttpRequest: XHR};
    const c = {restoredArtworkChosen: () => false, window, Event, setTimeout: later, clearTimeout, track() {},
      document: {querySelector: s => s.includes('checkout-image-enabled') ? (enabled ? {getAttribute: () => ''} : null) : s.includes('checkout-image-status') ? status : null, querySelectorAll: () => [redoInput]},
      nativeArtworkPurchase: () => true};
    vm.runInNewContext(compile(['hsProps', 'withHsProps', 'checkoutImageConfig', 'checkoutImageStatus', 'prepareCheckoutCart', 'onCartAdd'], minified), c);
    c.onCartAdd(() => {}); c.onCartAdd.redo = redo;
    return {window, calls, status};
  }
  const add = id => JSON.stringify({items: [{id: 11, quantity: 1, properties: {_customization_id: id}}]});
  test(`${mode}: the redo page never sends the first design again, and asks for a new photo without painting`, async () => {
    const t = transport();
    await assert.rejects(t.window.fetch('/cart/add.js', {method: 'POST', body: add(A)}), /first design/);
    assert.equal(t.calls.length, 0, 'nothing reaches the cart');
    assert.equal(t.status.textContent, 'This is still your first design. Add a new photo to make another version.');
    const x = new t.window.XMLHttpRequest(); x.open('POST', '/cart/add.js'); x.send(add(A));
    assert.deepEqual(x.events, ['error', 'loadend']); assert.equal(t.calls.length, 0);
    // a new design goes through, naming the one it replaces
    await t.window.fetch('/cart/add.js', {method: 'POST', body: add(B)});
    assert.equal(t.calls.length, 1);
    const sent = JSON.parse(t.calls[0].args[1].body).items[0].properties;
    assert.equal(sent._customization_id, B); assert.equal(sent._hs_redo_of, A);
    // off a redo page the same id is an ordinary add
    const plain = transport({redo: ''}); await plain.window.fetch('/cart/add.js', {method: 'POST', body: add(A)}); assert.equal(plain.calls.length, 1);
  });

  // the gift list's bar
  function bar({search = '', items = ['your-dogs-illustrated-mug', 'your-dogs-personality-blanket', 'your-dogs-portrait'], pathname = '/products/your-dogs-illustrated-mug'} = {}) {
    const q = [{url: '/products/your-dogs-illustrated-mug', title: 'The mug'}, {url: '/products/your-dogs-personality-blanket', title: 'The blanket'}, {url: '/products/your-dogs-portrait', title: 'The portrait'}];
    let queue = q.slice(); const shown = [], hidden = [], fetched = [];
    const ctx = {location: {pathname, search}, queueGet: () => queue, queueSet: v => { queue = v; }, handleOf: u => (/\/products\/([^/?#]+)/.exec(u || '') || [])[1] || '', shopRoot: () => '/',
      showNext: (...a) => shown.push(a), hideNext: () => hidden.push(1), fetch: async u => { fetched.push(u); return {json: async () => ({items: items.map(handle => ({handle}))})}; }};
    ctx.showNext.held = false;
    vm.runInNewContext(compile(['queueBar'], minified), ctx);
    return {ctx, shown, hidden, fetched, queue: () => queue};
  }
  test(`${mode}: no gift-list bar on a redo page, and "All 3 gifts" only from the add that finished the list`, async () => {
    const redo = bar({search: '?variant=11&redo=' + A});
    redo.ctx.queueBar(); redo.ctx.queueBar([{id: 11}]); await settle();
    assert.equal(redo.shown.length, 0, 'no bar over the new version'); assert.ok(redo.hidden.length >= 1, 'a bar left from before goes');
    // a plain page load that finds the whole list in the cart ends the list quietly
    const load = bar(); load.ctx.queueBar(); await settle();
    assert.equal(load.shown.length, 0); assert.equal(load.queue().length, 0);
    // the add that put the last gift in says it once, then the list is done
    const done = bar(); done.ctx.queueBar([{id: 11}]); await settle();
    assert.deepEqual(done.shown.map(a => [...a]), [['All 3 gifts are in your cart', 'Free US shipping on every order.', '/checkout', 'Check out']]);
    assert.equal(done.queue().length, 0);
    // still gifts to go: the next one, as before
    const next = bar({items: ['your-dogs-illustrated-mug']}); next.ctx.queueBar([{id: 11}]); await settle();
    assert.equal(next.shown[0][0], 'Next: The blanket'); assert.equal(next.queue().length, 3);
  });
  test(`${mode}: the redo's confirmation is not replaced by a later bar until the buyer closes it`, () => {
    const classes = new Set(), body = {children: [], appendChild(n) { this.children.push(n); }};
    const el = () => { const e = {attrs: {}, children: {}, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener() {}, remove() { body.children.splice(body.children.indexOf(e), 1); }};
      Object.defineProperty(e, 'innerHTML', {set() { e.children = {strong: {textContent: ''}, '.hs2-next__text span': {textContent: ''}, '.hs2-next__go': {textContent: '', href: ''}, '.hs2-next__x': {addEventListener() {}}}; }});
      e.querySelector = s => e.children[s]; return e; };
    const ctx = {location: {pathname: '/products/your-dogs-illustrated-mug'}, giftFit() {}, queueSet() {},
      document: {createElement: el, body, querySelector: s => s === '[data-hs2-next]' ? body.children[0] || null : null, documentElement: {classList: {add: c => classes.add(c), remove: c => classes.delete(c)}}}};
    vm.runInNewContext(compile(['hideNext', 'showNext'], minified), ctx);
    ctx.showNext('Your new version is in your cart.', 'Choose which one to keep.', '/cart', 'Choose in cart'); ctx.showNext.held = true;
    ctx.showNext("Pip's gift is in your cart.", 'Free US shipping on every order.', '/?step=choose', 'Add another gift');
    assert.equal(body.children[0].querySelector('strong').textContent, 'Your new version is in your cart.');
    ctx.hideNext(); assert.equal(body.children.length, 0); assert.equal(ctx.showNext.held, false);
    ctx.showNext("Pip's gift is in your cart.", 'Free US shipping on every order.', '/?step=choose', 'Add another gift');
    assert.equal(body.children[0].querySelector('strong').textContent, "Pip's gift is in your cart.");
  });
}
