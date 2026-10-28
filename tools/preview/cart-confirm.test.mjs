// One confirmation per add (28 Oct recordings). Teeinblue's green line, our toast and the cart drawer
// fired together, the toast stayed up 30 seconds over the page, and the drawer opened on "Your cart is
// empty", then 1 item, then 2 within 4 seconds. Now Helio hears once, after the gift and its Artist's
// touch are both in the cart, with the cart and the drawer's own new markup already read; when the
// drawer opens it is the confirmation, and the toast shows only when it does not, going after 8
// seconds, a scroll past 600px or on leaving the page. The real announceAdd, on a controlled clock.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const ID = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const flush = async () => { for (let i = 0; i < 6; i++) await new Promise(r => setImmediate(r)); };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return {promise, resolve}; };

function shop({drawer = true, opens = true, list = [], addon = null} = {}) {
  let now = 0, seq = 0;
  const timers = [], dispatched = [], fetched = [], toasts = [], hidden = [], listeners = {};
  const dialog = {open: false}, bar = {current: null};
  const drawerEl = {closest: s => (s === 'dialog' ? dialog : null)};
  const cart = {token: 'never-shown', item_count: 2, total_price: 7400, currency: 'USD', discount_codes: [],
    items: [{key: '101:a', id: 1, quantity: 1, final_line_price: 4500}, {key: '777:b', id: 2, quantity: 1, final_line_price: 2900}]};
  const respond = body => Promise.resolve({ok: true, json: async () => body});
  const ctx = {Event: globalThis.Event, GID: 'gid://shopify/', Intl,
    setTimeout: (fn, ms = 0) => { timers.push({fn, at: now + ms, id: ++seq}); return seq; },
    clearTimeout: id => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
    extrasAfterAdd: {pending: addon}, confirmAdds: {done: true},
    queueGet: () => list, shopRoot: () => '/', answer: k => (k === 'dog' ? 'Pip' : ''), possessive: n => n + "'s",
    showNext(title) { const strong = {textContent: title}; bar.current = {parentNode: {}, querySelector: s => (s === 'strong' ? strong : null)}; toasts.push(title); },
    hideNext() { if (bar.current) { bar.current.parentNode = null; bar.current = null; } hidden.push(now); },
    fetch(url) {
      fetched.push(url);
      if (url === '/cart.js') return respond(cart);
      if (url === '/?sections=cart-drawer-section') return respond({'cart-drawer-section': '<div id="shopify-section-cart-drawer-section">two lines</div>'});
      return Promise.reject(new Error('unexpected ' + url));
    },
    window: {scrollY: 0, addEventListener(type, f) { (listeners[type] = listeners[type] || []).push(f); }, removeEventListener(type, f) { listeners[type] = (listeners[type] || []).filter(g => g !== f); }},
    document: {
      querySelector: s => (s === 'cart-icon, cart-drawer-component' ? (drawer ? drawerEl : null) : s === 'cart-drawer-component' ? (drawer ? drawerEl : null)
        : s === '#cart-drawer dialog[open]' ? (dialog.open ? dialog : null) : s === '[data-hs2-next]' ? bar.current : null),
      querySelectorAll: s => (s === 'cart-items-component[data-section-id]' && drawer ? [{getAttribute: () => 'cart-drawer-section'}] : []),
      // Helio's drawer: auto-open on an add, once the promise says what is in the cart
      dispatchEvent(ev) { dispatched.push(ev); if (opens && ev.action === 'add') ev.promise.then(() => { dialog.open = true; }); return true; },
    }};
  const advance = async ms => {
    const until = now + ms;
    for (;;) {
      await flush();
      timers.sort((a, b) => a.at - b.at || a.id - b.id);
      const next = timers[0];
      if (!next || next.at > until) break;
      timers.shift(); now = next.at; next.fn();
    }
    now = until; await flush();
  };
  const scroll = y => { ctx.window.scrollY = y; (listeners.scroll || []).slice().forEach(f => f()); };
  const leave = () => (listeners.pagehide || []).slice().forEach(f => f());
  return {ctx, dialog, dispatched, fetched, toasts, hidden, bar, advance, scroll, leave, listeners};
}
const gift = [{variant_id: 5, quantity: 1, properties: {_customization_id: ID}}];

for (const minified of [false, true]) {
  const load = s => { const code = ['money', 'cartForEvent', 'announceAdd'].map(section).join('\n'); vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, s.ctx); return s; };
  const mode = minified ? 'minified' : 'source';

  test(`${mode}: the drawer hears once, after the gift and its artist's touch, and opens on the finished cart with no toast`, async () => {
    const addon = deferred(), s = load(shop({addon: addon.promise}));
    s.ctx.announceAdd(gift);
    await s.advance(0);
    assert.equal(s.dispatched.length, 0, 'nothing while the artist\'s touch is on its way');
    assert.deepEqual(s.fetched, []);
    addon.resolve(true);
    await s.advance(0);
    assert.equal(s.dispatched.length, 1, 'one announcement');
    const ev = s.dispatched[0];
    assert.equal(ev.type, 'shopify:cart:lines-update'); assert.equal(ev.action, 'add');
    const {detail, cart} = await ev.promise;
    assert.equal(detail.itemCount, 2, 'both lines'); assert.equal(cart.totalQuantity, 2);
    assert.match(detail.sections['cart-drawer-section'], /two lines/, "the drawer's own new markup, so it never opens on the old cart");
    assert.deepEqual([...s.fetched].sort(), ['/?sections=cart-drawer-section', '/cart.js']);
    assert.equal(s.dialog.open, true);
    await s.advance(5000);
    assert.deepEqual(s.toasts, [], 'the open drawer is the confirmation');
  });

  test(`${mode}: when the drawer stays shut, one toast, gone after 8 seconds, a long scroll or leaving the page`, async () => {
    const s = load(shop({opens: false}));
    s.ctx.announceAdd(gift);
    await s.advance(0);
    assert.equal(s.dispatched.length, 1);
    await s.advance(900);
    assert.deepEqual(s.toasts, ["Pip's gift is in your cart."]);
    await s.advance(7000);
    assert.equal(s.hidden.length, 0, 'still there at 7 seconds');
    await s.advance(1200);
    assert.equal(s.hidden.length, 1, 'gone at 8'); assert.equal(s.bar.current, null);
    assert.deepEqual(s.listeners.scroll, []); assert.deepEqual(s.listeners.pagehide, [], 'and stops listening');
    // a scroll past 600px
    const t = load(shop({opens: false}));
    t.ctx.announceAdd(gift); await t.advance(1000);
    t.scroll(400); assert.equal(t.hidden.length, 0);
    t.scroll(650); assert.equal(t.hidden.length, 1, 'a scroll past 600px clears it');
    // leaving the page (a history restore would otherwise bring it back)
    const u = load(shop({opens: false}));
    u.ctx.announceAdd(gift); await u.advance(1000);
    u.leave(); assert.equal(u.hidden.length, 1);
    // a later toast in the same bar is that one's to clear
    const v = load(shop({opens: false}));
    v.ctx.announceAdd(gift); await v.advance(1000);
    v.bar.current.querySelector('strong').textContent = 'Next: The blanket';
    await v.advance(9000);
    assert.equal(v.hidden.length, 0);
  });

  test(`${mode}: no drawer to tell: the toast offers checkout, and goes too; a gift list keeps the drawer shut`, async () => {
    const s = load(shop({drawer: false}));
    s.ctx.announceAdd(gift);
    assert.deepEqual(s.toasts, ['In your cart']); assert.equal(s.dispatched.length, 0);
    await s.advance(8000);
    assert.equal(s.hidden.length, 1);
    const l = load(shop({list: [{url: '/products/your-dogs-portrait', title: 'The portrait'}]}));
    l.ctx.announceAdd(gift); await l.advance(5000);
    assert.equal(l.dispatched[0].action, 'update', 'Helio refreshes, the drawer stays shut'); assert.deepEqual(l.toasts, []);
  });
}
