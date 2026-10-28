// A catalog shortcut must enter the gift form, never add a bare variant. Helio's collection
// quick add submits a variant with no photo, and every gift here needs the buyer's photo, so
// hs2.js turns each card's quick add into a Personalize link to the product page. Since 28 Oct
// that covers every card, whatever its handle: a Teeinblue campaign Update renamed two handles,
// and a fixed list of handles left the renamed one with a bare quick add. Only the Artist's touch
// add-on keeps Helio's button. Real hs2.js and hs2.css in Chromium, source and minified (Shopify's
// CDN serves it minified); the store is a stand-in and nothing leaves the page.
//
//   node --test tools/preview/catalog-personalization.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';

const root = new URL('../../', import.meta.url);
const source = readFileSync(new URL('shopify/assets/hs2.js', root), 'utf8');
const css = readFileSync(new URL('shopify/assets/hs2.css', root), 'utf8');
// current gifts, the legacy handles, and the draft handle the 28 Oct campaign Update gave the portrait
const gifts = ['your-dogs-illustrated-mug', 'your-dogs-personality-blanket', 'your-dogs-portrait', 'the-morning-mug', 'the-couch-blanket', 'the-framed-print', 'the-tree-ornament', 'heartside-city-screenprint-draft-2026-10-23'];
const card = (handle) => `<product-card><a href="https://heartside.io/products/${handle}">${handle}</a><quick-add-component><form action="https://heartside.io/cart/add" method="post"><button type="submit">Add</button></form></quick-add-component></product-card>`;
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: every gift card, renamed handles included, opens personalization; the add-on keeps its button`, async () => {
  const page = await browser.newPage();
  const errors = [], offsite = [];
  let bareAdds = 0;
  page.on('pageerror', (error) => errors.push(String(error)));
  // the stand-in store answers every product page with the gift form; nothing else leaves the page
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (!url.startsWith('https://heartside.io/')) { offsite.push(url); return route.abort(); }
    if (url.includes('/cart/add')) bareAdds++;
    await route.fulfill({status: 200, contentType: 'text/html', body: `<!doctype html><style>${css}</style><body>${[...gifts, 'artists-touch'].map(card).join('')}</body>`});
  });
  try {
    await page.goto('https://heartside.io/collections/all');
    await page.addScriptTag({content: minified ? transformSync(source, {minify: true}).code : source});
    await page.waitForFunction((n) => document.querySelectorAll('.hs2-catalog-personalize').length === n, gifts.length, {timeout: 10000});
    const cards = await page.locator('product-card').evaluateAll((all) => all.map((c) => ({
      handle: c.querySelector('a').textContent,
      form: !!c.querySelector('quick-add-component form'),
      link: c.querySelector('.hs2-catalog-personalize')?.getAttribute('href') || null,
      label: c.querySelector('.hs2-catalog-personalize')?.textContent || null,
    })));
    for (const c of cards.filter((x) => x.handle !== 'artists-touch')) {
      assert.equal(c.form, false, `${c.handle}: no bare quick add`);
      assert.equal(c.link, `https://heartside.io/products/${c.handle}`, c.handle);
      assert.equal(c.label, 'Personalize', c.handle);
    }
    const addon = cards.find((x) => x.handle === 'artists-touch');
    assert.deepEqual([addon.form, addon.link], [true, null], "the Artist's touch keeps Helio's own button");
    // a card loaded later (Helio's infinite scroll) is converted too, and its link opens the form
    await page.locator('body').evaluate((body, html) => body.insertAdjacentHTML('beforeend', html), card('heartside-personality-blanket-draft-2026-10-23'));
    await page.waitForFunction((n) => document.querySelectorAll('.hs2-catalog-personalize').length === n, gifts.length + 1, {timeout: 10000});
    await page.locator('product-card').last().locator('.hs2-catalog-personalize').click();
    await page.waitForURL('https://heartside.io/products/heartside-personality-blanket-draft-2026-10-23');
    assert.equal(bareAdds, 0, 'no bare add reached the cart');
    assert.deepEqual(errors, []);
    assert.deepEqual(offsite, []);
  } finally { await page.close(); }
});
