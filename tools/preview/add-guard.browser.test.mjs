// Add to cart on a gift page (28 Oct acceptance). Order 1: "Yes, this is Honey." looked unticked when
// the add went through, so this proves in a real browser that our gate holds Add to cart while it is
// unticked, by mouse and by keyboard. With no photo the press said nothing at all; now the one thing
// left is said right after the button, and the photo step opens. Teeinblue's own "responsible for my
// personalization" box (a second tick after ours) follows our one tick and is put away (Krish).
// Real snippet, stylesheet and hs2.js functions; a Teeinblue stand-in whose own button handler
// refuses to add while its box is unticked, as its agreement setting does. Nothing leaves localhost.
//
//   node --test tools/preview/add-guard.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {Liquid} from 'liquidjs';
import {transformSync} from 'esbuild';

const root = new URL('../../', import.meta.url);
const source = readFileSync(new URL('shopify/assets/hs2.js', root), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const css = readFileSync(new URL('shopify/assets/hs2.css', root), 'utf8');
const ID = 'cccccccc-3333-4333-8333-cccccccccccc';
const fns = () => ['possessive', 'blanketNativeError', 'invalidateBlanketReview', 'syncTibAgreement', 'blanketReviewAccepted', 'blanketReviewKey', 'bindBlanketRecovery', 'nudgeReview', 'guardGiftPhoto', 'blockedAdd', 'startedAdd',
  'hsProps', 'withHsProps', 'checkoutImageConfig', 'checkoutImageStatus', 'prepareCheckoutCart', 'onCartAdd'].map(section).join('\n');
const stubs = `var blanketAcceptedKey='', reduced=true, usePhoto={}, at={saved:false,requested:false,pending:false};
  function nativeArtworkPurchase(){return true;} function cityArtPreview(){return false;} function giftView(){return false;}
  function blanketUploadPending(){return at.pending;} function nativeBlanketInputsReady(){return true;} function nativePurchaseReady(){return true;}
  function cityArtSaved(){return at.saved;} function artRequested(){return at.requested;} function restoredArtworkAvailable(){return false;} function restoredArtworkChosen(){return false;}
  function artRequestKey(){return 'request';} function cityArtSource(){return 'https://localhost/art.png';} function answer(k){return k==='dog'?'Honey':'';}
  function syncBlanketProperties(){} function sendBlanketPhoto(){} function updateBlanketPurchaseStatus(){} function track(){}
  function blanketPurchaseStatus(m){var el=document.querySelector('[data-hs2-artwork-status]');if(el)el.textContent=m;}
  bindBlanketRecovery(); guardGiftPhoto(); onCartAdd(function(){});`;
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: Add to cart waits for "Yes, this is Honey.", says why beside the button, and one tick answers Teeinblue's box`, async () => {
  const native = await new Liquid().parseAndRender(readFileSync(new URL('shopify/snippets/hs-native-artwork.liquid', root), 'utf8'), {settings: {native_artwork_kind: 'mug', blanket_purchase: false}});
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>
<div class="hs2"><div class="hs2-product" id="buy" data-hs2-artwork-kind="mug" data-hs2-purchase-enabled="true"><div class="hs2-product__info">${native}
<div class="tee-form-wrapper"><div class="tee-campaign">
<div class="tee-field tee-field--photo"><div class="tee-photo"><div class="tee-photo-action"><button type="button" class="tee-btn tee-btn--upload">Choose an image</button></div></div></div>
<div style="height:1400px"></div>
<div class="tee-checkbox-wrapper"><label class="tee-checkbox__label"><input class="tee-checkbox__input" type="checkbox"> I am responsible for my personalization</label></div>
<div class="tee-form-actions"><div class="tee-form-action"><button type="button" class="tee-btn tee-btn--atc" id="teeAtcButton">Add to cart</button></div></div>
</div></div><form id="hs2-product-form"></form></div></div></div>
<script>
  // Teeinblue's own handler, on its button: its agreement box must be ticked, then it posts its add
  window.tib = {refused: 0, posted: 0, invalid: false};
  document.querySelector('#teeAtcButton').addEventListener('click', function () {
    if (!document.querySelector('.tee-checkbox__input').checked) { window.tib.refused++; return; }
    // its own check of a required field stops the add and marks the field
    if (window.tib.invalid) { document.querySelector('.tee-field--photo').classList.add('tee-field--invalid'); return; }
    window.tib.posted++;
    fetch('/cart/add.js', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: 11, quantity: 1, properties: {_customization_id: '${ID}'}})});
  });
</script></body></html>`;
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  const offsite = [], errors = [], adds = [];
  let land, landed = new Promise(r => { land = r; });
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost') { offsite.push(url.href); return route.abort(); }
    if (url.pathname === '/') return route.fulfill({contentType: 'text/html', body: html});
    if (url.pathname === '/cart/add.js') { adds.push(route.request().postDataJSON()); await landed; return route.fulfill({contentType: 'application/json', body: JSON.stringify({id: 1, variant_id: 11, quantity: 1})}); }
    return route.fulfill({status: 404, body: ''});
  });
  try {
    await page.goto('http://localhost/');
    const code = fns() + '\n' + stubs;
    await page.addScriptTag({content: minified ? transformSync(code, {minify: true}).code : code});
    const note = () => page.evaluate(() => { const n = document.querySelector('[data-hs2-add-note]'); return n && !n.hidden ? {text: n.textContent, after: n.previousElementSibling && n.previousElementSibling.id, role: n.getAttribute('role')} : null; });
    const tibBox = page.locator('.tee-checkbox__input');

    // no photo yet: blocked, said beside the button, and the photo step opens with its button focused
    await page.click('#teeAtcButton');
    assert.equal(adds.length, 0);
    assert.deepEqual(await note(), {text: "Add Honey's photo first. Buddy paints from it.", after: 'teeAtcButton', role: 'status'});
    const photo = await page.evaluate(() => { const r = document.querySelector('.tee-field--photo').getBoundingClientRect(); return {inView: r.top >= 0 && r.bottom <= innerHeight, focused: document.activeElement === document.querySelector('.tee-btn--upload')}; });
    assert.deepEqual(photo, {inView: true, focused: true}, 'the photo step is open for the next tap');

    // the photo Buddy was given shows as one card, with Teeinblue's field clip-hidden: the press points at the card
    await page.evaluate(() => { document.getElementById('buy').classList.add('hs2-photo-choice'); document.querySelector('[data-hs2-blanket-photo]').hidden = false; scrollTo(0, 0); });
    await page.click('#teeAtcButton');
    assert.equal(adds.length, 0);
    assert.equal((await note()).text, "Use Honey's photo first, or a different one. Buddy paints from it.");
    const card = await page.evaluate(() => { const r = document.querySelector('[data-hs2-blanket-photo]').getBoundingClientRect(); return {inView: r.top >= 0 && r.bottom <= innerHeight, focused: document.activeElement === document.querySelector('[data-hs2-blanket-create]')}; });
    assert.deepEqual(card, {inView: true, focused: true}, 'the card is the photo step while it shows');
    await page.evaluate(() => { document.getElementById('buy').classList.remove('hs2-photo-choice'); document.querySelector('[data-hs2-blanket-photo]').hidden = true; });

    // painting: said plainly, still blocked
    await page.evaluate(() => { at.requested = true; at.pending = true; });
    await page.click('#teeAtcButton');
    assert.equal(adds.length, 0); assert.equal((await note()).text, 'Still painting Honey. Most take 1 to 3 minutes.');

    // the painting is in, "Yes, this is Honey." unticked: blocked by mouse and by keyboard, and pointed at the tick
    await page.evaluate(() => { at.pending = false; at.saved = true; document.querySelector('[data-hs2-artwork-accept-wrap]').hidden = false; document.querySelector('[data-hs-art]').hidden = false; document.querySelector('[data-hs-art-done]').hidden = false; });
    await page.click('#teeAtcButton');
    await page.focus('#teeAtcButton'); await page.keyboard.press('Enter');
    assert.equal(adds.length, 0, 'our gate holds Add to cart while the review is unticked');
    assert.equal(await page.evaluate(() => window.tib.posted), 0);
    assert.equal((await note()).text, "Tick the box under Honey's painting first.");
    assert.equal(await tibBox.isChecked(), false, "Teeinblue's box is untouched until ours is ticked");
    assert.equal(await page.locator('.tee-checkbox-wrapper').isVisible(), true, 'a box we have not recognized yet stays on show');

    // one tick: ours, and Teeinblue's follows it, once, and is put away
    await page.locator('[data-hs2-artwork-accept-wrap]').click();
    assert.equal(await page.locator('[data-hs2-artwork-accept]').isChecked(), true);
    assert.equal(await tibBox.isChecked(), true);
    assert.equal(await page.locator('.tee-checkbox-wrapper').isVisible(), false);
    // Teeinblue's own check stops an add: the "Saving" line does not stick
    await page.evaluate(() => { window.tib.invalid = true; });
    await page.click('#teeAtcButton');
    await page.waitForFunction(() => { const n = document.querySelector('[data-hs2-add-note]'); return n && n.hidden; });
    await page.evaluate(() => { window.tib.invalid = false; document.querySelector('.tee-field--photo').classList.remove('tee-field--invalid'); });
    // the add goes ahead: what is happening is said beside the button until it lands
    await page.click('#teeAtcButton');
    await page.waitForFunction(() => window.tib.posted === 1);
    assert.equal((await note()).text, "Saving Honey's design.");
    land(); await page.waitForTimeout(150);
    assert.equal(adds.length, 1, 'one add per press'); assert.equal(await page.evaluate(() => window.tib.refused), 0, 'Teeinblue did not ask for a second tick');
    assert.equal(adds[0].properties._customization_id, ID);
    assert.equal(await note(), null, 'the line clears once the add lands');

    // a change after the review clears both ticks, ours and Teeinblue's
    await page.evaluate(() => invalidateBlanketReview());
    assert.equal(await page.locator('[data-hs2-artwork-accept]').isChecked(), false);
    assert.equal(await tibBox.isChecked(), false);
    await page.click('#teeAtcButton');
    assert.equal(adds.length, 1); assert.equal(await page.evaluate(() => window.tib.posted), 1);

    // a box with other words is never ticked for the buyer
    await page.evaluate(() => { document.querySelector('.tee-checkbox__label').lastChild.nodeValue = ' Gift wrap this'; document.querySelector('.tee-checkbox-wrapper').removeAttribute('data-hs2-tib-agreement'); syncTibAgreement(true); });
    assert.equal(await tibBox.isChecked(), false);
    assert.equal(await page.locator('.tee-checkbox-wrapper').isVisible(), true);
    assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
  } finally { await page.close(); }
});

// Krish, 28 Oct: our one tick also answers Teeinblue's "responsible for my personalization" box, so
// our sentence carries that responsibility itself: the photo on every gift, and the words where
// the gift has them (the blanket has none).
test("our confirmation carries Teeinblue's responsibility clause, words only where the gift has them", async () => {
  const snippet = readFileSync(new URL('shopify/snippets/hs-native-artwork.liquid', root), 'utf8');
  const say = async settings => (await new Liquid().parseAndRender(snippet, {settings})).replace(/\s+/g, ' ');
  assert.match(await say({native_artwork_kind: 'mug', blanket_purchase: false}), /I want this design on my gift\. I'm responsible for the photo and words I chose\./);
  assert.match(await say({blanket_purchase: true}), /I want this design on my gift\. I'm responsible for the photo I chose\./);
});
