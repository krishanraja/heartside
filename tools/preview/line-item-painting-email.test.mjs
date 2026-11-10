// The buyer's painting as the gift's picture in Shopify's order emails (shopify/notifications/line-item-painting.liquid
// and line-item-group-painting.liquid). Order #1013 (2 Nov 2026) showed the mug's example golden retriever.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Liquid} from 'liquidjs';

const read = f => readFileSync(new URL('../../shopify/notifications/' + f, import.meta.url), 'utf8');
const lineSrc = read('line-item-painting.liquid');
// the group file opens Shopify's chain; the template's own elsif/else/endif close it
const groupSrc = read('line-item-group-painting.liquid') + "{% elsif parent_line_item and parent_line_item.image %}PARENT{% else %}PLACEHOLDER{% endif %}";
const engine = new Liquid();
engine.registerFilter('img_url', l => 'VARIANT:' + l.image);
const src1 = html => (/src="([^"]+)"/.exec(html) || [])[1];
const CHECKOUT = 'https://cdn.shopify.com/s/files/1/x/files/heartside-checkout-abc.jpg?v=1';
const PREVIEW = 'https://cdn.teeinblue.com/customizations/abc.jpg';
const gift = {title: "Your Dog's Illustrated Mug", image: 'mug-real-golden.jpg', properties: {_hs_checkout_image: CHECKOUT, _customization_image: PREVIEW}};
const render = line => engine.parseAndRender(lineSrc, {line});
// the snippet with its first code line pointed at another variable, as pasted in the other blocks
const as = (v, ctx) => engine.parseAndRender(lineSrc.replace('assign hs_l = line -', 'assign hs_l = ' + v + ' -'), ctx);

test('a painted gift shows its checkout picture, not the example dog', async () => {
  const html = await render(gift);
  assert.equal(src1(html), CHECKOUT);
  assert.doesNotMatch(html, /VARIANT/);
  assert.match(html, /width="60" height="60" class="order-list__product-image"/);
});

test("with no checkout picture, Teeinblue's preview of the painting", async () => {
  assert.equal(src1(await render({title: 'Mug', image: 'x.jpg', properties: {_customization_image: PREVIEW}})), PREVIEW);
});

test('a line with no painting keeps its variant picture, and one with no picture draws none', async () => {
  assert.equal(src1(await render({title: 'Card', image: 'card.jpg', properties: {}})), 'VARIANT:card.jpg');
  assert.doesNotMatch(await render({title: 'Card', image: null, properties: {}}), /<img/);
});

test('the title in alt is escaped', async () => {
  assert.match(await render({title: 'Rex "the" <dog>', image: null, properties: {_customization_image: PREVIEW}}), /alt="Rex (&quot;|&#34;)the(&quot;|&#34;) &lt;dog&gt;"/);
});

test('the shipping emails loop over fulfillment lines: pointed at line.line_item, the painting shows', async () => {
  assert.equal(src1(await as('line.line_item', {line: {quantity: 1, line_item: gift}})), CHECKOUT);
  // pasted unchanged it reads no properties (CoWork, 10 Nov), which is why the pointer exists
  assert.doesNotMatch(await render({quantity: 1, line_item: gift}), /<img/);
});

test('a line inside a bundle group: pointed at component, the painting shows', async () => {
  assert.equal(src1(await as('component', {component: gift})), CHECKOUT);
});

test("a bundle group's top picture is the first painted component's, ahead of Shopify's chain", async () => {
  const g = (components, parent) => engine.parseAndRender(groupSrc, {line_item_group: {title: 'Mug', components}, parent_line_item: parent});
  assert.equal(src1(await g([{properties: {}}, gift], {image: 'p.jpg'})), CHECKOUT);
  assert.equal(src1(await g([{properties: {_customization_image: PREVIEW}}], null)), PREVIEW);
  assert.equal((await g([{properties: {}}], {image: 'p.jpg'})).trim(), 'PARENT');
  assert.equal((await g([], null)).trim(), 'PLACEHOLDER');
});
