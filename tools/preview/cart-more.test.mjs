// The cart drawer's numbers and words (assets/hs-cart-more.js, Krish 5 Nov): the bundle saving in exact cents
// from the cart's own gift lines and the live rates (15% off two gifts, 20% off three or more, gifts only), which
// gifts it offers and which leads (the 30% margin floor), the start link that unticks what is already in the cart,
// and the snippet's data agreeing with the catalog and the home gifts screen. Node only, nothing leaves the machine.
//
//   node --test tools/preview/cart-more.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {CORE} from './catalog.mjs';
import {asset, repo} from './cart-fixture.mjs';

const load = () => { const window = {}; vm.runInNewContext(asset('hs-cart-more.js'), {window}); assert.ok(window.HSCartMore, 'hs-cart-more.js exports its maths'); return window.HSCartMore; };
// the script runs in its own realm: its arrays and objects are compared as plain data
const plain = v => JSON.parse(JSON.stringify(v));
const M0 = load();
const M = Object.fromEntries(Object.entries(M0).map(([k, f]) => [k, typeof f === 'function' ? (...a) => { const r = f(...a); return r && typeof r === 'object' ? plain(r) : r; } : plain(f)]));
const PRICES = {mug: 4500, blanket: 12900, unframed: 5900, framed: 11900};
// the snippet's data, as the cart page renders it (prices in cents, as Shopify gives them to Liquid)
const CFG = {root: '/', gifts: [
  {gift: 'print', handle: 'your-dogs-portrait', id: 2, url: '/products/your-dogs-portrait', available: true, variants: [
    {id: 21, options: ['Framed', 'Black', '12x18'], price: 11900, available: true}, {id: 22, options: ['Framed', 'White', '12x18'], price: 11900, available: true},
    {id: 24, options: ['Unframed', 'Default', '12x18'], price: 5900, available: true}]},
  {gift: 'mug', handle: 'your-dogs-illustrated-mug', id: 1, url: '/products/your-dogs-illustrated-mug', available: true, variants: [
    {id: 11, options: ['Mug', 'Pink', '11 oz'], price: 4500, available: true}, {id: 12, options: ['Mug', 'Black', '11 oz'], price: 4500, available: true},
    {id: 13, options: ['Mug', 'Dark Green', '11 oz'], price: 4500, available: true}]},
  {gift: 'blanket', handle: 'your-dogs-personality-blanket', id: 3, url: '/products/your-dogs-personality-blanket', available: true, variants: [
    {id: 31, options: ['Blanket', 'Tan', '50x60'], price: 12900, available: true}]},
]};
const line = (variant_id, extra = {}) => ({variant_id, quantity: 1, properties: {}, ids: [], of: '', ...extra});

test('the saving, in exact cents, at the live rates', () => {
  assert.deepEqual(M.RATES, [[3, 20], [2, 15]]);
  assert.equal(M.bundleOff([PRICES.mug]), 0, 'one gift saves nothing');
  // read back on the live store on 27 Oct (docs/evidence/2026-10-27-go-live.md step 7)
  assert.equal(M.bundleOff([PRICES.mug, PRICES.blanket]), 2610, 'mug + blanket: $26.10');
  assert.equal(M.bundleOff([PRICES.mug, PRICES.mug, PRICES.blanket]), 4380, 'two mugs + blanket: $43.80');
  // computed, not yet read back (on the live QA list)
  assert.equal(M.bundleOff([PRICES.mug, PRICES.blanket, PRICES.unframed]), 4660, 'mug + blanket + unframed portrait: $46.60');
  assert.equal(M.bundleOff([PRICES.mug, PRICES.unframed]), 1560);
  assert.equal(M.bundleOff([PRICES.mug, PRICES.framed]), 2460);
  assert.equal(M.money(2610), '$26.10'); assert.equal(M.money(3000), '$30');
});

test('the cart\'s gift units: add-ons and other products are not gifts, a redo pair counts once', () => {
  const cart = M.cartGifts([
    line(11, {ids: ['a']}), line(777, {properties: {_hs_addon_for: 'a'}}), line(11, {properties: {_hs_addon: 'card'}}), line(456),
  ], CFG);
  assert.deepEqual(cart.units, [4500]);
  assert.deepEqual(cart.have, {mug: true});
  // the new version beside the one it replaces: the buyer keeps one of the two
  const redo = M.cartGifts([line(11, {ids: ['a']}), line(12, {ids: ['b'], of: 'a'})], CFG);
  assert.deepEqual(redo.units, [4500]); assert.equal(redo.redo, true);
  // a redo whose first version is gone is an ordinary gift
  assert.deepEqual(M.cartGifts([line(12, {ids: ['b'], of: 'a'})], CFG).units, [4500]);
  assert.deepEqual(M.cartGifts([line(11, {quantity: 2})], CFG).units, [4500, 4500]);
});

test('the offers: only gifts not in the cart; with the mug, the blanket leads and the portrait is framed first', () => {
  const withMug = M.offers(CFG, M.cartGifts([line(12)], CFG));
  assert.deepEqual(withMug.map(o => o.gift), ['blanket', 'print']);
  assert.equal(withMug[1].variant.id, 21, 'the portrait defaults to Framed for a mug cart (the margin floor)');
  assert.equal(M.savingText(M.cartGifts([line(12)], CFG), withMug[0].variant.price), 'You save $26.10 on the two.');
  const withBlanket = M.offers(CFG, M.cartGifts([line(31)], CFG));
  assert.deepEqual(withBlanket.map(o => o.gift), ['print', 'mug']);
  assert.equal(withBlanket[0].variant.id, 24, 'otherwise Unframed');
  assert.deepEqual(withBlanket[1].variants.map(v => v.options[1]), ['Black', 'Dark Green', 'Pink'], 'mug colors in the brand order');
  // an unframed portrait in the cart: the mug would make the thinnest basket, so the blanket leads
  assert.deepEqual(M.offers(CFG, M.cartGifts([line(24)], CFG)).map(o => o.gift), ['blanket', 'mug']);
  const two = M.cartGifts([line(12), line(31)], CFG);
  assert.equal(M.savingText(two, 5900), 'You save $46.60 on all three.');
  assert.deepEqual(M.offers(CFG, M.cartGifts([line(12), line(31), line(24)], CFG)), [], 'nothing left to offer');
  // a gift that is not sold now is not offered
  const off = {...CFG, gifts: CFG.gifts.map(g => (g.gift === 'blanket' ? {...g, available: false} : g))};
  assert.deepEqual(M.offers(off, M.cartGifts([line(12)], off)).map(o => o.gift), ['print']);
});

test('the words: the pill, what stays in the cart, the Christmas line until its day ends', () => {
  assert.equal(M.pillText(1), 'Second gift: 15% off both');
  assert.equal(M.pillText(2), 'Third gift: 20% off all three');
  assert.equal(M.pillText(3), '');
  assert.equal(M.staysText({mug: true}), 'Your mug stays in your cart.');
  assert.equal(M.staysText({mug: true, blanket: true}), 'Your mug and blanket stay in your cart.');
  assert.equal(M.christmasLine('2026-12-04', new Date(2026, 11, 4, 23, 0).getTime()), 'Order by December 4 for Christmas delivery to a US address.');
  assert.equal(M.christmasLine('2026-12-04', new Date(2026, 11, 5, 0, 1).getTime()), '', 'gone once the day ends');
  assert.equal(M.christmasLine('', Date.now()), '');
});

test('the start link ticks the wanted gift and names the gifts already in the cart', () => {
  assert.equal(M.startLink('/', 'blanket', 31, {mug: true}), '/?step=photo&gift=blanket&variant=31&have=mug');
  assert.equal(M.startLink('/', 'print', 24, {mug: true, blanket: true}), '/?step=photo&gift=portrait&variant=24&have=mug,blanket');
  assert.equal(M.journeyLink('/products/your-dogs-personality-blanket', 31), '/products/your-dogs-personality-blanket?journey=1&variant=31');
});

test('the snippet\'s gifts are the catalog\'s, with the home gifts screen\'s words and photos', () => {
  const snippet = readFileSync(repo + '/shopify/snippets/hs-cart-more.liquid', 'utf8');
  const handles = /hs_more_handles = '([^']+)'/.exec(snippet)[1].split(',');
  assert.deepEqual([...handles].sort(), CORE.map(c => c.handle).sort());
  const journey = asset('hs-journey.js');
  const info = JSON.parse(('{' + /var GIFT_INFO = \{(.+?)\};/.exec(journey)[1] + '}').replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
  const specs = /hs_more_specs = '([^']+)'/.exec(snippet)[1].split('|'), names = /hs_more_names = '([^']+)'/.exec(snippet)[1].split('|');
  ['print', 'mug', 'blanket'].forEach((g, i) => { assert.equal(specs[i], info[g][1]); assert.equal(names[i], info[g][0]); });
  for (const img of /hs_more_imgs = '([^']+)'/.exec(snippet)[1].split(',')) assert.ok(readFileSync(repo + '/shopify/assets/' + img).length > 1000, img);
  // the variant labels are the gifts screen's (hs-journey.js variantLabel)
  const theirs = new Function('return ' + /function variantLabel\(g, v\) \{[\s\S]+?\n  \}/.exec(journey)[0])();
  for (const g of CFG.gifts) for (const v of g.variants) assert.equal(M.variantLabel(g.gift, v), theirs(g.gift, v));
});
