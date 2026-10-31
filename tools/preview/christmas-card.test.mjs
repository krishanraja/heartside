// The printed Christmas card from the dog (Krish, 31 Oct): $12, an add-on line right after its gift,
// linked by _hs_addon_for and marked _hs_addon "card", offered until 11:59 pm Eastern on 3 December
// 2026. It never takes the Artist's touch offer's place, and the cart says what it is.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {renderCart, gift, addon, rowOf, ID, ID2} from './cart-fixture.mjs';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const memoLiquid = readFileSync(new URL('../../shopify/sections/hs2-memo.liquid', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const CUTOFF = 1796360399;
const card = (forId, props = {}) => ({_hs_addon_for: forId, _hs_addon: 'card', Delivery: 'Ships in its own envelope', ...props});

test('the cutoff is 11:59:59 pm Eastern on Thursday 3 December 2026, the same moment in the theme and the script', () => {
  assert.equal(new Date(CUTOFF * 1000).toISOString(), '2026-12-04T04:59:59.000Z');
  assert.match(memoLiquid, /hs_now < 1796360399/, 'the server clock hides it');
  assert.match(memoLiquid, /data-hs-card-until="1796360399"/, 'and the script checks it again');
  assert.match(memoLiquid, /card != blank and card\.available/, 'an unavailable card product hides it too');
});

function holder() {
  return {children: [], parentNode: null,
    appendChild(n) { n.parentNode = this; this.children.push(n); return n; },
    removeChild(n) { this.children.splice(this.children.indexOf(n), 1); n.parentNode = null; return n; },
    querySelector(s) { return s === '[data-hs2-card]' ? this.children.find(n => n.className === 'hs2-card') || null : null; }};
}
function row(props, personal, {slot = true} = {}) {
  const host = holder(), kept = slot ? host.appendChild(holder()) : null;
  return {host, kept,
    getAttribute: k => (k === 'data-hs2-cart-line' ? JSON.stringify({quantity: 1, properties: props, item_components: personal ? [{properties: {_customization_id: props._customization_id || ID}}] : []}) : k === 'data-hs2-quantity-key' ? (personal ? 'k' : '') : null),
    querySelector: s => (s === '[data-hs2-card-slot]' ? (kept && kept.parentNode ? kept : null) : null)};
}
function cardBox() {
  const button = {disabled: false, textContent: '', addEventListener(n, fn) { this.click = fn; }}, status = {textContent: ''};
  return {className: '', attrs: {}, innerHTML: '', parentNode: null, button, status, setAttribute(k, v) { this.attrs[k] = v; },
    querySelector: s => (s === '[data-hs2-card-add]' ? button : s === '[data-hs2-card-status]' ? status : null)};
}

for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: the cart offers one card per gift until the cutoff, and adds it linked to its gift`, async () => {
  const posts = [], made = [];
  let memo = null, now = (CUTOFF - 60) * 1000, reloaded = 0;
  const ctx = {location: {pathname: '/cart', reload() { reloaded++; }}, FormData, track() {}, shopRoot: () => '/',
    Date: {now: () => now},
    fetch: (url, o) => { posts.push([url, o.body]); return Promise.resolve({ok: true, json: async () => ({})}); },
    document: {querySelector: s => (s === '[data-hs-card-variant]' ? memo : null),
      createElement: () => { const b = cardBox(); made.push(b); return b; }}};
  vm.runInNewContext(['cartLineFacts', 'cardOpen', 'cardForm', 'cardOffers'].map(section).map(c => (minified ? transformSync(c, {minify: true}).code : c)).join('\n'), ctx);
  // no card product (or past its cutoff): no offer, and the kept place goes
  const early = row({}, true);
  ctx.cardOffers([early]);
  assert.equal(early.host.children.length, 0);
  memo = {getAttribute: k => ({'data-hs-card-variant': '888', 'data-hs-card-price': '$12', 'data-hs-card-until': String(CUTOFF)})[k]};
  const g = row({}, true);
  ctx.cardOffers([g]);
  assert.equal(made.length, 1);
  assert.equal(g.kept.children[0], made[0], 'in the place the Liquid kept for it');
  assert.equal(made[0].button.textContent, 'Add a printed Christmas card, $12');
  assert.match(made[0].innerHTML, /ships in its own envelope/);
  made[0].button.click(); await new Promise(r => setImmediate(r));
  const [url, body] = posts[0];
  assert.equal(url, '/cart/add.js');
  assert.equal(body.get('id'), '888');
  assert.equal(body.get('properties[_hs_addon_for]'), ID);
  assert.equal(body.get('properties[_hs_addon]'), 'card');
  assert.equal(body.get('properties[Delivery]'), 'Ships in its own envelope');
  assert.equal(reloaded, 1);
  // a gift that has its card is not offered another
  const carded = row({}, true), its = row(card(ID), false, {slot: false});
  ctx.cardOffers([carded, its]);
  assert.equal(carded.host.children.length, 0, 'never twice, and its place goes');
  // an Artist's touch on the gift does not count as its card
  const touched = row({}, true), touch = row({_hs_addon_for: ID}, false, {slot: false});
  ctx.cardOffers([touched, touch]);
  assert.equal(touched.kept.children.length, 1);
  // one second past the cutoff, on a page served from cache: gone
  now = (CUTOFF + 1) * 1000;
  const late = row({}, true);
  ctx.cardOffers([late]);
  assert.equal(late.host.children.length, 0);
});

test("a card never takes the Artist's touch offer's place, and the Artist's touch never takes the card's", () => {
  const ctx = {location: {pathname: '/cart'}, ADDON_TAGS: [], track() {}, shopRoot: () => '/', FormData,
    document: {querySelector: () => ({getAttribute: () => '1'}), createElement: () => ({className: '', setAttribute() {}, querySelector: () => null, querySelectorAll: () => []})}};
  vm.runInNewContext(['cartLineFacts'].map(section).join('\n'), ctx);
  const facts = props => ctx.cartLineFacts({getAttribute: k => (k === 'data-hs2-cart-line' ? JSON.stringify({quantity: 1, properties: props, item_components: []}) : '')});
  assert.equal(facts(card(ID)).card, true);
  assert.equal(facts({_hs_addon_for: ID}).card, false);
  assert.match(section('artistTouch'), /if \(f\.addonFor && !f\.card\) taken\[f\.addonFor\] = true/);
});

test('in the cart: a card sits under its gift, says what it is, and both offers keep their places', async () => {
  const {html} = await renderCart([gift(0, ID), addon(1, ID, card(ID)), gift(2, ID2)]);
  const cardRow = rowOf(html, '777:addon-1');
  assert.match(cardRow, /class="cart-items__table-row hs2-addon-line"/, 'tucked under its gift');
  assert.match(cardRow, /<p class="hs2-addon-for">For the Illustrated Mug<\/p>/, 'names its gift, with no "Adds 5 days"');
  assert.match(cardRow, /<dt>Delivery:<\/dt>\s*<dd>Ships in its own envelope<\/dd>/);
  assert.match(cardRow, /<path d="M3 6.5h18v11H3z"/, 'an envelope, not the brush');
  const first = rowOf(html, '101:merged-0'), second = rowOf(html, '101:merged-2');
  assert.doesNotMatch(first, /data-hs2-card-slot/, 'the gift with a card is not offered another');
  assert.match(first, /data-hs2-artist-slot/, 'a card leaves the Artist\'s touch on offer');
  assert.match(second, /data-hs2-card-slot/);
  const lost = rowOf((await renderCart([addon(0, ID, card(ID))])).html, '777:addon-0');
  assert.match(lost, /The gift this card was for is no longer in your cart\./);
  assert.match((await renderCart([gift(0, ID)], {context: 'drawer'})).html, /^(?![\s\S]*data-hs2-card-slot)/, 'never in the drawer');
});
