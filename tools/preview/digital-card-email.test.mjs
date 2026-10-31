// The free digital card link in the order confirmation email (shopify/notifications/order-confirmation-digital-card.liquid):
// rendered with Shopify's filters stood in, its d must decode in the card page exactly as hs-card.js decodes it.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Liquid} from 'liquidjs';

const src = readFileSync(new URL('../../shopify/notifications/order-confirmation-digital-card.liquid', import.meta.url), 'utf8');
const engine = new Liquid();
engine.registerFilter('json', v => JSON.stringify(v ?? null));
engine.registerFilter('base64_url_safe_encode', v => Buffer.from(String(v), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_'));
// the card page's own decoding (hs-card.js)
const decode = d => JSON.parse(decodeURIComponent(escape(atob(d.replace(/-/g, '+').replace(/_/g, '/')))));
const line = (props) => ({properties: props});
const IMG = 'https://cdn.teeinblue.com/designs/x/x-1.png?printarea=default';
const render = items => engine.parseAndRender(src, {line_items: items, shop: {url: 'https://heartside.io'}});

test('the email links the first painted gift to its card, with the whole note, the dog and the recipient', async () => {
  const html = await render([line({Delivery: 'Ships in its own envelope'}), line({_tib_design_link_1: IMG, _hs_lines: "Line one.\nI'm in charge here, and I choose you.", _hs_answers: 'Dog: Pickle (he) | For: Jo-anne (friend) | x'})]);
  const href = /href="([^"]+)"/.exec(html)[1];
  assert.match(href, /^https:\/\/heartside\.io\/pages\/card\?d=[A-Za-z0-9_=-]+$/);
  assert.deepEqual(decode(href.split('d=')[1]), {img: IMG, note: "Line one.\nI'm in charge here, and I choose you.", dog: 'Pickle', to: 'Jo-anne'});
  assert.match(html, /A card from Pickle, free with your gift/);
  assert.doesNotMatch(html, /—/);
});

test("a gift for the buyer has no 'For' line, a named field wins, and accents survive", async () => {
  const html = await render([line({_tib_design_link_1: IMG, 'Your note': 'Bisous, Renée.', "Dog's name": 'Zoë', _hs_answers: 'Dog: Zoe (she) | For: Alex (self) | x'})]);
  assert.deepEqual(decode(/href="[^"]+d=([^"]+)"/.exec(html)[1]), {img: IMG, note: 'Bisous, Renée.', dog: 'Zoë', to: ''});
});

test('no painted gift with a note, no card block', async () => {
  assert.doesNotMatch(await render([line({_tib_design_link_1: IMG}), line({_hs_lines: 'A note'})]), /Open the card/);
});
