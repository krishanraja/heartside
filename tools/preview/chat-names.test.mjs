// The chat's names and the choose button in a real browser (28 Oct): a long dog name is counted as
// it is typed and never cut, Next waits with one-tap short forms, the printed form comes back on
// Back, a gift for the buyer is spoken to them, and the choose button answers the tap at once.
// Real Chromium, the real hs3.js, a stand-in page; nothing leaves localhost and the AI is off.
//
//   node --test tools/preview/chat-names.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs3.js', import.meta.url), 'utf8');
const config = {
  typedUrl: '', composeUrl: '', ai: false, artworkCandidates: true, blanketPurchase: false, corePurchase: true, ornamentBundle: false, bundleOffer: false,
  mug: {colors: [{name: 'Black', hex: '#050505', id: 11, left: '/m-left.png', right: '/m-right.png'}, {name: 'Red', hex: '#D9292C', id: 12, left: '/r-left.png', right: '/r-right.png'}]},
  gifts: {
    mug: {url: '/products/fixture-mug', handle: 'fixture-mug', title: 'Mug', price: 45, priceMax: 45, minVariant: 11, images: [{src: '/m-right.png', alt: 'Example mug'}]},
    blanket: {url: '/products/fixture-blanket', handle: 'fixture-blanket', title: 'Blanket', price: 129, priceMax: 129, minVariant: 21, images: [{src: '/b.png', alt: 'Example blanket'}]},
    print: {url: '/products/fixture-portrait', handle: 'fixture-portrait', title: 'Portrait', price: 59, priceMax: 119, minVariant: 34, images: [{src: '/p.png', alt: 'Example portrait'}]},
    ornament: {url: null, handle: null, price: null}
  }
};
const page = js => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>
<div class="hs3" data-hs3><script type="application/json" data-hs3-config>${JSON.stringify(config)}</script>
<div class="hs3__frame" data-hs3-screen="hero"><div class="hs3-hero"><h1>Your dog loves you too.</h1>
<button type="button" data-hs3-start>Start with your dog</button></div></div>
<p data-hs3-privacy hidden>Privacy note.</p></div>
<script>${js}</script></body></html>`;

async function open(minified) {
  const browser = await chromium.launch();
  const context = await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
  const tab = await context.newPage();
  const errors = [], offsite = [], products = [];
  tab.on('pageerror', e => errors.push(String(e)));
  const js = minified ? transformSync(source, {minify: true}).code : source;
  await tab.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost') { offsite.push(url.href); return route.abort(); }
    if (url.pathname === '/') return route.fulfill({contentType: 'text/html', body: page(js)});
    // a product page: 204 No Content, so the browser stays on the chat and the tapped button can be read
    if (url.pathname.startsWith('/products/')) { products.push(url.pathname + url.search); return route.fulfill({status: 204, body: ''}); }
    return route.fulfill({status: 404, body: ''});
  });
  return {browser, tab, errors, offsite, products};
}
const step = tab => new URL(tab.url()).searchParams.get('step');
const state = tab => tab.evaluate(() => JSON.parse(sessionStorage.getItem('hs3-gift')));
const bridge = tab => tab.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-review') || '{}'));

for (const minified of [false, true]) {
  const mode = minified ? 'minified' : 'source';
  test(`${mode}: a long dog name is counted as it is typed, waits at Next, and one tap shortens it`, async () => {
    const {browser, tab, errors, offsite} = await open(minified);
    try {
      await tab.goto('http://localhost/');
      await tab.click('[data-hs3-start]');
      await tab.fill('#hs3-dog', "Sir Biscuit O'Malley");
      assert.equal(await tab.inputValue('#hs3-dog'), "Sir Biscuit O'Malley", 'nothing is cut while typing');
      assert.equal((await tab.textContent('#hs3-dog-hint p')).trim(), '"Sir Biscuit O\'Malley" is 20 letters. 14 fit in "Love, …" on the gift.');
      assert.equal((await bridge(tab)).dog, '', 'the product page never gets a name that would print cut');
      await tab.click('[data-hs3="next"]');
      assert.equal(step(tab), 'dog', 'Next waits');
      await tab.click('#hs3-dog-hint button:has-text("Sir Biscuit")');
      assert.equal(await tab.inputValue('#hs3-dog'), 'Sir Biscuit');
      assert.equal((await tab.textContent('#hs3-dog-hint')).trim(), '3 letters left. Up to 14 fit in the signature.');
      await tab.click('[data-hs3="next"]');
      assert.equal(step(tab), 'person');
      assert.equal((await bridge(tab)).dog, 'Sir Biscuit');
      // the recipient's box holds 14 and counts the same way
      await tab.fill('#hs3-rec', 'Maximilianaaaaaaaa');
      assert.equal(await tab.inputValue('#hs3-rec'), 'Maximilianaaaa');
      assert.equal((await tab.textContent('#hs3-rec-hint')).trim(), 'No letters left.');
      // an all-caps name prints recased, and Back shows it the way it will print
      await tab.goBack(); await tab.waitForFunction(() => new URL(location.href).searchParams.get('step') === 'dog');
      await tab.fill('#hs3-dog', 'PICKLE'); await tab.click('[data-hs3="next"]');
      assert.equal(step(tab), 'person');
      assert.match(await tab.textContent('.hs3-echo'), /^Pickle$/);
      await tab.goBack(); await tab.waitForFunction(() => new URL(location.href).searchParams.get('step') === 'dog');
      assert.equal(await tab.inputValue('#hs3-dog'), 'Pickle');
      assert.equal((await state(tab)).dog, 'Pickle');
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await browser.close(); }
  });

  test(`${mode}: mixed-case hyphenated recipient and explicit reset`, async () => {
    const {browser, tab, errors} = await open(minified);
    try {
      await tab.goto('http://localhost/');
      await tab.click('[data-hs3-start]');
      await tab.fill('#hs3-dog', 'Pickle'); await tab.click('[data-hs3="next"]');
      await tab.fill('#hs3-rec', 'Jo-anne'); await tab.click('[data-hs3="next"]');
      assert.equal((await state(tab)).rec, 'Jo-Anne');
      await tab.evaluate(() => sessionStorage.setItem('hs-artwork-choices-v1', JSON.stringify({style:'comic',tone:'hilarious'})));
      await tab.goto('http://localhost/?hs3=reset');
      assert.equal(await tab.evaluate(() => sessionStorage.getItem('hs-artwork-choices-v1')), null);
      assert.equal((await state(tab)).dog, '');
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  test(`${mode}: a gift for "Me" is spoken to the buyer, and the choose button answers the tap at once`, async () => {
    const {browser, tab, errors, offsite, products} = await open(minified);
    try {
      await tab.goto('http://localhost/');
      await tab.click('[data-hs3-start]');
      assert.equal(await tab.getAttribute('[data-hs3="pro"][data-v="she"]', 'aria-pressed'), 'false', 'no pronoun is chosen for the buyer');
      await tab.fill('#hs3-dog', 'Mochi'); await tab.click('[data-hs3="next"]');
      await tab.click('[data-hs3="rel"][data-v="self"]');
      await tab.fill('#hs3-rec', 'Sam'); await tab.click('[data-hs3="next"]');
      assert.match(await tab.textContent('.hs3-bubble'), /Lucky you\. What does Mochi do when you come home\?/);
      await tab.click('[data-hs3="chip"][data-v="door"]'); await tab.waitForSelector('[data-hs3="chip"][data-v="weekends"]');
      await tab.click('[data-hs3="chip"][data-v="weekends"]');
      assert.match(await tab.textContent('[data-hs3="chip"][data-v="bed"]'), /^Your side of the bed$/);
      await tab.click('[data-hs3="chip"][data-v="bed"]');
      await tab.click('[data-hs3="chip"][data-v="coffee"]');
      assert.doesNotMatch(await tab.textContent('.hs3-bubble'), /toast/i);
      await tab.click('[data-hs3="chip"][data-v="best"]');
      await tab.click('[data-hs3="next"]');
      await tab.waitForSelector('.hs3__frame[data-hs3-screen="reveal"]');
      assert.match(await tab.textContent('.hs3-h2'), /^Mochi's gift for you$/);
      assert.equal((await tab.locator('.hs3-note__for').first().textContent()).trim(), 'For you');
      assert.equal(await tab.locator('.hs3-swatches').count(), 0, 'no mug color before the gift is chosen');
      await tab.click('[data-hs3="them"]');
      await tab.waitForSelector('.hs3__frame[data-hs3-screen="choose"]');
      assert.match(await tab.textContent('.hs3-h2'), /^Mochi's gift for you$/);
      assert.equal(await tab.locator('[data-hs3="ship"]').count(), 0, 'a gift for the buyer ships to the buyer');
      assert.equal(await tab.locator('.hs3-swatches').count(), 1, 'the mug color is asked here');
      const add = tab.locator('[data-hs3="add"]');
      await add.click();
      await tab.waitForFunction(() => document.querySelector('[data-hs3="add"]').getAttribute('aria-busy') === 'true');
      assert.equal((await add.textContent()).trim(), "Opening Mochi's mug…");
      assert.match(await add.getAttribute('class'), /is-busy/);
      await add.click({force: true}); // a second, impatient tap on the busy button
      await tab.waitForTimeout(100);
      assert.equal(products.length, 1, 'a second tap opens nothing more');
      assert.match(products[0], /^\/products\/fixture-mug\?variant=11$/);
      assert.equal((await bridge(tab)).hs_ship_to, 'Me (the buyer)');
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await browser.close(); }
  });
}
