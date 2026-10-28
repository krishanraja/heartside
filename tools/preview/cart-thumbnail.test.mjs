// The cart thumbnail has one owner (Krish, 28 Oct: it "glitches epileptically"). The server draws
// the accepted design, so Helio's re-render, hs2.js and Teeinblue's cart widget no longer take
// turns at it, and the bundle line reads /cart.js once per cart instead of on every redraw (each
// read re-ran Teeinblue's cart pass, which redrew the cart again).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {Liquid} from 'liquidjs';
import {transformSync} from 'esbuild';

const liquid = readFileSync(new URL('../../shopify/snippets/cart-products.liquid', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const start = liquid.indexOf('<td\n                  class="cart-items__media"'), end = liquid.indexOf('</td>', start) + '</td>'.length;
const engine = new Liquid();
engine.registerFilter('image_url', () => 'PRODUCT_IMAGE');
engine.registerFilter('image_tag', v => '<img src="' + v + '">');
const cell = (properties, components = []) => engine.parseAndRender(liquid.slice(start, end), {
  item: {image: {aspect_ratio: 1}, url: '/products/your-dogs-personality-blanket?variant=1', variant_id: 1, properties, item_components: components},
  settings: {cart_thumbnail_border_radius: 0}, block_settings: {image_ratio: 'portrait'}});
const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const art = (() => { const ctx = {}; vm.runInNewContext(section('cartArtworkImage'), ctx); return ctx.cartArtworkImage; })();
const ID = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const PREPARED = 'https://cdn.shopify.com/s/files/1/0/1/2/files/heartside-checkout-' + ID + '.jpg?v=12';
const NATIVE = 'https://cdn.teeinblue.com/customizations/' + ID + '.jpg';
const designOf = html => (html.match(/data-hs2-src="([^"]*)"/) || [])[1] || '';

test('the server draws the accepted design, from the same sources as cartArtworkImage()', async () => {
  const cases = [
    [{_hs_checkout_image: PREPARED}, [], PREPARED],
    [{}, [{variant_id: 1, properties: {_hs_checkout_image: PREPARED, _customization_id: ID}}], PREPARED],
    [{_customization_image: NATIVE}, [], NATIVE],
    [{_hs_checkout_image: PREPARED, _customization_image: NATIVE}, [], PREPARED]
  ];
  for (const [properties, components, want] of cases) {
    const html = await cell(properties, components);
    assert.equal(designOf(html).replace(/&amp;/g, '&'), want);
    assert.equal(art({variant_id: 1, properties, item_components: components}), want, 'the script would pick the same design');
    assert.doesNotMatch(html, /PRODUCT_IMAGE/, 'no product photo to swap out');
    assert.match(html, /data-hs2-design/);
    assert.match(html, /cart-items__media-container teeinblue-item--customization-images/, "inside Teeinblue's own leave-alone container");
    // Teeinblue's widget claims img[src^="https://cdn.teeinblue.com/customizations/"]; this one never matches
    assert.doesNotMatch(html, /\ssrc="https:\/\/cdn\.teeinblue\.com\/customizations\//);
  }
  assert.match(await cell({_hs_checkout_image: PREPARED}), /src="https:\/\/cdn\.shopify\.com\/[^"]*heartside-checkout-[^"]*\.jpg\?v=12&amp;width=300"/);
  assert.match(await cell({_customization_image: NATIVE}), new RegExp('src="//cdn\\.teeinblue\\.com/customizations/' + ID + '\\.jpg"'));
});

test('anything else keeps the product photo', async () => {
  for (const [properties, components] of [
    [{}, []],
    [{_hs_checkout_image: 'https://evil.example/s/files/1/0/1/2/files/heartside-checkout-' + ID + '.jpg'}, []],
    [{_hs_checkout_image: 'https://cdn.shopify.com/s/files/1/0/1/2/files/someone-else.jpg'}, []],
    [{_customization_image: 'https://cdn.teeinblue.com/customizations/' + ID + '.jpg" onerror="alert(1)'}, []],
    [{_customization_image: 'https://cdn.teeinblue.com.evil.example/customizations/' + ID + '.jpg'}, []],
    [{}, [{variant_id: 2, properties: {_hs_checkout_image: PREPARED}}]]
  ]) {
    const html = await cell(properties, components);
    assert.match(html, /PRODUCT_IMAGE/, JSON.stringify(properties));
    assert.doesNotMatch(html, /data-hs2-design|onerror|teeinblue-item/);
  }
});

for (const minified of [false, true]) {
  const load = ctx => { const code = ['cartDesignRetry', 'cartPicture', 'bundleLine'].map(section).join('\n'); vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, ctx); return ctx; };
  test(`${minified ? 'minified' : 'source'}: a server-drawn design is never swapped, and the bundle line reads the cart once per cart`, async () => {
    const writes = [];
    const designed = {complete: true, naturalWidth: 300, getAttribute: k => k === 'src' ? '//cdn.teeinblue.com/customizations/' + ID + '.jpg' : null, addEventListener() {},
      set src(v) { writes.push(v); }, setAttribute: k => writes.push(k)};
    const row = (key, qty) => ({getAttribute: k => (k === 'data-key' ? key : null), querySelector: s => (s === '.cart-items__media img[data-hs2-design]' ? designed : s === 'input[type="number"]' ? {value: String(qty)} : null)});
    let fetches = 0, rows = [row('a', 1)], line = null;
    const totals = {parentNode: {insertBefore: el => { line = el; }}};
    const ctx = load({setTimeout, shopRoot: () => '/',
      fetch: () => { fetches++; return Promise.resolve({json: async () => ({items: [{product_title: 'Blanket'}], total_discount: 0})}); },
      document: {querySelector: s => (s === '[data-hs-bundle-live]' ? {} : s === '.cart-totals__tax-note' ? totals : s === '[data-hs2-bundle-line]' ? line : null),
        querySelectorAll: () => rows, createElement: () => ({setAttribute() {}, remove() { line = null; }})}});
    ctx.cartPicture(rows[0], 'https://cdn.teeinblue.com/customizations/' + ID + '.jpg');
    assert.deepEqual(writes, [], 'the design the server drew is left alone');
    ctx.bundleLine(rows); ctx.bundleLine(rows); await new Promise(r => setTimeout(r, 0));
    ctx.bundleLine(rows); ctx.bundleLine(rows); await new Promise(r => setTimeout(r, 0));
    assert.equal(fetches, 1, 'one read for one cart, however often it redraws');
    assert.equal(line.textContent, 'Add a second gift and save 15%. Three saves 20%.');
    line = null; ctx.bundleLine(rows);
    assert.equal(fetches, 1); assert.equal(line && line.textContent, 'Add a second gift and save 15%. Three saves 20%.', 'a redraw that drops the line gets it back without a read');
    rows = [row('a', 2)]; ctx.bundleLine(rows); await new Promise(r => setTimeout(r, 0));
    assert.equal(fetches, 2, 'a new quantity is a new cart');
  });
}
