// One unit per design (28 Oct). CoWork Part B found a design at quantity 2 ($258 in the cart)
// checking out as 4 ($516): Shopify's checkout merge doubled it. The gift page adds one of each
// design whatever Teeinblue's quantity box says; the cart side is cart-quantity-browser test 6.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {Liquid} from 'liquidjs';
import {renderCart, gift, addon, ordinary, rowOf, ID} from './cart-fixture.mjs';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const css = readFileSync(new URL('../../shopify/assets/hs2.css', import.meta.url), 'utf8');

for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: a design goes into the cart as one, an ordinary line as asked`, () => {
  const load = native => { const ctx = {hsProps: () => ({_hs_art_source: 'x'}), nativeArtworkPurchase: () => native}; const code = section('withHsProps'); vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, ctx); return ctx; };
  const body = JSON.stringify({items: [{id: 1, quantity: 2, properties: {_customization_id: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'}}, {id: 2, quantity: 3, properties: {}}]});
  const out = JSON.parse(load(true).withHsProps(body));
  assert.equal(out.items[0].quantity, 1, 'the design'); assert.equal(out.items[1].quantity, 3, 'not a design');
  assert.equal(JSON.parse(load(false).withHsProps(body)).items[0].quantity, 2, 'other pages are left as they are');
  assert.equal(JSON.parse(load(true).withHsProps(JSON.stringify({id: 1, quantity: 4, properties: {_customization_id: 'x'}}))).quantity, 1, 'the single-item form too');
});

// The cart row's plus (28 Oct): a design is served with its plus disabled and inert. Helio's cart selector turns a
// plus served disabled back on (cart-quantity-browser test 10), so inert keeps it unpressable and
// component-cart-items.js finds it by data-hs2-one-per to disable it again. An ordinary line keeps its plus.
const OFF = 'name="plus" disabled inert aria-disabled="true" data-hs2-one-per';
test('the cart serves a design\'s plus disabled and an ordinary line\'s plus as it was', async () => {
  const liquid = readFileSync(new URL('../../shopify/snippets/cart-products.liquid', import.meta.url), 'utf8');
  const start = liquid.indexOf('{%- capture hs_quantity_selector -%}'), endTag = '{{ hs_quantity_selector }}{%- endif -%}';
  assert.notEqual(start, -1, 'the capture');
  const block = liquid.slice(start, liquid.indexOf(endTag, start) + endTag.length);
  const stub = '<button class="button quantity-minus button-unstyled" type="button" name="minus" on:click="/decreaseQuantity" ref="minusButton"></button><input type="number" name="updates[]" value="{{ in_cart_quantity }}"><button class="button quantity-plus button-unstyled" type="button" name="plus" on:click="/increaseQuantity" ref="plusButton"></button>';
  const files = {'/quantity-selector.liquid': stub};
  const engine = new Liquid({root: ['/'], extname: '.liquid', fs: {sep: '/', dirname: () => '/', contains: () => true, resolve: (root, file, ext) => '/' + file + ext, exists: async p => p in files, existsSync: p => p in files, readFile: async p => files[p], readFileSync: p => files[p]}});
  // hs_one_per is the line's quantity key and its add-on link together: blank for an ordinary line
  const render = key => engine.parseAndRender(block, {hs_quantity_key: key, hs_one_per: key, hs_quantity_item: {quantity: 2}, item: {product: {}, variant: {}, index: 0}, can_update_quantity: true});
  const design = await render('123:native'), ordinary = await render('');
  assert.ok(design.includes(OFF + ' on:click="/increaseQuantity"'), 'the design\'s plus is disabled and inert in the markup');
  assert.equal((design.match(/ disabled/g) || []).length, 1, 'only the plus is disabled here; the minus and the number stay the base selector\'s');
  assert.doesNotMatch(ordinary, / disabled/, 'an ordinary line is untouched');
  assert.match(liquid, /\{%- if hs_one_per != '' -%\}<p class="hs2-one-per">One per design<\/p>\{%- endif -%\}/);
  // it looks off whatever the selector has done to disabled
  assert.match(css, /\.cart-items__quantity-controls \[name="plus"\]\[data-hs2-one-per\] \{ opacity: \.4;/);
});

// A9c (28 Oct): the Artist's touch line kept a working plus, so one rework could become 2 x $29.
test("an Artist's touch is one per design: no control at one, its plus served disabled, and said so", async () => {
  const quantity = html => html.slice(html.indexOf('class="cart-items__quantity"'), html.indexOf('class="cart-items__error'));
  const one = quantity(rowOf((await renderCart([gift(0, ID), addon(1, ID)])).html, '777:addon-1'));
  assert.ok(one.includes(OFF), 'the plus');
  assert.match(one, /<input type="number"[^>]* disabled/, 'and, at one, the whole control');
  assert.match(one, /<p class="hs2-one-per">One per design<\/p>/);
  // an older cart's add-on above one can come back down; its plus stays off
  const older = addon(1, ID); older.quantity = 2; older.final_line_price = 5800;
  const two = quantity(rowOf((await renderCart([gift(0, ID), older])).html, '777:addon-1'));
  assert.ok(two.includes(OFF)); assert.doesNotMatch(two, /name="minus"[^>]* disabled/); assert.doesNotMatch(two, /<input type="number"[^>]* disabled/);
  // an ordinary line is untouched
  const plain = quantity(rowOf((await renderCart([ordinary(0)])).html, '456:plain-0'));
  assert.doesNotMatch(plain, / disabled/); assert.doesNotMatch(plain, /hs2-one-per/);
});

test("Teeinblue's quantity box is hidden on gift pages", () => {
  assert.match(css, /#buy\[data-hs2-artwork-kind\] \.tee-form-actions \.tee-quantity, #buy\[data-hs2-blanket-purchase\] \.tee-form-actions \.tee-quantity \{ display: none !important; \}/);
});
