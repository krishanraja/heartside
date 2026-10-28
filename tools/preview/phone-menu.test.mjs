// The phone menu (CoWork Part B, 28 Oct): Helio's drawer showed three product cards, the framed
// portrait's $119 and the blanket's blank template picture. Heartside's own list, rendered by the
// footer with Shopify's prices, goes at the top of Helio's real drawer markup and the cards hide.
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {Liquid} from 'liquidjs';
import {transformSync} from 'esbuild';

const root = new URL('../../', import.meta.url);
const source = readFileSync(new URL('shopify/assets/hs2.js', root), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const header = readFileSync(new URL('tools/preview/fixtures/helio-header.html', root), 'utf8');
const css = readFileSync(new URL('shopify/assets/hs-brand.css', root), 'utf8');
const footer = readFileSync(new URL('shopify/sections/hs-footer.liquid', root), 'utf8');
const engine = new Liquid();
engine.registerFilter('money_without_trailing_zeros', cents => '$' + (cents / 100).toFixed(2).replace(/\.00$/, ''));
const product = (handle, min, varies) => ({id: 1, url: '/products/' + handle, price_min: min, price_varies: varies});
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: the drawer carries Heartside's menu with Shopify's prices, not Helio's cards`, async () => {
  const tpl = footer.slice(footer.indexOf('{%- assign hs_mug'), footer.indexOf('</template>') + '</template>'.length);
  const menu = await engine.parseAndRender(tpl, {routes: {root_url: '/'}, s: {shipping_line: 'Free US shipping on every order.', answers_url: '/blogs/answers', answers_label: 'Answers', contact_url: '/pages/contact', contact_label: 'Contact'},
    all_products: {'your-dogs-illustrated-mug': product('your-dogs-illustrated-mug', 4500, false), 'your-dogs-portrait': product('your-dogs-portrait', 5900, true), 'your-dogs-personality-blanket': product('your-dogs-personality-blanket', 12900, false)}});
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  await page.route('**/*', r => r.request().url() === 'https://hs.test/' ? r.fulfill({contentType: 'text/html', body: `<!doctype html><style>${css}</style>${header}${menu}`}) : r.abort());
  try {
    await page.goto('https://hs.test/');
    const code = section('heartsideMenu');
    await page.addScriptTag({content: (minified ? transformSync(code, {minify: true}).code : code) + ';heartsideMenu();heartsideMenu();'});
    const r = await page.evaluate(() => {
      document.querySelector('#Details-menu-drawer-container').open = true;
      const drawer = document.querySelector('.header .menu-drawer'), list = drawer.querySelectorAll('.hs-menu');
      const cards = drawer.querySelector('.menu-drawer__featured-content');
      return {count: list.length, afterClose: list[0] && list[0].previousElementSibling && list[0].previousElementSibling.classList.contains('menu-drawer__close-button'),
        items: [...drawer.querySelectorAll('.hs-menu li a')].map(a => a.innerText.replace(/\s+/g, ' ').trim() + ' ' + a.getAttribute('href')),
        start: drawer.querySelector('.hs-menu__start').getAttribute('href'), cardsHidden: !cards || getComputedStyle(cards).display === 'none',
        text: drawer.innerText};
    });
    assert.equal(r.count, 1, 'once, however often it runs'); assert.ok(r.afterClose);
    assert.deepEqual(r.items, ['Illustrated mug $45 /products/your-dogs-illustrated-mug', 'Portrait From $59 /products/your-dogs-portrait', 'Sherpa blanket $129 /products/your-dogs-personality-blanket']);
    assert.equal(r.start, '/'); assert.ok(r.cardsHidden, "Helio's cards are gone");
    assert.doesNotMatch(r.text, /\$119/); assert.match(r.text, /Free US shipping on every order\./);
  } finally { await page.close(); }
});
