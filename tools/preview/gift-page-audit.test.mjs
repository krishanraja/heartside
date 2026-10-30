// The live audit's gift-page fixes (30 Oct): the name and price come before the way in, nothing on a
// direct visit sends the buyer to a chat that no longer exists, fields are 16 px so iOS never zooms,
// every gift's price shows before the first question, and the header is cleared before the first paint.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = (p) => readFileSync(new URL('../../shopify/' + p, import.meta.url), 'utf8');

test('the gift page shows the name and price before the way in, with the reassurance beside the price', () => {
  const s = read('sections/hs2-product.liquid');
  const price = s.indexOf('data-hs2-price'), card = s.indexOf("render 'hs-journey', s: s"), promise = s.indexOf('hs2-product__promise');
  assert.ok(price > 0 && card > price, 'the journey card renders after the price');
  assert.ok(promise > price && promise < card, 'the reassurance sits beside the price');
  assert.equal((s.match(/render 'hs-journey', s: s/g) || []).length, 1, 'one card, not one above the title too');
  assert.doesNotMatch(s, /data-hs2-countdown="product" hidden/, 'the countdown line holds its place from the first paint');
});

test('a direct visit never points the buyer to the old chat', () => {
  const card = read('snippets/hs-journey.liquid');
  assert.doesNotMatch(card, /I'm Buddy|takes about a minute|Tell me about your dog/);
  assert.match(card, />Make one for my dog</);
  assert.doesNotMatch(read('assets/hs-artwork-choices.js'), /go back to Buddy/);
  assert.match(read('assets/hs2.js'), /function notePlaceholder\(\)[\s\S]{0,400}Your note, a line or two/);
});

test('gift-page fields are 16 px and the gift page is set in one sans family', () => {
  const css = read('assets/hs2.css');
  assert.match(css, /\.hs-art-choices select, #buy \.tee-form-wrapper input[^{]*\{ font-size: 16px; \}/);
  assert.match(css, /\.hs2-product__info h1 \{ font-family: var\(--sans\)/);
  assert.match(css, /\.hs2-product__price \{ font-family: var\(--sans\)/);
  const brand = read('assets/hs-brand.css');
  assert.doesNotMatch(brand, /\.hs-menu li a \{[^}]*--hs-serif/, 'menu links in sans');
  assert.doesNotMatch(brand, /\.hs-cart-empty__line \{[^}]*Fraunces/, 'empty cart line in sans');
});

test('every gift price shows under the hook button, from Shopify, and on the photo step', () => {
  const s = read('sections/hs-journey.liquid');
  assert.match(s, /<p class="hsj-price">\{\{ price_line \| strip \}\} · Free US shipping<\/p>/);
  assert.match(s, /p\.price_min \| money_without_trailing_zeros/, 'prices come from Shopify, never typed');
  assert.match(read('assets/hs-journey.js'), /function priceLine\(gift\)[\s\S]{0,500}free US shipping/);
});

test('the gift page clears the header before the first paint, the way clearHeader does', () => {
  const s = read('sections/hs2-product.liquid');
  const script = s.slice(s.indexOf('<div class="hs2">'), s.indexOf('{%- capture option_labels'));
  assert.match(script, /box\.style\.paddingTop = Math\.ceil\(bottom - top \+ 12\) \+ 'px'/);
  assert.match(read('assets/hs2.js'), /var overlap = bottom - top, want = overlap > 0 \? Math\.ceil\(overlap \+ 12\) : 0;/, 'the same 12 px, so clearHeader finds nothing to change');
});
