// The footer shows one Contact link (28 Oct): Shopify's "Contact information" policy sat beside our
// Contact page. The policy shows only when no contact page is set. liquidjs over the footer's own
// links block, with Shopify's policy list as it comes from Settings > Policies.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Liquid} from 'liquidjs';

const footer = readFileSync(new URL('../../shopify/sections/hs-footer.liquid', import.meta.url), 'utf8');
const links = footer.slice(footer.indexOf('<nav class="hs-footer__links"'), footer.indexOf('</nav>') + '</nav>'.length);
const policies = [
  {title: 'Refund policy', url: '/policies/refund-policy'},
  {title: 'Privacy policy', url: '/policies/privacy-policy'},
  {title: 'Terms of service', url: '/policies/terms-of-service'},
  {title: 'Shipping policy', url: '/policies/shipping-policy'},
  {title: 'Contact information', url: '/policies/contact-information'}
];
const schema = JSON.parse(footer.split('{% schema %}')[1].split('{% endschema %}')[0]);
const defaults = Object.fromEntries(schema.settings.filter(s => s.id).map(s => [s.id, s.default]));
const render = s => new Liquid().parseAndRender(links, {shop: {policies}, s: {...defaults, ...s}});
const texts = html => [...html.matchAll(/<a [^>]*>([^<]*)/g)].map(m => m[1].trim());

test('the footer offers one Contact link, never Contact and Contact information side by side', async () => {
  const shown = texts(await render({}));
  assert.deepEqual(shown.filter(t => /^contact/i.test(t)), ['Contact']);
  for (const p of ['Refund policy', 'Privacy policy', 'Terms of service', 'Shipping policy']) assert.ok(shown.includes(p), p + ' stays');
  assert.match(await render({}), /href="\/pages\/contact"/);
});
test('with no contact page set, Shopify\'s contact information is the one contact link', async () => {
  const shown = texts(await render({contact_url: ''}));
  assert.deepEqual(shown.filter(t => /^contact/i.test(t)), ['Contact information']);
});
