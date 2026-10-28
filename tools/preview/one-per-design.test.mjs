// One unit per design (28 Oct). CoWork Part B found a design at quantity 2 ($258 in the cart)
// checking out as 4 ($516): Shopify's checkout merge doubled it. The gift page adds one of each
// design whatever Teeinblue's quantity box says; the cart side is cart-quantity-browser test 6.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

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

test("Teeinblue's quantity box is hidden on gift pages", () => {
  assert.match(css, /#buy\[data-hs2-artwork-kind\] \.tee-form-actions \.tee-quantity, #buy\[data-hs2-blanket-purchase\] \.tee-form-actions \.tee-quantity \{ display: none !important; \}/);
});
