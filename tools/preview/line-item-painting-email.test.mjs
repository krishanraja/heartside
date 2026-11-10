// The buyer's painting as the gift's picture in Shopify's order emails (shopify/notifications/line-item-painting.liquid).
// Order #1013 (2 Nov 2026) showed the mug's example golden retriever, not the buyer's own painting.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Liquid} from 'liquidjs';

const src = readFileSync(new URL('../../shopify/notifications/line-item-painting.liquid', import.meta.url), 'utf8');
const engine = new Liquid();
engine.registerFilter('img_url', l => 'VARIANT:' + l.image);
const render = line => engine.parseAndRender(src, {line});
const src1 = html => (/src="([^"]+)"/.exec(html) || [])[1];
const CHECKOUT = 'https://cdn.shopify.com/s/files/1/x/files/heartside-checkout-abc.jpg?v=1';
const PREVIEW = 'https://cdn.teeinblue.com/customizations/abc.jpg';

test('a painted gift shows its checkout picture, not the example dog', async () => {
  const html = await render({title: "Your Dog's Illustrated Mug", image: 'mug-real-golden.jpg', properties: {_hs_checkout_image: CHECKOUT, _customization_image: PREVIEW}});
  assert.equal(src1(html), CHECKOUT);
  assert.doesNotMatch(html, /VARIANT/);
  assert.match(html, /width="60" height="60" class="order-list__product-image"/);
});

test('with no checkout picture, Teeinblue\'s preview of the painting', async () => {
  assert.equal(src1(await render({title: 'Mug', image: 'x.jpg', properties: {_customization_image: PREVIEW}})), PREVIEW);
});

test('a line with no painting keeps its variant picture, and one with no picture draws none', async () => {
  assert.equal(src1(await render({title: 'Card', image: 'card.jpg', properties: {}})), 'VARIANT:card.jpg');
  assert.doesNotMatch(await render({title: 'Card', image: null, properties: {}}), /<img/);
});

test('the title in alt is escaped', async () => {
  assert.match(await render({title: 'Rex "the" <dog>', image: null, properties: {_customization_image: PREVIEW}}), /alt="Rex (&quot;|&#34;)the(&quot;|&#34;) &lt;dog&gt;"/);
});
