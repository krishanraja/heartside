// A catalog shortcut must enter the gift form, never add a bare variant.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome']
  .find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage();
const errors = [];
let bareAdds = 0;
page.on('pageerror', (error) => errors.push(String(error)));
await page.route('https://heartside.io/**', async (route) => {
  if (route.request().url().includes('/cart/add')) bareAdds++;
  await route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Gift form</h1>' });
});
const handles = ['your-dogs-illustrated-mug', 'your-dogs-personality-blanket', 'your-dogs-portrait', 'the-morning-mug', 'the-couch-blanket', 'the-framed-print', 'the-tree-ornament'];
const card = (handle) => `<product-card><a href="https://heartside.io/products/${handle}">${handle}</a><quick-add-component><form action="https://heartside.io/cart/add" method="post"><button type="submit">Add</button></form></quick-add-component></product-card>`;
await page.setContent(`<html><body>${handles.map(card).join('')}</body></html>`);
await page.addStyleTag({ path: path.join(root, 'shopify/assets/hs2.css') });
await page.addScriptTag({ path: path.join(root, 'shopify/assets/hs2.js') });
await page.waitForFunction(() => document.querySelectorAll('.hs2-catalog-personalize').length === 7);
const original = await page.locator('product-card').evaluateAll((cards) => cards.map((c) => ({
  form: !!c.querySelector('form'),
  link: c.querySelector('.hs2-catalog-personalize')?.getAttribute('href'),
  label: c.querySelector('.hs2-catalog-personalize')?.textContent
})));
if (original.some((x, i) => x.form || x.link !== `https://heartside.io/products/${handles[i]}` || x.label !== 'Personalize')) {
  throw new Error(`Catalog cards still offer a bare variant: ${JSON.stringify(original)}`);
}
await page.locator('body').evaluate((body, html) => body.insertAdjacentHTML('beforeend', html), card('your-dogs-personality-blanket'));
await page.waitForFunction(() => document.querySelectorAll('.hs2-catalog-personalize').length === 8);
await page.locator('product-card').last().locator('.hs2-catalog-personalize').click();
await page.waitForURL('https://heartside.io/products/your-dogs-personality-blanket');
if (bareAdds || errors.length) throw new Error(`Bare adds ${bareAdds}; page errors ${errors.join('; ')}`);
console.log('Catalog shortcuts for current and legacy gifts open personalization, including cards loaded later.');
await browser.close();
